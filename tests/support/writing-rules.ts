import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { isReservedWritingSlug } from '../../scripts/writing-categories.mjs';
import { createWritingMetadataSchema, createWritingTranslationSchema } from '../../src/lib/content-schema';
import {
  CATEGORIES_FILE,
  COVER_EXTENSIONS,
  loadCategories,
  readWritingCase,
  writingDirectories,
  type Language,
  type WritingCase,
} from './writing-content';

/**
 * The rules every article in the repository must follow. The checks read the
 * writing that exists and approve it when it follows the rules, so adding,
 * renaming, or converting an article never requires editing a test.
 */

// The placeholder bodies written by `npm run new:writing`.
const GENERATED_BODIES: Record<Language, string> = {
  ko: '한국어 본문을 작성하세요.',
  en: 'Write the English body here.',
};
// Zero-width space, word joiner, and byte-order mark.
const INVISIBLE_CHARACTERS = /[​⁠﻿]/;
const IMAGE_EXTENSIONS =new Set<string>([...COVER_EXTENSIONS, 'gif']);
const translationSchema = createWritingTranslationSchema();

const extensionOf = (name: string) => name.split('.').at(-1)?.toLowerCase() ?? '';

/** `categorySlugs` is undefined when the registry itself is broken (reported separately). */
function checkArticle(item: WritingCase, now: Date, categorySlugs: string[] | undefined): string[] {
  const label = `글 "${item.slug}"`;
  const problems: string[] = [];

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
    problems.push(`${label}: 슬러그(폴더 이름)는 소문자 영문, 숫자, 하이픈만 쓸 수 있습니다. 예: my-first-essay`);
  }
  if (isReservedWritingSlug(item.slug)) {
    problems.push(`${label}: "${item.slug}"는 카테고리 페이지 주소(/writing/category/)에 쓰는 예약어라 슬러그(폴더 이름)로 쓸 수 없습니다. 다른 이름을 쓰세요.`);
  }

  // Reuse the site's own schema so these checks can never drift from the build.
  const meta = createWritingMetadataSchema(z.any(), categorySlugs ?? []).safeParse(item.meta);
  if (!meta.success) {
    for (const issue of meta.error.issues) {
      const field = issue.path.join('.');
      if (field === 'category' || issue.message.includes('future date')) continue; // reported below in Korean
      problems.push(`${label}: meta.yaml ${field}: ${issue.message}`);
    }
  }

  if (categorySlugs && !categorySlugs.includes(item.category)) {
    const registered = `등록된 카테고리: ${categorySlugs.join(', ')}. 새 카테고리는 ${CATEGORIES_FILE}에 먼저 추가하세요.`;
    if (item.meta.category === undefined) {
      const legacy = item.meta.type === undefined ? '' : ' 예전 type: 줄은 category: 줄로 바꾸세요.';
      problems.push(`${label}: meta.yaml에 카테고리(category)가 없습니다.${legacy} ${registered}`);
    } else {
      problems.push(`${label}: meta.yaml 카테고리(category) "${item.category}"는 등록되지 않았습니다. ${registered}`);
    }
  }
  if (!item.draft && new Date(`${item.publishedAt}T00:00:00Z`).getTime() > now.getTime()) {
    problems.push(`${label}: 공개된 글에는 미래 날짜(${item.publishedAt})를 쓸 수 없습니다.`);
  }

  for (const language of ['ko', 'en'] as const) {
    const translation = item.translations[language];
    const file = `${language}.md`;

    const parsed = translationSchema.safeParse({ title: translation.title });
    if (!parsed.success) problems.push(`${label}: ${file} 제목(title)이 비어 있습니다.`);
    for (const key of translation.extraKeys) {
      problems.push(`${label}: ${file}에 지원하지 않는 항목(${key})이 있습니다. 글에는 제목(title)만 씁니다. 지우세요.`);
    }
    if (!translation.body) problems.push(`${label}: ${file} 본문이 비어 있습니다.`);

    if (!item.draft) {
      if (translation.title.startsWith('[Draft]')) {
        problems.push(`${label}: ${file} 제목에 [Draft] 표시가 남아 있습니다. 공개하기 전에 지우세요.`);
      }
      if (translation.body === GENERATED_BODIES[language]) {
        problems.push(`${label}: ${file} 본문이 생성된 기본 문구 그대로입니다.`);
      }
    }
  }

  // Zero-width characters ride along when text is pasted from blogs or web
  // editors. They are invisible but stop Markdown from seeing `##`, `-`, or `>`.
  for (const language of ['ko', 'en'] as const) {
    const lines = readFileSync(join(item.directory, `${language}.md`), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (INVISIBLE_CHARACTERS.test(line)) {
        problems.push(`${label}: ${language}.md ${index + 1}번째 줄에 보이지 않는 문자(폭 없는 공백 등)가 있습니다. 지우세요.`);
      }
    });
  }

  const hangul = /[가-힣]/;
  const latin = /[A-Za-z]/;
  if (!hangul.test(item.translations.ko.title + item.translations.ko.body)) {
    problems.push(`${label}: ko.md에 한글이 없습니다. 영어 글이 한국어 파일에 들어갔는지 확인하세요.`);
  }
  if (!latin.test(item.translations.en.title + item.translations.en.body)) {
    problems.push(`${label}: en.md에 영문이 없습니다. 한국어 글이 영어 파일에 들어갔는지 확인하세요.`);
  }

  if (item.coverFiles.length > 1) {
    problems.push(`${label}: 사진(cover.*)은 글마다 한 장만 넣을 수 있습니다. 찾은 파일: ${item.coverFiles.join(', ')}`);
  }
  const usesMetaCover = item.meta.coverImage !== undefined;
  if (item.coverFiles.length === 0 && !usesMetaCover && item.files.some((name) => /^cover\.alt\.(ko|en)\.txt$/.test(name))) {
    problems.push(`${label}: 대체 텍스트 파일(cover.alt.*.txt)은 있는데 사진(cover.<확장자>)이 없습니다.`);
  }

  const referenceText = [item.translations.ko.body, item.translations.en.body, JSON.stringify(item.meta)].join('\n');
  for (const name of item.files) {
    if (!IMAGE_EXTENSIONS.has(extensionOf(name)) || item.coverFiles.includes(name)) continue;
    if (!referenceText.includes(name)) {
      problems.push(`${label}: 사진 "${name}"은 화면에 쓰이지 않습니다. 표지로 쓰려면 이름을 cover.${extensionOf(name)}처럼 cover.<확장자>로 바꾸고, 본문에서 쓰려면 본문에 파일 이름을 적으세요.`);
    }
  }

  return problems;
}

export function checkWriting(options: { root?: string; now?: Date; fixtures?: boolean } = {}): string[] {
  const root = options.root ?? process.cwd();
  const now = options.now ?? new Date();
  const problems: string[] = [];
  const cases: WritingCase[] = [];

  for (const entry of writingDirectories(root, { fixtures: options.fixtures })) {
    try {
      cases.push(readWritingCase(entry.directory, entry.slug, entry.source));
    } catch (error) {
      problems.push(`글 "${entry.slug}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let categorySlugs: string[] | undefined;
  try {
    categorySlugs = loadCategories(root).map(({ slug }) => slug);
  } catch (error) {
    problems.push(`${CATEGORIES_FILE}: 카테고리 목록을 읽을 수 없습니다. ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const item of cases) problems.push(...checkArticle(item, now, categorySlugs));

  const featured = cases.filter((item) => !item.draft && item.featured).map((item) => item.slug).sort();
  if (featured.length > 1) {
    problems.push(`대표 글(featured: true)로 표시된 공개 글은 하나만 가능합니다. 지금: ${featured.join(', ')}`);
  }

  return problems;
}
