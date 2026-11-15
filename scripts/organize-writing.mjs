import { mkdir, readFile, rename, rmdir } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import { isReservedWritingSlug, readWritingCategories } from './writing-categories.mjs';
import {
  assertUniqueWritingSlugs,
  assertWritingDate,
  assertWritingDestination,
  discoverWritingDirectories,
  isValidWritingSlug,
} from './writing-directories.mjs';

const USAGE = 'Usage: npm run organize:writing [-- --dry-run]';
const isDateFolder = (name) => /^\d{4}-\d{2}-\d{2}$/.test(name);

/**
 * Moves every article folder to `[drafts/]<category>/<publishedAt>/<slug>` from its metadata.
 * Every article and destination is validated before anything moves; `dryRun` only plans.
 * @param {{ root: string, categories: readonly string[], dryRun?: boolean }} options
 * @returns {Promise<{ from: string, to: string }[]>}
 */
export async function organizeWriting({ root, categories, dryRun = false }) {
  root = resolve(root);
  const registered = new Set(categories);
  const articles = discoverWritingDirectories(root);
  assertUniqueWritingSlugs(articles);
  const moves = [];
  for (const { directory, slug } of articles) {
    if (!isValidWritingSlug(slug)) throw new Error(`Invalid writing slug: ${slug}`);
    if (isReservedWritingSlug(slug)) throw new Error(`Reserved writing slug: ${slug}`);
    const meta = parse(await readFile(join(directory, 'meta.yaml'), 'utf8')) ?? {};
    const date = assertWritingDate(meta.publishedAt);
    if (meta.category === undefined || meta.category === null) {
      throw new Error(`Missing writing category for ${slug}`);
    }
    if (!registered.has(meta.category)) {
      throw new Error(`Unregistered writing category for ${slug}: ${meta.category}`);
    }
    const target = join(root, ...(meta.draft === true ? ['drafts'] : []), meta.category, date, slug);
    if (directory !== target) {
      if (articles.some((article) => target.startsWith(`${article.directory}/`))) {
        throw new Error(`Writing destination is inside an existing article: ${target}`);
      }
      assertWritingDestination(root, target);
      moves.push({ from: directory, to: target });
    }
  }
  if (dryRun) return moves;

  // Nothing is written until every article and destination has passed preflight.
  for (const move of moves) {
    await mkdir(dirname(move.to), { recursive: true });
    assertWritingDestination(root, move.to);
    await rename(move.from, move.to);
  }
  // Remove emptied storage folders only (dates, registered categories, drafts); keep anything else.
  const isStorageFolder = (name) => isDateFolder(name) || registered.has(name) || name === 'drafts';
  for (const move of moves) {
    let parent = dirname(move.from);
    while (parent !== root && parent.startsWith(`${root}/`) && isStorageFolder(basename(parent))) {
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

function parseArguments(argumentsList, env) {
  // `npm run organize:writing --dry-run` (without `--`) hands the flag to npm, which runs the
  // script with no arguments and sets npm_config_dry_run; treat that as the preview it meant.
  if (argumentsList.length === 0) return { dryRun: env.npm_config_dry_run === 'true' };
  if (argumentsList.length === 1 && argumentsList[0] === '--dry-run') return { dryRun: true };
  throw new Error(USAGE);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { dryRun } = parseArguments(process.argv.slice(2), process.env);
    const cwd = process.cwd();
    const categories = readWritingCategories(join(cwd, 'src/content/categories.yaml')).map(({ slug }) => slug);
    const moves = await organizeWriting({ root: join(cwd, 'src/content/writing'), categories, dryRun });
    for (const move of moves) console.log(`${relative(cwd, move.from)} -> ${relative(cwd, move.to)}`);
    if (moves.length === 0) console.log('Writing folders are already organized.');
    else if (dryRun) console.log(`Dry run: ${moves.length} planned move(s); nothing was changed.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
