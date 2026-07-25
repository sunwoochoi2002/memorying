import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createWritingDraft, isValidWritingSlug } from '../../scripts/new-writing.mjs';

const temporaryRoots: string[] = [];

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), 'memorying-new-writing-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe('new writing scaffold', () => {
  it('recognizes only lowercase ASCII slugs separated by single hyphens', () => {
    expect(isValidWritingSlug('remembering-summer')).toBe(true);
    expect(isValidWritingSlug('Uppercase')).toBe(false);
    expect(isValidWritingSlug('two words')).toBe(false);
    expect(isValidWritingSlug('../escape')).toBe(false);
    expect(isValidWritingSlug('double--hyphen')).toBe(false);
  });

  it('creates a complete Korean-original bilingual draft', async () => {
    const root = await createRoot();

    const created = await createWritingDraft({
      root,
      slug: 'remembering-summer',
      originalLanguage: 'ko',
      publishedAt: '2026-07-25',
    });

    expect(basename(created)).toBe('remembering-summer');
    expect(await readdir(created)).toEqual(['en.mdx', 'ko.mdx', 'meta.yaml']);
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('publishedAt: 2026-07-25');
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('originalLanguage: ko');
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('draft: true');
    expect(await readFile(join(created, 'ko.mdx'), 'utf8')).toContain('[Draft] 한국어 제목');
    expect(await readFile(join(created, 'en.mdx'), 'utf8')).toContain('[Draft] English title');
  });

  it.each([
    { slug: 'Uppercase', originalLanguage: 'ko' as const, message: 'Invalid writing slug: Uppercase' },
    { slug: 'two words', originalLanguage: 'ko' as const, message: 'Invalid writing slug: two words' },
    { slug: '../escape', originalLanguage: 'ko' as const, message: 'Invalid writing slug: ../escape' },
    { slug: 'valid-slug', originalLanguage: 'jp' as never, message: 'Invalid original language: jp' },
  ])('rejects unsafe input without creating files for $slug', async ({ slug, originalLanguage, message }) => {
    const root = await createRoot();
    const sentinel = join(root, 'sentinel.txt');
    await writeFile(sentinel, 'keep me', 'utf8');

    await expect(createWritingDraft({
      root,
      slug,
      originalLanguage,
      publishedAt: '2026-07-25',
    })).rejects.toThrow(message);

    expect(await readdir(root)).toEqual(['sentinel.txt']);
    expect(await readFile(sentinel, 'utf8')).toBe('keep me');
  });

  it('refuses to overwrite an existing draft directory without changing its files', async () => {
    const root = await createRoot();
    const existing = join(root, 'remembering-summer');
    await mkdir(existing);
    await writeFile(join(existing, 'sentinel.txt'), 'keep me', 'utf8');

    await expect(createWritingDraft({
      root,
      slug: 'remembering-summer',
      originalLanguage: 'en',
      publishedAt: '2026-07-25',
    })).rejects.toThrow('Writing already exists: remembering-summer');

    expect(await readdir(existing)).toEqual(['sentinel.txt']);
    expect(await readFile(join(existing, 'sentinel.txt'), 'utf8')).toBe('keep me');
  });
});
