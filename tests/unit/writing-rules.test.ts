import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkWriting } from '../support/writing-rules';

const roots: string[] = [];
const GOOD_META = 'publishedAt: 2025-01-01\ncategory: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n';
// A registry of the test's own, so the checks never depend on the real category list.
const CATEGORIES = '- slug: essay\n  name: { ko: 에세이, en: Essay }\n  newsletter: true\n- slug: note\n  name: { ko: 노트, en: Note }\n  newsletter: false\n';
const articleFile = (title: string, body: string, extraFront = '') => `---\ntitle: ${title}\n${extraFront}---\n\n${body}\n`;

function project(
  articles: Record<string, { meta?: string; ko?: string; en?: string; files?: Record<string, string> }>,
  categories: string | null = CATEGORIES,
) {
  const root = mkdtempSync(join(tmpdir(), 'writing-rules-'));
  roots.push(root);
  mkdirSync(join(root, 'src/content'), { recursive: true });
  if (categories !== null) writeFileSync(join(root, 'src/content/categories.yaml'), categories);
  for (const [slug, article] of Object.entries(articles)) {
    const directory = join(root, 'src/content/writing', slug);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'meta.yaml'), article.meta ?? GOOD_META);
    writeFileSync(join(directory, 'ko.md'), article.ko ?? articleFile('제목', '한국어 본문입니다.'));
    writeFileSync(join(directory, 'en.md'), article.en ?? articleFile('Title', 'English body text.'));
    for (const [name, text] of Object.entries(article.files ?? {})) writeFileSync(join(directory, name), text);
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const problemsFor = (articles: Parameters<typeof project>[0]) => checkWriting({ root: project(articles) });

describe('writing rules', () => {
  it('approves the writing that exists in this repository', () => {
    expect(checkWriting()).toEqual([]);
  });

  it('approves any well-formed article, whatever its title, category, or language', () => {
    expect(problemsFor({
      alpha: {},
      'a-note': { meta: 'publishedAt: 2024-02-02\ncategory: note\noriginalLanguage: en\ndraft: false\nfeatured: false\n' },
      hidden: { meta: 'publishedAt: 2030-01-01\ncategory: essay\noriginalLanguage: ko\ndraft: true\nfeatured: false\n' },
      pictured: { files: { 'cover.png': 'x', 'cover.alt.ko.txt': '사진', 'cover.alt.en.txt': 'Photo' } },
    })).toEqual([]);
  });

  it('rejects a bad slug, category, language, or draft flag', () => {
    const problems = problemsFor({
      'Bad_Slug': {},
      typo: { meta: 'publishedAt: 2025-01-01\ncategory: essay2\noriginalLanguage: jp\ndraft: maybe\nfeatured: false\n' },
    });

    expect(problems.join('\n')).toMatch(/Bad_Slug.*슬러그/);
    expect(problems.join('\n')).toMatch(/typo.*meta\.yaml/);
  });

  it('rejects an empty title or body in either language', () => {
    const problems = problemsFor({
      hollow: { ko: articleFile('""', '한국어 본문'), en: articleFile('Title', '') },
    });

    expect(problems.join('\n')).toMatch(/hollow.*ko.*제목/);
    expect(problems.join('\n')).toMatch(/hollow.*en.*본문/);
  });

  it('rejects a leftover description, which writing no longer has', () => {
    const problems = problemsFor({
      described: { ko: articleFile('제목', '한국어 본문입니다.', 'description: 설명\n') },
    });

    expect(problems.join('\n')).toMatch(/described.*ko\.md.*description/);
  });

  it('rejects a published article that still has draft markers, placeholder text, or a future date', () => {
    const problems = problemsFor({
      marker: { ko: articleFile('"[Draft] 제목"', '본문') },
      placeholder: { en: articleFile('Title', 'Write the English body here.') },
      future: { meta: 'publishedAt: 2999-01-01\ncategory: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' },
    });

    expect(problems.join('\n')).toMatch(/marker.*\[Draft\]/);
    expect(problems.join('\n')).toMatch(/placeholder.*기본 문구/);
    expect(problems.join('\n')).toMatch(/future.*미래/);
  });

  it('allows draft markers, placeholders, and future dates while an article is still a draft', () => {
    expect(problemsFor({
      wip: {
        meta: 'publishedAt: 2999-01-01\ncategory: essay\noriginalLanguage: ko\ndraft: true\nfeatured: false\n',
        ko: articleFile('"[Draft] 제목"', '한국어 본문을 작성하세요.'),
        en: articleFile('"[Draft] Title"', 'Write the English body here.'),
      },
    })).toEqual([]);
  });

  it('rejects invisible zero-width characters, which can silently break Markdown such as headings', () => {
    const problems = problemsFor({
      pasted: { ko: articleFile('제목', '첫 문단입니다.\n\n​## 소제목\n\n본문입니다.') },
      marked: { en: articleFile('Title', 'English⁠ body.﻿') },
    });

    expect(problems.join('\n')).toMatch(/pasted.*ko\.md.*7번째 줄.*보이지 않는 문자/);
    expect(problems.join('\n')).toMatch(/marked.*en\.md.*5번째 줄.*보이지 않는 문자/);
  });

  it('rejects a translation written in the wrong script', () => {
    const problems = problemsFor({
      mixed: { ko: articleFile('Title', 'This is English.'), en: articleFile('제목', '한국어입니다.') },
    });

    expect(problems.join('\n')).toMatch(/mixed.*ko\.md.*한글/);
    expect(problems.join('\n')).toMatch(/mixed.*en\.md.*영문/);
  });

  it('rejects more than one cover photo and stray photos that the site would silently ignore', () => {
    const problems = problemsFor({
      twice: { files: { 'cover.png': 'x', 'cover.jpg': 'x' } },
      stray: { files: { 'IMG_1234.png': 'x' } },
      referenced: { ko: articleFile('제목', '![그림](./inline.png)'), files: { 'inline.png': 'x' } },
    });

    expect(problems.join('\n')).toMatch(/twice.*한 장/);
    expect(problems.join('\n')).toMatch(/stray.*IMG_1234\.png.*cover/);
    expect(problems.join('\n')).not.toMatch(/referenced/);
  });

  it('rejects alt-text files without a photo', () => {
    expect(problemsFor({ orphan: { files: { 'cover.alt.ko.txt': '사진' } } }).join('\n')).toMatch(/orphan.*대체 텍스트/);
  });

  it('lets one published article in any category be featured, but not two', () => {
    const featured = (date: string, category: string, draft = false) =>
      ({ meta: `publishedAt: ${date}\ncategory: ${category}\noriginalLanguage: ko\ndraft: ${draft}\nfeatured: true\n` });

    expect(problemsFor({ featurednote: featured('2025-01-01', 'note'), wip: featured('2025-01-02', 'essay', true) })).toEqual([]);
    const problems = problemsFor({ one: featured('2025-01-02', 'essay'), two: featured('2025-01-03', 'note') });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/대표 글.*하나.*one.*two/);
  });

  it('rejects a category that is not in the registry, in Korean, naming the registered ones', () => {
    const problems = problemsFor({
      poem: { meta: 'publishedAt: 2025-01-01\ncategory: poem\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' },
      legacy: { meta: 'publishedAt: 2025-01-01\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' },
    });

    expect(problems.join('\n')).toMatch(/poem.*카테고리.*poem.*essay, note/);
    expect(problems.join('\n')).toMatch(/legacy.*카테고리/);
    expect(problems.join('\n')).not.toMatch(/Unknown category|Invalid input/);
  });

  it('follows whatever categories the registry lists', () => {
    const poem = { meta: 'publishedAt: 2025-01-01\ncategory: poem\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' };
    const registry = '- slug: poem\n  name: { ko: 시, en: Poem }\n  newsletter: false\n';

    expect(checkWriting({ root: project({ verse: poem }, registry) })).toEqual([]);
  });

  it('reserves the article slug "category" for category pages, in Korean', () => {
    const problems = problemsFor({ category: {} });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/"category".*예약/);
  });

  it('reports a missing or broken category registry in Korean instead of crashing', () => {
    expect(checkWriting({ root: project({ alpha: {} }, null) }).join('\n')).toMatch(/categories\.yaml.*카테고리 목록/);
    expect(checkWriting({ root: project({ alpha: {} }, '- slug: drafts\n  name: { ko: 초안, en: Drafts }\n  newsletter: false\n') }).join('\n'))
      .toMatch(/categories\.yaml.*카테고리 목록.*drafts/);
  });

  it('reports a missing translation file as a problem instead of crashing', () => {
    const root = project({ half: {} });
    rmSync(join(root, 'src/content/writing/half/en.md'));

    expect(checkWriting({ root }).join('\n')).toMatch(/half.*en\.md/);
  });
});
