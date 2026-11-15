import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import * as newWriting from '../../scripts/new-writing.mjs';
import { readWritingCategories } from '../../scripts/writing-categories.mjs';
import { createWritingMetadataSchema } from '../../src/lib/content-schema';

const { createWritingDraft, isValidWritingSlug } = newWriting;
const CATEGORIES = ['essay', 'note'];
const SCRIPT = join(process.cwd(), 'scripts/new-writing.mjs');
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
      category: 'note',
      categories: CATEGORIES,
      publishedAt: '2026-07-25',
    });

    expect(basename(created)).toBe('remembering-summer');
    expect(created).toBe(join(root, 'drafts/note/2026-07-25/remembering-summer'));
    expect(await readdir(created)).toEqual(['en.md', 'ko.md', 'meta.yaml']);
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('publishedAt: 2026-07-25');
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('originalLanguage: ko');
    expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('draft: true');
    expect(parse(await readFile(join(created, 'meta.yaml'), 'utf8')).category).toBe('note');
    const slugs = readWritingCategories(join(process.cwd(), 'src/content/categories.yaml')).map(({ slug }: { slug: string }) => slug);
    const meta = parse(await readFile(join(created, 'meta.yaml'), 'utf8'));
    expect(createWritingMetadataSchema(z.any(), slugs).safeParse(meta).success).toBe(true);
    expect(await readFile(join(created, 'ko.md'), 'utf8')).toContain('[Draft] 한국어 제목');
    expect(await readFile(join(created, 'en.md'), 'utf8')).toContain('[Draft] English title');
    expect(await readFile(join(created, 'ko.md'), 'utf8')).not.toContain('description');
    expect(await readFile(join(created, 'en.md'), 'utf8')).not.toContain('description');
  });

  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01'])('rejects invalid calendar date %s before creating anything', async (publishedAt) => {
    const root = await createRoot();
    await expect(createWritingDraft({ root, slug: 'valid', originalLanguage: 'ko', category: 'essay', categories: CATEGORIES, publishedAt })).rejects.toThrow(/Invalid published date/);
    expect(await readdir(root)).toEqual([]);
  });

  it.each(['2025-01-01/remembering-summer', 'essay/2025-01-01/remembering-summer', 'drafts/note/2025-01-01/remembering-summer'])('refuses a globally occupied slug at %s', async (path) => {
    const root = await createRoot();
    await mkdir(join(root, path), { recursive: true });
    await writeFile(join(root, path, 'sentinel.txt'), 'unchanged');
    await expect(createWritingDraft({ root, slug: 'remembering-summer', originalLanguage: 'ko', category: 'essay', categories: CATEGORIES, publishedAt: '2026-07-25' })).rejects.toThrow(/already exists/);
    expect(await readFile(join(root, path, 'sentinel.txt'), 'utf8')).toBe('unchanged');
  });

  it.each([
    { slug: 'Uppercase', originalLanguage: 'ko' as const, message: 'Invalid writing slug: Uppercase' },
    { slug: 'two words', originalLanguage: 'ko' as const, message: 'Invalid writing slug: two words' },
    { slug: '../escape', originalLanguage: 'ko' as const, message: 'Invalid writing slug: ../escape' },
    { slug: 'valid-slug', originalLanguage: 'jp' as never, message: 'Invalid original language: jp' },
    { slug: 'category', originalLanguage: 'ko' as const, message: 'Reserved writing slug: category' },
    { slug: 'valid-slug', originalLanguage: 'ko' as const, category: 'poem', message: 'Unregistered writing category: poem' },
    { slug: 'valid-slug', originalLanguage: 'ko' as const, category: undefined, message: 'Missing writing category' },
  ])('rejects unsafe input without creating files for $slug ($message)', async ({ slug, originalLanguage, message, ...rest }) => {
    const category = 'category' in rest ? rest.category : 'essay';
    const root = await createRoot();
    const sentinel = join(root, 'sentinel.txt');
    await writeFile(sentinel, 'keep me', 'utf8');

    await expect(createWritingDraft({
      root,
      slug,
      originalLanguage,
      category: category as string,
      categories: CATEGORIES,
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
      category: 'essay',
      categories: CATEGORIES,
      publishedAt: '2026-07-25',
    })).rejects.toThrow('Writing already exists: remembering-summer');

    expect(await readdir(existing)).toEqual(['sentinel.txt']);
    expect(await readFile(join(existing, 'sentinel.txt'), 'utf8')).toBe('keep me');
  });
});

describe('new writing slug availability', () => {
  it.each(['essay', 'drafts', '2025-01-12'])('allows the slug %s although a storage folder has that name', async (slug) => {
    const root = await createRoot();
    await mkdir(join(root, 'essay/2025-01-12/existing'), { recursive: true });
    await writeFile(join(root, 'essay/2025-01-12/existing/meta.yaml'), 'publishedAt: 2025-01-12\ncategory: essay\ndraft: false\n');
    await mkdir(join(root, 'drafts/essay/2025-01-12'), { recursive: true });

    const created = await createWritingDraft({
      root,
      slug,
      originalLanguage: 'ko',
      category: 'essay',
      categories: CATEGORIES,
      publishedAt: '2026-07-25',
    });

    expect(created).toBe(join(root, 'drafts/essay/2026-07-25', slug));
  });

  it('still refuses the slug of an existing article stored under category and date folders', async () => {
    const root = await createRoot();
    await mkdir(join(root, 'essay/2025-01-12/existing'), { recursive: true });
    await writeFile(join(root, 'essay/2025-01-12/existing/meta.yaml'), 'publishedAt: 2025-01-12\ncategory: essay\ndraft: false\n');

    await expect(createWritingDraft({
      root,
      slug: 'existing',
      originalLanguage: 'ko',
      category: 'essay',
      categories: CATEGORIES,
      publishedAt: '2026-07-25',
    })).rejects.toThrow('Writing already exists: existing');
  });
});

describe('new:writing arguments', () => {
  const parse = (args: string[]) => {
    expect(newWriting.parseNewWritingArguments, 'argument parser is exported').toBeTypeOf('function');
    return newWriting.parseNewWritingArguments(args);
  };

  it.each([
    ['summer', '--original', 'ko', '--category', 'note'],
    ['summer', '--category', 'note', '--original', 'ko'],
    ['--category', 'note', 'summer', '--original', 'ko'],
    ['--original', 'ko', '--category', 'note', 'summer'],
  ])('accepts options in any order: %s %s %s %s %s', (...args) => {
    expect(parse(args)).toEqual({ slug: 'summer', originalLanguage: 'ko', category: 'note' });
  });

  it.each([
    [['summer', '--original', 'ko']],
    [['summer', '--category', 'note']],
    [['--original', 'ko', '--category', 'note']],
    [['summer', 'winter', '--original', 'ko', '--category', 'note']],
    [['summer', '--original', 'ko', '--category']],
    [['summer', '--original', 'ko', '--category', 'note', '--category', 'essay']],
    [['summer', '--original', 'ko', '--category', 'note', '--help']],
    [['summer', '--original', '--category', 'note']],
  ])('rejects %j with the usage line', (args) => {
    expect(() => parse(args)).toThrow('Usage: npm run new:writing -- <slug> --original <ko|en> --category <slug>');
  });
});

describe('new:writing command', () => {
  async function project() {
    const cwd = await createRoot();
    await mkdir(join(cwd, 'src/content'), { recursive: true });
    // A registry unlike the real one proves the command reads the project's own file.
    await writeFile(join(cwd, 'src/content/categories.yaml'), '- slug: poem\n  name: { ko: 시, en: Poem }\n  newsletter: false\n');
    return cwd;
  }
  const run = (cwd: string, ...args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });

  it('creates drafts/<category>/<today>/<slug> from the project registry', async () => {
    const cwd = await project();
    const result = run(cwd, '--category', 'poem', 'verse', '--original', 'en');
    expect(result.status, result.stderr).toBe(0);
    const [today] = await readdir(join(cwd, 'src/content/writing/drafts/poem'));
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const meta = parse(await readFile(join(cwd, 'src/content/writing/drafts/poem', today, 'verse/meta.yaml'), 'utf8'));
    expect(meta).toMatchObject({ category: 'poem', originalLanguage: 'en', draft: true, publishedAt: today });
  });

  it.each([
    [['verse', '--original', 'ko', '--category', 'essay']],
    [['verse', '--original', 'ko']],
    [['category', '--original', 'ko', '--category', 'poem']],
  ])('refuses %j and creates nothing', async (args) => {
    const cwd = await project();
    const result = run(cwd, ...args);
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).not.toBe('');
    expect(existsSync(join(cwd, 'src/content/writing'))).toBe(false);
  });
});
