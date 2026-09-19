import { z } from 'astro/zod';
import { createWritingMetadataSchema, createWritingTranslationSchema } from '../../src/lib/content-schema';
import {
  COVER_EXTENSIONS,
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
const IMAGE_EXTENSIONS = new Set<string>([...COVER_EXTENSIONS, 'gif']);
const metadataSchema = createWritingMetadataSchema(z.any());
const translationSchema = createWritingTranslationSchema();

const extensionOf = (name: string) => name.split('.').at(-1)?.toLowerCase() ?? '';

function checkArticle(item: WritingCase, now: Date): string[] {
  const label = `글 "${item.slug}"`;
  const problems: string[] = [];

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
    problems.push(`${label}: 슬러그(폴더 이름)는 소문자 영문, 숫자, 하이픈만 쓸 수 있습니다. 예: my-first-essay`);
  }

  // Reuse the site's own schema so these checks can never drift from the build.
  const meta = metadataSchema.safeParse(item.meta);
  if (!meta.success) {
    for (const issue of meta.error.issues) {
      const field = issue.path.join('.');
      if (field === 'featured' || issue.message.includes('future date')) continue; // reported below in Korean
      problems.push(`${label}: meta.yaml ${field}: ${issue.message}`);
    }
  }

  if (item.featured && item.type !== 'essay') {
    problems.push(`${label}: 대표 글(featured)은 Essay만 될 수 있습니다. Note는 featured: false여야 합니다.`);
  }
  if (!item.draft && new Date(`${item.publishedAt}T00:00:00Z`).getTime() > now.getTime()) {
    problems.push(`${label}: 공개된 글에는 미래 날짜(${item.publishedAt})를 쓸 수 없습니다.`);
  }

  for (const language of ['ko', 'en'] as const) {
    const translation = item.translations[language];
    const file = `${language}.mdx`;

    const parsed = translationSchema.safeParse({ title: translation.title, description: translation.description });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(`${label}: ${file} ${issue.path[0] === 'title' ? '제목(title)' : '설명(description)'}이 비어 있습니다.`);
      }
    }
    if (!translation.body) problems.push(`${label}: ${file} 본문이 비어 있습니다.`);

    if (!item.draft) {
      if (translation.title.startsWith('[Draft]') || translation.description.startsWith('[Draft]')) {
        problems.push(`${label}: ${file} 제목·설명에 [Draft] 표시가 남아 있습니다. 공개하기 전에 지우세요.`);
      }
      if (translation.body === GENERATED_BODIES[language]) {
        problems.push(`${label}: ${file} 본문이 생성된 기본 문구 그대로입니다.`);
      }
    }
  }

  const hangul = /[가-힣]/;
  const latin = /[A-Za-z]/;
  if (!hangul.test(item.translations.ko.title + item.translations.ko.body)) {
    problems.push(`${label}: ko.mdx에 한글이 없습니다. 영어 글이 한국어 파일에 들어갔는지 확인하세요.`);
  }
  if (!latin.test(item.translations.en.title + item.translations.en.body)) {
    problems.push(`${label}: en.mdx에 영문이 없습니다. 한국어 글이 영어 파일에 들어갔는지 확인하세요.`);
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

  for (const item of cases) problems.push(...checkArticle(item, now));

  const featuredEssays = cases.filter((item) => !item.draft && item.type === 'essay' && item.featured);
  if (featuredEssays.length > 1) {
    problems.push(`대표 글(featured: true)로 표시된 공개 Essay는 하나만 가능합니다. 지금: ${featuredEssays.map((item) => item.slug).join(', ')}`);
  }

  return problems;
}
