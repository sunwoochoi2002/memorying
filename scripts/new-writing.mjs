import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { isReservedWritingSlug, readWritingCategories } from './writing-categories.mjs';
import { assertWritingDate, assertWritingDestination, isValidWritingSlug, writingSlugExists } from './writing-directories.mjs';
export { isValidWritingSlug } from './writing-directories.mjs';

const USAGE = 'Usage: npm run new:writing -- <slug> --original <ko|en> --category <slug>';

function assertWritingDraftInput({ slug, originalLanguage, category, categories, publishedAt }) {
  if (!isValidWritingSlug(slug)) {
    throw new Error(`Invalid writing slug: ${slug}`);
  }

  if (isReservedWritingSlug(slug)) {
    throw new Error(`Reserved writing slug: ${slug}`);
  }

  if (originalLanguage !== 'ko' && originalLanguage !== 'en') {
    throw new Error(`Invalid original language: ${originalLanguage}`);
  }

  if (category === undefined || category === null) {
    throw new Error('Missing writing category');
  }

  if (!categories.includes(category)) {
    throw new Error(`Unregistered writing category: ${category}`);
  }

  assertWritingDate(publishedAt);
}

function metadata({ originalLanguage, category, publishedAt }) {
  return `publishedAt: ${publishedAt}\ncategory: ${category}\noriginalLanguage: ${originalLanguage}\ndraft: true\nfeatured: false\n`;
}

function koreanDraft() {
  return `---\ntitle: \"[Draft] 한국어 제목\"\n---\n\n한국어 본문을 작성하세요.\n`;
}

function englishDraft() {
  return `---\ntitle: \"[Draft] English title\"\n---\n\nWrite the English body here.\n`;
}

/**
 * Creates `drafts/<category>/<publishedAt>/<slug>/` atomically. `categories` lists the registered slugs.
 * @param {{ root: string, slug: string, originalLanguage: 'ko' | 'en', category: string, categories: readonly string[], publishedAt: string }} options
 */
export async function createWritingDraft({ root, slug, originalLanguage, category, categories, publishedAt }) {
  assertWritingDraftInput({ slug, originalLanguage, category, categories, publishedAt });

  const parent = join(root, 'drafts', category, publishedAt);
  const target = join(parent, slug);
  if (writingSlugExists(root, slug, categories)) {
    throw new Error(`Writing already exists: ${slug}`);
  }

  assertWritingDestination(root, target);
  await mkdir(root, { recursive: true });
  const temporaryDirectory = await mkdtemp(join(root, `.${slug}-`));
  try {
    await Promise.all([
      writeFile(join(temporaryDirectory, 'meta.yaml'), metadata({ originalLanguage, category, publishedAt }), 'utf8'),
      writeFile(join(temporaryDirectory, 'ko.md'), koreanDraft(), 'utf8'),
      writeFile(join(temporaryDirectory, 'en.md'), englishDraft(), 'utf8'),
    ]);
    await mkdir(parent, { recursive: true });
    assertWritingDestination(root, target);
    await rename(temporaryDirectory, target);
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true });
    throw error;
  }

  return target;
}

const OPTIONS = { '--original': 'originalLanguage', '--category': 'category' };

/** Accepts one slug plus `--original` and `--category` once each, in any order. */
export function parseNewWritingArguments(argumentsList) {
  const parsed = {};
  const slugs = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument.startsWith('-')) {
      const key = OPTIONS[argument];
      const value = argumentsList[index + 1];
      if (!key || key in parsed || value === undefined || value.startsWith('-')) throw new Error(USAGE);
      parsed[key] = value;
      index += 1;
    } else {
      slugs.push(argument);
    }
  }
  if (slugs.length !== 1 || !parsed.originalLanguage || !parsed.category) throw new Error(USAGE);
  return { slug: slugs[0], originalLanguage: parsed.originalLanguage, category: parsed.category };
}

async function runCli() {
  try {
    const { slug, originalLanguage, category } = parseNewWritingArguments(process.argv.slice(2));
    const categories = readWritingCategories(join(process.cwd(), 'src/content/categories.yaml')).map(({ slug }) => slug);
    const created = await createWritingDraft({
      root: join(process.cwd(), 'src/content/writing'),
      slug,
      originalLanguage,
      category,
      categories,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    console.log(relative(process.cwd(), created));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli();
}
