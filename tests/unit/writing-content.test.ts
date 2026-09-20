import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  firstPlainLine,
  isoDatetime,
  loadWritingCases,
  originalTitle,
  representativeCases,
  typeLabel,
  visibleCases,
} from '../support/writing-content';

const roots: string[] = [];

function project(
  articles: Record<string, { meta?: string; ko?: string | null; en?: string | null; files?: Record<string, string> }>,
  fixtures: typeof articles = {},
) {
  const root = mkdtempSync(join(tmpdir(), 'writing-content-'));
  roots.push(root);
  for (const [base, group] of [['src/content/writing', articles], ['tests/fixtures/writing', fixtures]] as const) {
    for (const [slug, article] of Object.entries(group)) {
      const directory = join(root, base, slug);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'meta.yaml'), article.meta ?? 'publishedAt: 2025-01-01\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n');
      if (article.ko !== null) writeFileSync(join(directory, 'ko.md'), article.ko ?? `---\ntitle: 제목 ${slug}\n---\n\n본문입니다.\n`);
      if (article.en !== null) writeFileSync(join(directory, 'en.md'), article.en ?? `---\ntitle: Title ${slug}\n---\n\nBody text.\n`);
      for (const [name, text] of Object.entries(article.files ?? {})) writeFileSync(join(directory, name), text);
    }
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('writing content reader', () => {
  it('reads metadata and both translations and sorts newest first with a slug tie-break', () => {
    const root = project({
      older: { meta: 'publishedAt: 2024-05-01\ntype: note\noriginalLanguage: en\ndraft: true\nfeatured: false\n' },
      'b-same-day': { meta: 'publishedAt: 2025-03-03\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\n' },
      'a-same-day': { meta: 'publishedAt: 2025-03-03\ntype: essay\noriginalLanguage: ko\ndraft: false\nfeatured: false\nupdatedAt: 2025-04-01\n' },
    });

    const cases = loadWritingCases({ root });

    expect(cases.map((item) => item.slug)).toEqual(['a-same-day', 'b-same-day', 'older']);
    expect(cases[0]).toMatchObject({ type: 'essay', originalLanguage: 'ko', draft: false, publishedAt: '2025-03-03', updatedAt: '2025-04-01', source: 'content' });
    expect(cases[2]).toMatchObject({ type: 'note', originalLanguage: 'en', draft: true });
    expect(cases[0].translations.ko).toMatchObject({ title: '제목 a-same-day' });
    expect(cases[0].translations.en.body).toBe('Body text.');
    expect(originalTitle(cases[2])).toBe('Title older');
    expect(isoDatetime(cases[0])).toBe('2025-03-03T00:00:00.000Z');
    expect(typeLabel('essay')).toBe('Essay');
    expect(typeLabel('note')).toBe('Note');
  });

  it('finds the cover and reads optional alt text files', () => {
    const root = project({
      plain: {},
      framed: { files: { 'cover.png': 'x' } },
      described: { files: { 'cover.jpeg': 'x', 'cover.alt.ko.txt': ' 창가의 헤드폰\n' } },
      doubled: { files: { 'cover.png': 'x', 'cover.jpg': 'x' } },
    });

    const bySlug = Object.fromEntries(loadWritingCases({ root }).map((item) => [item.slug, item]));

    expect(bySlug.plain.cover).toBeUndefined();
    expect(bySlug.framed.cover).toEqual({ file: 'cover.png', alt: { ko: '', en: '' } });
    expect(bySlug.described.cover).toEqual({ file: 'cover.jpeg', alt: { ko: '창가의 헤드폰', en: '' } });
    expect(bySlug.doubled.coverFiles).toEqual(['cover.jpg', 'cover.png']);
  });

  it('adds the test fixtures only when asked and marks their source', () => {
    const root = project({ real: {} }, { sample: { meta: 'publishedAt: 2026-01-01\ntype: note\noriginalLanguage: en\ndraft: true\nfeatured: false\n' } });

    expect(loadWritingCases({ root }).map((item) => item.slug)).toEqual(['real']);
    const withFixtures = loadWritingCases({ root, fixtures: true });
    expect(withFixtures.map((item) => [item.slug, item.source])).toEqual([['sample', 'fixture'], ['real', 'content']]);
  });

  it('hides drafts unless they are requested', () => {
    const root = project({
      live: {},
      hidden: { meta: 'publishedAt: 2025-06-06\ntype: essay\noriginalLanguage: ko\ndraft: true\nfeatured: false\n' },
    });
    const cases = loadWritingCases({ root });

    expect(visibleCases(cases, { includeDrafts: false }).map((item) => item.slug)).toEqual(['live']);
    expect(visibleCases(cases, { includeDrafts: true }).map((item) => item.slug)).toEqual(['hidden', 'live']);
  });

  it('explains what is missing instead of crashing', () => {
    expect(() => loadWritingCases({ root: project({ broken: { en: null } }) })).toThrow(/"broken".*en\.md/);
    expect(() => loadWritingCases({ root: project({ broken: { meta: 'type: essay\n' } }) })).toThrow(/"broken".*publishedAt/);
    expect(() => loadWritingCases({ root: project({ broken: { ko: 'no frontmatter here' } }) })).toThrow(/"broken".*ko\.md.*front/i);
  });

  it('picks a plain sentence to look for on the page', () => {
    expect(firstPlainLine('# Heading\n\n**bold** line\n\n첫 번째 문장입니다.\n\n둘째 문장.')).toBe('첫 번째 문장입니다.');
    expect(firstPlainLine('***\n\n- item')).toBeUndefined();
  });

  it('chooses one article with a cover and one without for expensive checks', () => {
    const root = project({ a: {}, b: { files: { 'cover.png': 'x' } }, c: { files: { 'cover.png': 'x' } } });
    const picks = representativeCases(loadWritingCases({ root }));

    expect(picks.map((item) => item.slug).sort()).toEqual(['a', 'b']);
  });

  it('reads the repository itself', () => {
    const cases = loadWritingCases();

    expect(cases.length).toBeGreaterThan(0);
    for (const item of cases) expect(item.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
