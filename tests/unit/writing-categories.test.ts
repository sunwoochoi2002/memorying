import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  RESERVED_CATEGORY_SLUGS,
  assertNoReservedWritingSlugs,
  isReservedWritingSlug,
  readWritingCategories,
} from '../../scripts/writing-categories.mjs';

const roots: string[] = [];

function registry(text: string): string {
  const root = mkdtempSync(join(tmpdir(), 'writing-categories-'));
  roots.push(root);
  const path = join(root, 'categories.yaml');
  writeFileSync(path, text);
  return path;
}

const entry = (slug: string, options: { ko?: string; en?: string; newsletter?: string } = {}) =>
  `- slug: ${slug}\n  name: { ko: "${options.ko ?? '이름'}", en: "${options.en ?? 'Name'}" }\n  newsletter: ${options.newsletter ?? 'false'}\n`;

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('writing category registry', () => {
  it('returns the categories in file order with bilingual names and a newsletter flag', () => {
    const path = registry(entry('second', { ko: '둘', en: 'Two', newsletter: 'true' }) + entry('first', { ko: '하나', en: 'One' }));

    expect(readWritingCategories(path)).toEqual([
      { slug: 'second', name: { ko: '둘', en: 'Two' }, newsletter: true },
      { slug: 'first', name: { ko: '하나', en: 'One' }, newsletter: false },
    ]);
  });

  it('reads the repository registry, whose slugs follow the rules', () => {
    const categories = readWritingCategories(join(process.cwd(), 'src/content/categories.yaml'));

    expect(categories.length).toBeGreaterThan(0);
    for (const category of categories) {
      expect(category.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(RESERVED_CATEGORY_SLUGS).not.toContain(category.slug);
      expect(typeof category.newsletter).toBe('boolean');
    }
  });

  it.each(['Bad_Slug', 'two words', 'double--hyphen', ''])('rejects the invalid slug "%s"', (slug) => {
    expect(() => readWritingCategories(registry(entry(`"${slug}"`)))).toThrow(/slug/i);
  });

  it('rejects a duplicate slug', () => {
    expect(() => readWritingCategories(registry(entry('same') + entry('same')))).toThrow(/duplicate.*same/i);
  });

  it.each(['drafts', 'category'])('rejects the reserved slug "%s"', (slug) => {
    expect(() => readWritingCategories(registry(entry(slug)))).toThrow(new RegExp(`reserved.*${slug}`, 'i'));
  });

  it.each([
    ['Korean', { ko: '' }],
    ['English', { en: '  ' }],
  ])('rejects an empty %s name', (_language, names) => {
    expect(() => readWritingCategories(registry(entry('blank', names)))).toThrow(/name/i);
  });

  it('rejects a missing name', () => {
    expect(() => readWritingCategories(registry('- slug: nameless\n  newsletter: false\n'))).toThrow(/name/i);
  });

  it.each(['"yes"', '1', 'null'])('requires newsletter to be true or false, not %s', (value) => {
    expect(() => readWritingCategories(registry(entry('flag', { newsletter: value })))).toThrow(/newsletter/i);
  });

  it('requires newsletter to be written out', () => {
    expect(() => readWritingCategories(registry('- slug: quiet\n  name: { ko: 조용, en: Quiet }\n'))).toThrow(/newsletter/i);
  });

  it('rejects a registry that is not a non-empty list', () => {
    expect(() => readWritingCategories(registry('slug: essay\n'))).toThrow(/list/i);
    expect(() => readWritingCategories(registry('[]\n'))).toThrow(/list/i);
  });
});

describe('reserved article slugs', () => {
  it('forbids the article slug "category", which would collide with /writing/category/', () => {
    expect(isReservedWritingSlug('category')).toBe(true);
    expect(isReservedWritingSlug('categories')).toBe(false);
    expect(isReservedWritingSlug('essay')).toBe(false);
  });
});

describe('reserved article slugs in the build', () => {
  it('rejects an article folder named "category" and accepts ordinary slugs', () => {
    expect(() => assertNoReservedWritingSlugs([{ slug: 'alone', directory: 'note/2025-11-21/alone' }])).not.toThrow();
    expect(() => assertNoReservedWritingSlugs([{ slug: 'category', directory: 'note/2025-11-21/category' }]))
      .toThrow('Reserved writing slug: category (note/2025-11-21/category)');
  });
});
