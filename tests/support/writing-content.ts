import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * Reads the writing that actually exists in the repository, so tests can derive
 * their expectations from the content instead of hard-coding titles and counts.
 */

export const CONTENT_DIRECTORY = 'src/content/writing';
export const FIXTURE_DIRECTORY = 'tests/fixtures/writing';
export const COVER_EXTENSIONS = ['avif', 'jpeg', 'jpg', 'png', 'svg', 'webp'] as const;

export type Language = 'ko' | 'en';
export type WritingType = 'essay' | 'note';

export interface Translation {
  title: string;
  description: string;
  body: string;
}

export interface WritingCase {
  slug: string;
  source: 'content' | 'fixture';
  directory: string;
  type: WritingType;
  originalLanguage: Language;
  draft: boolean;
  featured: boolean;
  publishedAt: string;
  updatedAt?: string;
  translations: Record<Language, Translation>;
  /** The raw meta.yaml values, for checks that reuse the site's own schema. */
  meta: Record<string, unknown>;
  /** The single cover photo, when exactly one `cover.<ext>` file exists. */
  cover?: { file: string; alt: Record<Language, string> };
  /** Every `cover.<ext>` file found, so a check can flag more than one. */
  coverFiles: string[];
  files: string[];
}

function dateText(value: unknown, where: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) {
    throw new Error(`${where}: publishedAt must look like 2025-11-21 (found "${text}").`);
  }
  return text.slice(0, 10);
}

function readTranslation(directory: string, slug: string, language: Language): Translation {
  const path = join(directory, `${language}.mdx`);
  if (!existsSync(path)) throw new Error(`Writing "${slug}" is missing ${language}.mdx.`);
  const raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`Writing "${slug}" ${language}.mdx needs front matter (--- title and description ---) at the top.`);
  const data = (parse(match[1]) ?? {}) as Record<string, unknown>;
  return {
    title: String(data.title ?? '').trim(),
    description: String(data.description ?? '').trim(),
    body: match[2].trim(),
  };
}

export function readWritingCase(directory: string, slug: string, source: WritingCase['source']): WritingCase {
  const metaPath = join(directory, 'meta.yaml');
  if (!existsSync(metaPath)) throw new Error(`Writing "${slug}" is missing meta.yaml.`);
  const meta = (parse(readFileSync(metaPath, 'utf8')) ?? {}) as Record<string, unknown>;
  const files = readdirSync(directory).sort();

  const coverFiles = files.filter((name) => {
    const extension = name.split('.').at(-1)?.toLowerCase() ?? '';
    return name.startsWith('cover.') && name.split('.').length === 2 && (COVER_EXTENSIONS as readonly string[]).includes(extension);
  });
  const altText = (language: Language) => {
    const path = join(directory, `cover.alt.${language}.txt`);
    return existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
  };

  return {
    slug,
    source,
    directory,
    type: meta.type as WritingType,
    originalLanguage: meta.originalLanguage as Language,
    draft: meta.draft === true,
    featured: meta.featured === true,
    publishedAt: dateText(meta.publishedAt, `Writing "${slug}" meta.yaml`),
    updatedAt: meta.updatedAt === undefined ? undefined : dateText(meta.updatedAt, `Writing "${slug}" meta.yaml updatedAt`),
    meta,
    translations: {
      ko: readTranslation(directory, slug, 'ko'),
      en: readTranslation(directory, slug, 'en'),
    },
    cover: coverFiles.length === 1 ? { file: coverFiles[0], alt: { ko: altText('ko'), en: altText('en') } } : undefined,
    coverFiles,
    files,
  };
}

export interface WritingDirectory {
  directory: string;
  slug: string;
  source: WritingCase['source'];
}

/** Every article folder under the content (and optionally fixture) directory. */
export function writingDirectories(root: string, options: { fixtures?: boolean } = {}): WritingDirectory[] {
  const groups: Array<[string, WritingCase['source']]> = [[CONTENT_DIRECTORY, 'content']];
  if (options.fixtures) groups.push([FIXTURE_DIRECTORY, 'fixture']);
  return groups.flatMap(([relative, source]) => {
    const base = join(root, relative);
    if (!existsSync(base)) return [];
    return readdirSync(base)
      .filter((name) => !name.startsWith('.') && statSync(join(base, name)).isDirectory())
      .map((slug) => ({ directory: join(base, slug), slug, source }));
  });
}

/** Newest first, then by slug: the same order the site uses. */
export function sortCases(cases: WritingCase[]): WritingCase[] {
  return [...cases].sort((left, right) => {
    if (left.publishedAt !== right.publishedAt) return left.publishedAt < right.publishedAt ? 1 : -1;
    return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
  });
}

export function loadWritingCases(options: { root?: string; fixtures?: boolean } = {}): WritingCase[] {
  const root = options.root ?? process.cwd();
  return sortCases(
    writingDirectories(root, { fixtures: options.fixtures }).map(({ directory, slug, source }) => readWritingCase(directory, slug, source)),
  );
}

export function visibleCases(cases: WritingCase[], options: { includeDrafts: boolean }): WritingCase[] {
  return cases.filter((item) => options.includeDrafts || !item.draft);
}

export const originalTitle = (item: WritingCase): string => item.translations[item.originalLanguage].title;
export const originalDescription = (item: WritingCase): string => item.translations[item.originalLanguage].description;
export const otherLanguage = (item: WritingCase): Language => (item.originalLanguage === 'ko' ? 'en' : 'ko');
export const typeLabel = (type: WritingType): 'Essay' | 'Note' => (type === 'essay' ? 'Essay' : 'Note');
export const isoDatetime = (item: WritingCase): string => `${item.publishedAt}T00:00:00.000Z`;
export const articlePath = (item: WritingCase): string => `/writing/${item.slug}/`;

/** A plain sentence from the body that should appear verbatim on the page. */
export function firstPlainLine(body: string): string | undefined {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    // Only letters, numbers, spaces, and . , ! ? survive Markdown rendering unchanged (no smart quotes or dashes).
    .find((line) => line.length >= 4 && /^[\p{L}\p{N}\s.,!?]+$/u.test(line));
}

/** One article with a cover and one without, for checks that are costly to repeat for every article. */
export function representativeCases(cases: WritingCase[]): WritingCase[] {
  const picks = [cases.find((item) => item.cover), cases.find((item) => !item.cover)];
  return picks.filter((item, index): item is WritingCase => Boolean(item) && picks.indexOf(item) === index);
}
