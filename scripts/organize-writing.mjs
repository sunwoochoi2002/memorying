import { mkdir, readFile, rename, rmdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  assertUniqueWritingSlugs,
  assertWritingDate,
  assertWritingDestination,
  discoverWritingDirectories,
  isValidWritingSlug,
} from './writing-directories.mjs';

export async function organizeWriting({ root }) {
  root = resolve(root);
  const articles = discoverWritingDirectories(root);
  assertUniqueWritingSlugs(articles);
  const moves = [];
  for (const { directory, slug } of articles) {
    if (!isValidWritingSlug(slug)) throw new Error(`Invalid writing slug: ${slug}`);
    const meta = parse(await readFile(join(directory, 'meta.yaml'), 'utf8')) ?? {};
    const date = assertWritingDate(meta.publishedAt);
    const target = join(root, ...(meta.draft === true ? ['drafts'] : []), date, slug);
    if (directory !== target) {
      if (articles.some((article) => target.startsWith(`${article.directory}/`))) {
        throw new Error(`Writing destination is inside an existing article: ${target}`);
      }
      assertWritingDestination(root, target);
      moves.push({ from: directory, to: target });
    }
  }
  // Nothing is written until every article and destination has passed preflight.
  for (const move of moves) {
    await mkdir(dirname(move.to), { recursive: true });
    assertWritingDestination(root, move.to);
    await rename(move.from, move.to);
  }
  for (const move of moves) {
    let parent = dirname(move.from);
    // Remove empty former date groups only; preserve unrelated files/directories.
    while (parent !== root && /^\d{4}-\d{2}-\d{2}$/.test(parent.split('/').at(-1))) {
      try { await rmdir(parent); }
      catch (error) {
        if (['ENOTEMPTY', 'ENOENT', 'EEXIST'].includes(error.code)) break;
        throw error;
      }
      parent = dirname(parent);
    }
  }
  return moves;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const moves = await organizeWriting({ root: join(process.cwd(), 'src/content/writing') });
    for (const move of moves) console.log(`${relative(process.cwd(), move.from)} -> ${relative(process.cwd(), move.to)}`);
    if (moves.length === 0) console.log('Writing folders are already organized.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
