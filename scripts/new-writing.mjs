import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { assertWritingDate, assertWritingDestination, isValidWritingSlug, writingSlugExists } from './writing-directories.mjs';
export { isValidWritingSlug } from './writing-directories.mjs';

function assertWritingDraftInput({ slug, originalLanguage, publishedAt }) {
  if (!isValidWritingSlug(slug)) {
    throw new Error(`Invalid writing slug: ${slug}`);
  }

  if (originalLanguage !== 'ko' && originalLanguage !== 'en') {
    throw new Error(`Invalid original language: ${originalLanguage}`);
  }

  assertWritingDate(publishedAt);
}

function metadata({ originalLanguage, publishedAt }) {
  return `publishedAt: ${publishedAt}\ntype: essay\noriginalLanguage: ${originalLanguage}\ndraft: true\nfeatured: false\n`;
}

function koreanDraft() {
  return `---\ntitle: \"[Draft] 한국어 제목\"\n---\n\n한국어 본문을 작성하세요.\n`;
}

function englishDraft() {
  return `---\ntitle: \"[Draft] English title\"\n---\n\nWrite the English body here.\n`;
}

export async function createWritingDraft({ root, slug, originalLanguage, publishedAt }) {
  assertWritingDraftInput({ slug, originalLanguage, publishedAt });

  const target = join(root, 'drafts', publishedAt, slug);
  if (writingSlugExists(root, slug)) {
    throw new Error(`Writing already exists: ${slug}`);
  }

  assertWritingDestination(root, target);
  await mkdir(root, { recursive: true });
  const temporaryDirectory = await mkdtemp(join(root, `.${slug}-`));
  try {
    await Promise.all([
      writeFile(join(temporaryDirectory, 'meta.yaml'), metadata({ originalLanguage, publishedAt }), 'utf8'),
      writeFile(join(temporaryDirectory, 'ko.md'), koreanDraft(), 'utf8'),
      writeFile(join(temporaryDirectory, 'en.md'), englishDraft(), 'utf8'),
    ]);
    await mkdir(join(root, 'drafts', publishedAt), { recursive: true });
    assertWritingDestination(root, target);
    await rename(temporaryDirectory, target);
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true });
    throw error;
  }

  return target;
}

function parseArguments(argumentsList) {
  if (argumentsList.length !== 3 || argumentsList[1] !== '--original') {
    throw new Error('Usage: npm run new:writing -- <slug> --original <ko|en>');
  }

  return { slug: argumentsList[0], originalLanguage: argumentsList[2] };
}

async function runCli() {
  try {
    const { slug, originalLanguage } = parseArguments(process.argv.slice(2));
    const created = await createWritingDraft({
      root: join(process.cwd(), 'src/content/writing'),
      slug,
      originalLanguage,
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
