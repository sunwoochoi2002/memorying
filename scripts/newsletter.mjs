import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { isValidWritingSlug } from './new-writing.mjs';

const languages = ['ko', 'en'];
const defaultSiteUrl = 'https://sunwoochoi.com';
const footerLabel = '웹에서 읽기 · Read on the web';
const authorName = 'Sunwoo Choi';

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Writing file has no frontmatter.');
  }
  return { data: parse(match[1]) ?? {}, content: match[2] };
}

function assertPlainMarkdown(content, slug) {
  if (/^\s*(import|export)\s/m.test(content) || /<[A-Z][A-Za-z0-9]*[\s/>]/.test(content)) {
    throw new Error(`${slug} uses MDX-only syntax (import, export, or a component) that an email cannot render.`);
  }
}

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * @param {{ root: string, slug: string, siteUrl?: string, language?: string }} options
 */
export async function buildNewsletter({ root, slug, siteUrl = defaultSiteUrl, language }) {
  if (!isValidWritingSlug(slug)) {
    throw new Error(`Invalid writing slug: ${slug}`);
  }

  const metaSource = await readOptional(join(root, slug, 'meta.yaml'));
  if (metaSource === undefined) {
    throw new Error(`Writing not found: ${slug}`);
  }

  const meta = parse(metaSource) ?? {};
  if (meta.draft === true) {
    throw new Error(`${slug} is a draft. Publish it (draft: false) before making its newsletter.`);
  }

  const chosenLanguage = language ?? meta.originalLanguage;
  if (!languages.includes(chosenLanguage)) {
    throw new Error(`Unsupported language: ${chosenLanguage}. Use ko or en.`);
  }

  const { data, content } = splitFrontmatter(await readFile(join(root, slug, `${chosenLanguage}.mdx`), 'utf8'));
  const subject = String(data.title ?? '').trim();
  if (subject === '') {
    throw new Error(`${slug} has no ${chosenLanguage} title.`);
  }

  assertPlainMarkdown(content, slug);

  const articleUrl = `${siteUrl.replace(/\/+$/, '')}/writing/${slug}/`;
  const body = `${content.trim()}\n\n---\n\n${footerLabel}\n${articleUrl}\n\n${authorName}\n`;

  return { subject, body, language: chosenLanguage };
}

export async function writeNewsletter({ mail, slug, outputDirectory }) {
  await mkdir(outputDirectory, { recursive: true });
  const target = join(outputDirectory, `${slug}.${mail.language}.md`);
  await writeFile(target, mail.body, 'utf8');
  return target;
}

function parseArguments(argumentsList) {
  const usage = 'Usage: npm run newsletter -- <slug> [--lang <ko|en>]';
  const [slug, ...rest] = argumentsList;
  if (!slug || slug.startsWith('--')) throw new Error(usage);
  if (rest.length === 0) return { slug };
  if (rest.length === 2 && rest[0] === '--lang') return { slug, language: rest[1] };
  throw new Error(usage);
}

async function runCli() {
  try {
    const { slug, language } = parseArguments(process.argv.slice(2));
    const mail = await buildNewsletter({
      root: join(process.cwd(), 'src/content/writing'),
      slug,
      language,
      siteUrl: process.env.SITE_URL || defaultSiteUrl,
    });
    const written = await writeNewsletter({
      mail,
      slug,
      outputDirectory: join(process.cwd(), '.newsletter'),
    });
    console.log(`Subject: ${mail.subject}`);
    console.log(`Body:    ${relative(process.cwd(), written)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli();
}
