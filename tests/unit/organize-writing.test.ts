import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const roots: string[] = [];
async function rootDirectory() {
  const root = await mkdtemp(join(tmpdir(), 'organize-writing-'));
  roots.push(root);
  return root;
}
async function article(root: string, path: string, date = '2026-11-13', draft = false) {
  const directory = join(root, path);
  await mkdir(join(directory, 'attachments'), { recursive: true });
  await writeFile(join(directory, 'meta.yaml'), `publishedAt: ${date}\ndraft: ${draft}\n`);
  await writeFile(join(directory, 'ko.md'), '한글 원문\n');
  await writeFile(join(directory, 'en.md'), 'English translation\n');
  await writeFile(join(directory, 'cover.png'), new Uint8Array([0, 1, 128, 255]));
  await writeFile(join(directory, 'attachments/notes.txt'), 'untouched attachment');
}
async function organize(root: string) {
  // Dynamic import keeps missing implementation a normal assertion failure in RED.
  const module = await import('../../scripts/organize-writing.mjs').catch(() => undefined);
  expect(module, 'organizer is available').toBeDefined();
  return module!.organizeWriting({ root });
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

it('moves whole flat, misdated and state-edited articles by metadata and repeats as a no-op', async () => {
  const root = await rootDirectory();
  await article(root, 'flat');
  await article(root, '2020-01-01/misdated', '2026-01-02');
  await article(root, '2020-02-01/hidden', '2026-02-03', true);
  await article(root, 'drafts/2020-03-01/published', '2026-03-04', false);
  await writeFile(join(root, '2020-02-01/keep.txt'), 'unrelated');
  expect(await organize(root)).toHaveLength(4);
  for (const path of ['2026-11-13/flat', '2026-01-02/misdated', 'drafts/2026-02-03/hidden', '2026-03-04/published']) {
    expect(await readFile(join(root, path, 'ko.md'), 'utf8')).toBe('한글 원문\n');
    expect(await readFile(join(root, path, 'en.md'), 'utf8')).toBe('English translation\n');
    expect([...await readFile(join(root, path, 'cover.png'))]).toEqual([0, 1, 128, 255]);
    expect(await readFile(join(root, path, 'attachments/notes.txt'), 'utf8')).toBe('untouched attachment');
  }
  expect(existsSync(join(root, '2020-01-01'))).toBe(false);
  expect(existsSync(join(root, 'drafts/2020-03-01'))).toBe(false);
  expect(await readFile(join(root, '2020-02-01/keep.txt'), 'utf8')).toBe('unrelated');
  expect(await organize(root)).toEqual([]);
});

it.each(['2026-02-29', '2026-04-31', 'not-a-date'])('rejects %s before moving any article', async (date) => {
  const root = await rootDirectory();
  await article(root, 'a-valid');
  await article(root, 'z-invalid', date);
  await expect(organize(root)).rejects.toThrow(/Invalid published date/);
  expect(await readdir(root)).toEqual(['a-valid', 'z-invalid']);
});

it('rejects duplicate global slugs before moving anything', async () => {
  const root = await rootDirectory();
  await article(root, 'a-valid');
  await article(root, '2020-01-01/same');
  await article(root, 'drafts/2020-02-01/same', '2026-01-01', true);
  await expect(organize(root)).rejects.toThrow(/Duplicate writing slug: same/);
  expect(existsSync(join(root, 'a-valid/meta.yaml'))).toBe(true);
});

it.each(['directory', 'file', 'symlink', 'parent-file', 'parent-symlink'])('rejects an occupied %s destination before partial movement', async (kind) => {
  const root = await rootDirectory();
  await article(root, 'a-valid');
  await article(root, 'z-conflict');
  const parent = join(root, '2026-11-13');
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
  await expect(organize(root)).rejects.toThrow(/destination|Destination/);
  expect(existsSync(join(root, 'a-valid/meta.yaml'))).toBe(true);
  expect(existsSync(join(root, 'z-conflict/meta.yaml'))).toBe(true);
});

it('ignores hidden directories and symlinks and accepts real leap days', async () => {
  const root = await rootDirectory();
  await article(root, '.hidden/ignored', 'invalid');
  await article(root, 'leap', '2024-02-29', true);
  await symlink(join(root, 'leap'), join(root, 'linked'));
  expect(await organize(root)).toHaveLength(1);
  expect(existsSync(join(root, 'drafts/2024-02-29/leap/meta.yaml'))).toBe(true);
  expect(existsSync(join(root, '.hidden/ignored/meta.yaml'))).toBe(true);
});

it('rejects a target nested inside an existing article before moving anything', async () => {
  const root = await rootDirectory();
  await article(root, 'a-valid');
  await article(root, '2026-11-13');
  await expect(organize(root)).rejects.toThrow(/destination|Destination/);
  expect(existsSync(join(root, 'a-valid/meta.yaml'))).toBe(true);
  expect(existsSync(join(root, '2026-11-13/meta.yaml'))).toBe(true);
});
