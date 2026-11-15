import { existsSync } from 'node:fs';
import { glob } from 'astro/loaders';
import { createWritingGlobPattern } from './writing-sources';

/**
 * Glob loader for writing files whose IDs come from the article's leaf slug.
 * Astro silently overwrites an entry when a second file produces the same ID, so an ID
 * already claimed by another file that still exists is rejected. During the initial load
 * that fails the build; for files added while the dev server runs, Astro logs the error
 * and keeps the existing article.
 *
 * Astro reuses a cached entry whose file contents are unchanged, including its old
 * `filePath`, so an article folder moved by `npm run organize:writing` would keep pointing
 * at its former location (and lose its cover). Entries whose cached file no longer exists
 * are dropped before each load so they are read again from where they now live.
 */
export function createWritingLoader(
  directories: readonly string[],
  filePattern: string,
  toId: (entry: string) => string,
) {
  const entryById = new Map<string, string>();

  const loader = glob({
    pattern: createWritingGlobPattern(directories, filePattern),
    base: '.',
    generateId: ({ entry, base }) => {
      const id = toId(entry);
      const claimedBy = entryById.get(id);
      if (claimedBy && claimedBy !== entry && existsSync(new URL(encodeURI(claimedBy), base))) {
        throw new Error(`Duplicate writing slug: ${id.split('/')[0]} (${claimedBy} and ${entry})`);
      }
      entryById.set(id, entry);
      return id;
    },
  });

  return {
    ...loader,
    load: async (context: Parameters<typeof loader.load>[0]) => {
      for (const id of context.store.keys()) {
        const filePath = context.store.get(id)?.filePath;
        if (filePath && !existsSync(new URL(encodeURI(filePath), context.config.root))) context.store.delete(id);
      }
      return loader.load(context);
    },
  };
}
