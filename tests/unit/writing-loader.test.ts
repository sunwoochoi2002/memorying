import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWritingMetaSourceId } from '../../src/lib/writing';
import { createWritingLoader } from '../../src/lib/writing-loader';
import { stripWritingSourceDirectory } from '../../src/lib/writing-sources';

const directories = ['src/content/writing'];
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function writeMeta(root: string, relativeDirectory: string, publishedAt = '2026-01-01') {
  const directory = join(root, 'src/content/writing', relativeDirectory);
  mkdirSync(directory, { recursive: true });
  const file = join(directory, 'meta.yaml');
  writeFileSync(file, `publishedAt: ${publishedAt}\n`);
  return file;
}

/** Runs the real Astro glob loader against a temporary project with a fake dev watcher. */
type Entry = { id: string; filePath?: string; digest?: string };
const digestOf = (contents: string) => createHash('sha256').update(contents).digest('hex');

/** `cached` mimics entries left in Astro's data store by an earlier dev server or build. */
async function startWatchedLoader(root: string, cached: Entry[] = []) {
  const entries = new Map<string, Entry>(cached.map((entry) => [entry.id, entry]));
  const handlers: Record<string, (path: string) => Promise<void>> = {};
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const rootUrl = pathToFileURL(`${root}/`);
  const loader = createWritingLoader(directories, '**/meta.(yaml|yml)', (entry) =>
    getWritingMetaSourceId(stripWritingSourceDirectory(entry, directories)),
  );

  await loader.load({
    config: { root: rootUrl, srcDir: new URL('src/', rootUrl) },
    collection: 'writingMeta',
    logger,
    watcher: { add: () => {}, on: (event: string, handler: (path: string) => Promise<void>) => { handlers[event] = handler; } },
    parseData: async ({ data }: { data: unknown }) => data,
    generateDigest: digestOf,
    entryTypes: new Map([['.yaml', { getEntryInfo: ({ contents }: { contents: string }) => ({ data: parse(contents), body: '' }) }]]),
    store: {
      keys: () => [...entries.keys()],
      get: (id: string) => entries.get(id),
      set: (entry: Entry) => { entries.set(entry.id, entry); return true; },
      delete: (id: string) => { entries.delete(id); },
      addModuleImport: () => {},
      addAssetImports: () => {},
    },
  } as never);

  return { entries, handlers, logger };
}

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'memorying-loader-'));
  roots.push(root);
  return root;
}

describe('writing collection loader', () => {
  it('rejects a duplicate slug added while the dev server is running and keeps the existing article', async () => {
    const root = tempRoot();
    writeMeta(root, '2026-01-01/same');
    const { entries, handlers, logger } = await startWatchedLoader(root);

    await handlers.add(writeMeta(root, '2026-02-01/same', '2026-02-01'));

    expect(entries.get('same')?.filePath).toBe('src/content/writing/2026-01-01/same/meta.yaml');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Duplicate writing slug: same'));
  });

  it('keeps the existing article when the rejected duplicate is deleted again', async () => {
    const root = tempRoot();
    writeMeta(root, '2026-01-01/same');
    const { entries, handlers } = await startWatchedLoader(root);
    const duplicate = writeMeta(root, '2026-02-01/same', '2026-02-01');
    await handlers.add(duplicate);

    rmSync(duplicate);
    await handlers.unlink(duplicate);

    expect(entries.get('same')?.filePath).toBe('src/content/writing/2026-01-01/same/meta.yaml');
  });

  it('accepts edits to the same file and an article moved to another category and date folder', async () => {
    const root = tempRoot();
    const original = writeMeta(root, 'essay/2026-01-01/same');
    const { entries, handlers, logger } = await startWatchedLoader(root);

    writeFileSync(original, 'publishedAt: 2026-03-01\n');
    await handlers.change(original);
    mkdirSync(join(root, 'src/content/writing/note/2026-03-01'), { recursive: true });
    renameSync(join(root, 'src/content/writing/essay/2026-01-01/same'), join(root, 'src/content/writing/note/2026-03-01/same'));
    await handlers.unlink(original);
    await handlers.add(join(root, 'src/content/writing/note/2026-03-01/same/meta.yaml'));

    expect(entries.get('same')?.filePath).toBe('src/content/writing/note/2026-03-01/same/meta.yaml');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('refreshes a cached entry whose unchanged file was moved to another folder before startup', async () => {
    const root = tempRoot();
    writeMeta(root, 'essay/2026-01-01/same');
    const cached = { id: 'same', filePath: 'src/content/writing/2026-01-01/same/meta.yaml', digest: digestOf('publishedAt: 2026-01-01\n') };

    const { entries } = await startWatchedLoader(root, [cached]);

    expect(entries.get('same')?.filePath).toBe('src/content/writing/essay/2026-01-01/same/meta.yaml');
  });

  it('fails the initial load when two folders share a slug', async () => {
    const root = tempRoot();
    writeMeta(root, 'essay/2026-01-01/same');
    writeMeta(root, 'drafts/note/2026-02-01/same');

    await expect(startWatchedLoader(root)).rejects.toThrow('Duplicate writing slug: same');
  });
});
