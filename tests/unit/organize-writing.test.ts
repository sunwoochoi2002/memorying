import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/organize-writing.mjs');
const CATEGORIES = ['essay', 'note'];
const roots: string[] = [];

async function rootDirectory() {
  const root = await mkdtemp(join(tmpdir(), 'organize-writing-'));
  roots.push(root);
  return root;
}

type ArticleOptions = { date?: string; draft?: boolean; category?: string | null };
async function article(root: string, path: string, { date = '2026-11-13', draft = false, category = 'essay' }: ArticleOptions = {}) {
  const directory = join(root, path);
  await mkdir(join(directory, 'attachments'), { recursive: true });
  const categoryLine = category === null ? '' : `category: ${category}\n`;
  await writeFile(join(directory, 'meta.yaml'), `publishedAt: ${date}\n${categoryLine}draft: ${draft}\n`);
  await writeFile(join(directory, 'ko.md'), '한글 원문\n');
  await writeFile(join(directory, 'en.md'), 'English translation\n');
  await writeFile(join(directory, 'cover.png'), new Uint8Array([0, 1, 128, 255]));
  await writeFile(join(directory, 'attachments/notes.txt'), 'untouched attachment');
}

async function expectIntactArticle(root: string, path: string) {
  expect(await readFile(join(root, path, 'ko.md'), 'utf8')).toBe('한글 원문\n');
  expect(await readFile(join(root, path, 'en.md'), 'utf8')).toBe('English translation\n');
  expect([...await readFile(join(root, path, 'cover.png'))]).toEqual([0, 1, 128, 255]);
  expect(await readFile(join(root, path, 'attachments/notes.txt'), 'utf8')).toBe('untouched attachment');
}

/** Every path under root (files and folders), so "nothing changed" can be compared exactly. */
function tree(root: string): string[] {
  const paths: string[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      paths.push(relative(root, path) + (entry.isDirectory() ? '/' : ''));
      if (entry.isDirectory()) visit(path);
    }
  }
  visit(root);
  return paths.sort();
}

async function organize(root: string, options: { categories?: string[]; dryRun?: boolean } = {}) {
  // Dynamic import keeps missing implementation a normal assertion failure in RED.
  const module = await import('../../scripts/organize-writing.mjs').catch(() => undefined);
  expect(module, 'organizer is available').toBeDefined();
  return module!.organizeWriting({ root, categories: CATEGORIES, ...options });
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('organizeWriting', () => {
  it('moves flat and date-only articles to <category>/<date>/<slug> and repeats as a no-op', async () => {
    const root = await rootDirectory();
    await article(root, 'flat');
    await article(root, '2020-01-01/misdated', { date: '2026-01-02', category: 'note' });
    await article(root, '2020-02-01/hidden', { date: '2026-02-03', draft: true });
    await article(root, 'drafts/2020-03-01/published', { date: '2026-03-04', category: 'note' });
    await writeFile(join(root, '2020-02-01/keep.txt'), 'unrelated');

    const moves = await organize(root);
    expect(moves.map(({ to }: { to: string }) => relative(root, to)).sort()).toEqual([
      'drafts/essay/2026-02-03/hidden', 'essay/2026-11-13/flat', 'note/2026-01-02/misdated', 'note/2026-03-04/published',
    ]);
    for (const path of ['essay/2026-11-13/flat', 'note/2026-01-02/misdated', 'drafts/essay/2026-02-03/hidden', 'note/2026-03-04/published']) {
      await expectIntactArticle(root, path);
    }
    expect(existsSync(join(root, '2020-01-01'))).toBe(false);
    expect(existsSync(join(root, 'drafts/2020-03-01'))).toBe(false);
    expect(await readFile(join(root, '2020-02-01/keep.txt'), 'utf8')).toBe('unrelated');
    expect(await organize(root)).toEqual([]);
  });

  it('re-files an article whose category changed and removes the emptied category folder', async () => {
    const root = await rootDirectory();
    await article(root, 'essay/2026-01-01/renamed', { date: '2026-01-01', category: 'note' });
    await article(root, 'note/2026-01-01/stays', { date: '2026-01-01', category: 'note' });

    expect(await organize(root)).toHaveLength(1);
    await expectIntactArticle(root, 'note/2026-01-01/renamed');
    expect(existsSync(join(root, 'essay'))).toBe(false);
    expect(existsSync(join(root, 'note/2026-01-01/stays/meta.yaml'))).toBe(true);
  });

  it('moves articles between drafts and published areas in both directions', async () => {
    const root = await rootDirectory();
    await article(root, 'drafts/note/2026-03-04/released', { date: '2026-03-04', category: 'note' });
    await article(root, 'essay/2026-02-02/withdrawn', { date: '2026-02-02', draft: true });

    expect(await organize(root)).toHaveLength(2);
    await expectIntactArticle(root, 'note/2026-03-04/released');
    await expectIntactArticle(root, 'drafts/essay/2026-02-02/withdrawn');
    expect(existsSync(join(root, 'drafts/note'))).toBe(false);
    expect(existsSync(join(root, 'essay'))).toBe(false);
  });

  it('removes only empty date, category and drafts folders and keeps everything else', async () => {
    const root = await rootDirectory();
    await article(root, 'drafts/essay/2026-01-01/first', { date: '2026-01-01' });
    await article(root, 'misc/2026-01-01/second', { date: '2026-01-01', category: 'note' });
    await article(root, 'note/2026-05-05/third', { date: '2026-05-05' });
    await writeFile(join(root, 'note/keep.txt'), 'unrelated');
    await mkdir(join(root, 'note/2026-06-06'));

    expect(await organize(root)).toHaveLength(3);
    expect(existsSync(join(root, 'drafts'))).toBe(false);
    expect(existsSync(join(root, 'misc/2026-01-01'))).toBe(false);
    expect(existsSync(join(root, 'misc'))).toBe(true);
    expect(existsSync(join(root, 'note/2026-05-05'))).toBe(false);
    expect(await readFile(join(root, 'note/keep.txt'), 'utf8')).toBe('unrelated');
    expect(existsSync(join(root, 'note/2026-06-06'))).toBe(true);
    expect(existsSync(root)).toBe(true);
  });

  it.each([
    { category: 'poem', message: /category.*poem/i },
    { category: null, message: /category/i },
  ])('rejects category $category before moving any article', async ({ category, message }) => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, 'z-unregistered', { category });
    const before = tree(root);
    await expect(organize(root)).rejects.toThrow(message);
    expect(tree(root)).toEqual(before);
  });

  it('uses the categories it is given as the registry', async () => {
    const root = await rootDirectory();
    await article(root, 'verse', { category: 'poem' });
    await expect(organize(root)).rejects.toThrow(/poem/);
    expect(await organize(root, { categories: ['poem'] })).toHaveLength(1);
    expect(existsSync(join(root, 'poem/2026-11-13/verse/meta.yaml'))).toBe(true);
  });

  it.each(['category', 'Bad_Slug'])('rejects the article slug %s before moving anything', async (slug) => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, slug);
    const before = tree(root);
    await expect(organize(root)).rejects.toThrow(/slug/i);
    expect(tree(root)).toEqual(before);
  });

  it.each(['2026-02-29', '2026-04-31', 'not-a-date'])('rejects %s before moving any article', async (date) => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, 'z-invalid', { date });
    await expect(organize(root)).rejects.toThrow(/Invalid published date/);
    expect(readdirSync(root).sort()).toEqual(['a-valid', 'z-invalid']);
  });

  it('rejects duplicate global slugs across categories and drafts before moving anything', async () => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, 'essay/2020-01-01/same');
    await article(root, 'drafts/note/2020-02-01/same', { date: '2026-01-01', draft: true, category: 'note' });
    const before = tree(root);
    await expect(organize(root)).rejects.toThrow(/Duplicate writing slug: same/);
    expect(tree(root)).toEqual(before);
  });

  it.each(['directory', 'file', 'symlink', 'parent-file', 'parent-symlink', 'category-file', 'category-symlink'])('rejects an occupied %s destination before partial movement', async (kind) => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, 'z-conflict');
    const category = join(root, 'essay');
    const parent = join(category, '2026-11-13');
    if (kind === 'category-file') await writeFile(category, 'keep');
    else if (kind === 'category-symlink') await symlink(join(root, 'a-valid'), category);
    else {
      await mkdir(category);
      if (kind === 'parent-file') await writeFile(parent, 'keep');
      else if (kind === 'parent-symlink') await symlink(join(root, 'a-valid'), parent);
      else {
        await mkdir(parent);
        const target = join(parent, 'z-conflict');
        if (kind === 'file') await writeFile(target, 'keep');
        else if (kind === 'symlink') await symlink(join(root, 'a-valid'), target);
        else {
          await mkdir(target);
          await writeFile(join(target, 'sentinel'), 'keep');
        }
      }
    }
    await expect(organize(root)).rejects.toThrow(/destination|Destination/);
    expect(existsSync(join(root, 'a-valid/meta.yaml'))).toBe(true);
    expect(existsSync(join(root, 'z-conflict/meta.yaml'))).toBe(true);
  });

  it('ignores hidden directories and symlinks and accepts real leap days', async () => {
    const root = await rootDirectory();
    await article(root, '.hidden/ignored', { date: 'invalid', category: 'poem' });
    await article(root, 'leap', { date: '2024-02-29', draft: true });
    await symlink(join(root, 'leap'), join(root, 'linked'));
    expect(await organize(root)).toHaveLength(1);
    expect(existsSync(join(root, 'drafts/essay/2024-02-29/leap/meta.yaml'))).toBe(true);
    expect(existsSync(join(root, '.hidden/ignored/meta.yaml'))).toBe(true);
  });

  it('rejects a target nested inside an existing article before moving anything', async () => {
    const root = await rootDirectory();
    await article(root, 'a-valid');
    await article(root, 'essay', { category: 'note' });
    const before = tree(root);
    await expect(organize(root)).rejects.toThrow(/destination|Destination/);
    expect(tree(root)).toEqual(before);
  });

  it('plans moves without changing anything in a dry run', async () => {
    const root = await rootDirectory();
    await article(root, '2020-01-01/old', { date: '2026-01-02', category: 'note' });
    await article(root, 'drafts/2020-01-01/pending', { draft: true });
    const before = tree(root);

    const moves = await organize(root, { dryRun: true });
    expect(moves.map(({ from, to }: { from: string; to: string }) => [relative(root, from), relative(root, to)]).sort()).toEqual([
      ['2020-01-01/old', 'note/2026-01-02/old'],
      ['drafts/2020-01-01/pending', 'drafts/essay/2026-11-13/pending'],
    ]);
    expect(tree(root)).toEqual(before);
  });

  it('still validates everything in a dry run', async () => {
    const root = await rootDirectory();
    await article(root, 'unknown', { category: 'poem' });
    await expect(organize(root, { dryRun: true })).rejects.toThrow(/poem/);
  });
});

describe('organize:writing command', () => {
  async function project() {
    const cwd = await rootDirectory();
    await mkdir(join(cwd, 'src/content/writing'), { recursive: true });
    // A registry unlike the real one proves the command reads the project's own file.
    await writeFile(join(cwd, 'src/content/categories.yaml'), '- slug: poem\n  name: { ko: 시, en: Poem }\n  newsletter: false\n');
    await article(join(cwd, 'src/content/writing'), '2026-11-13/verse', { category: 'poem' });
    return cwd;
  }
  const run = (cwd: string, ...args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });

  it('prints planned moves for --dry-run and changes nothing', async () => {
    const cwd = await project();
    const before = tree(cwd);
    const result = run(cwd, '--dry-run');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(join('src/content/writing/2026-11-13/verse'));
    expect(result.stdout).toContain(join('src/content/writing/poem/2026-11-13/verse'));
    expect(tree(cwd)).toEqual(before);
  });

  it('treats `npm run organize:writing --dry-run` (no `--`, so npm keeps the flag) as a dry run', async () => {
    const cwd = await project();
    const before = tree(cwd);
    // npm consumes the flag, runs the script with no arguments, and sets npm_config_dry_run.
    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, npm_config_dry_run: 'true' },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(join('src/content/writing/poem/2026-11-13/verse'));
    expect(tree(cwd)).toEqual(before);
  });

  it.each([[['--help']], [['--dryrun']], [['-n']], [['extra']], [['--dry-run', '--dry-run']]])('prints usage and exits 1 for %j without moving anything', async (args) => {
    const cwd = await project();
    const before = tree(cwd);
    const result = run(cwd, ...args);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Usage: npm run organize:writing/);
    expect(tree(cwd)).toEqual(before);
  });

  it('moves folders using the project registry and then reports a no-op', async () => {
    const cwd = await project();
    const first = run(cwd);
    expect(first.status).toBe(0);
    expect(readFileSync(join(cwd, 'src/content/writing/poem/2026-11-13/verse/ko.md'), 'utf8')).toBe('한글 원문\n');
    expect(existsSync(join(cwd, 'src/content/writing/2026-11-13'))).toBe(false);
    const second = run(cwd);
    expect(second.status).toBe(0);
    expect(second.stdout).not.toContain('->');
  });
});
