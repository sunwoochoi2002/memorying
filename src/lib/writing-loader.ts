import { existsSync } from 'node:fs';
import { glob } from 'astro/loaders';
import { createWritingGlobPattern } from './writing-sources';

/**
 * Glob loader for writing files whose IDs come from the article's leaf slug.
 * Astro silently overwrites an entry when a second file produces the same ID, so an ID
 * already claimed by another file that still exists is rejected. During the initial load
 * that fails the build; for files added while the dev server runs, Astro logs the error
 * and keeps the existing article.
 */
export function createWritingLoader(
  directories: readonly string[],
  filePattern: string,
  toId: (entry: string) => string,
) {
  const entryById = new Map<string, string>();

  return glob({
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
}
