import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkWriting } from '../support/writing-rules';

const roots: string[] = [];
const GOOD_META = 'publishedAt: 2025-01-01\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n';
const articleFile = (title: string, body: string, extraFront = '') => `---\ntitle: ${title}\n${extraFront}---\n\n${body}\n`;

function project(articles: Record<string, { meta?: string; ko?: string; en?: string; files?: Record<string, string> }>) {
  const root = mkdtempSync(join(tmpdir(), 'writing-rules-'));
  roots.push(root);
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

  it('approves any well-formed article, whatever its title, type, or language', () => {
    expect(problemsFor({
      alpha: {},
      'a-note': { meta: 'publishedAt: 2024-02-02\ntype: note\noriginalLanguage: en\ndraft: false\nfeatured: false\n' },
      hidden: { meta: 'publishedAt: 2030-01-01\ntype: essay\noriginalLanguage: ko\ndraft: true\nfeatured: false\n' },
      pictured: { files: { 'cover.png': 'x', 'cover.alt.ko.txt': '사진', 'cover.alt.en.txt': 'Photo' } },
    })).toEqual([]);
  });

  it('rejects a bad slug, type, language, or draft flag', () => {
    const problems = problemsFor({
      'Bad_Slug': {},
      typo: { meta: 'publishedAt: 2025-01-01\ntype: essay2\noriginalLanguage: jp\ndraft: maybe\nfeatured: false\n' },
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
      future: { meta: 'publishedAt: 2999-01-01\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' },
    });

    expect(problems.join('\n')).toMatch(/marker.*\[Draft\]/);
    expect(problems.join('\n')).toMatch(/placeholder.*기본 문구/);
    expect(problems.join('\n')).toMatch(/future.*미래/);
  });

  it('allows draft markers, placeholders, and future dates while an article is still a draft', () => {
    expect(problemsFor({
      wip: {
        meta: 'publishedAt: 2999-01-01\ntype: essay\noriginalLanguage: ko\ndraft: true\nfeatured: false\n',
        ko: articleFile('"[Draft] 제목"', '한국어 본문을 작성하세요.'),
        en: articleFile('"[Draft] Title"', 'Write the English body here.'),
      },
    })).toEqual([]);
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

  it('rejects alt-text files without a photo, and misplaced featured flags', () => {
    const problems = problemsFor({
      orphan: { files: { 'cover.alt.ko.txt': '사진' } },
      featurednote: { meta: 'publishedAt: 2025-01-01\ntype: note\noriginalLanguage: ko\ndraft: false\nfeatured: true\n' },
      one: { meta: 'publishedAt: 2025-01-02\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: true\n' },
      two: { meta: 'publishedAt: 2025-01-03\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: true\n' },
    });

    expect(problems.join('\n')).toMatch(/orphan.*대체 텍스트/);
    expect(problems.join('\n')).toMatch(/featurednote.*Essay/);
    expect(problems.join('\n')).toMatch(/대표 글.*하나/);
  });

  it('reports a missing translation file as a problem instead of crashing', () => {
    const root = project({ half: {} });
    rmSync(join(root, 'src/content/writing/half/en.md'));

    expect(checkWriting({ root }).join('\n')).toMatch(/half.*en\.md/);
  });
});
