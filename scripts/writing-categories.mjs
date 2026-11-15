import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { isValidWritingSlug } from './writing-directories.mjs';

/**
 * @typedef {{ slug: string, name: { ko: string, en: string }, newsletter: boolean }} WritingCategory
 */

/** `drafts` is the draft folder and `category` is the /writing/category/ route. */
export const RESERVED_CATEGORY_SLUGS = Object.freeze(['drafts', 'category']);
/** An article called `category` would collide with /writing/category/<slug>/. */
export const RESERVED_WRITING_SLUGS = Object.freeze(['category']);

/** @param {unknown} slug */
export function isReservedWritingSlug(slug) {
  return RESERVED_WRITING_SLUGS.includes(/** @type {string} */ (slug));
}

/**
 * The build calls this so a hand-made `category` article fails before it can ship.
 * @param {readonly { slug: string, directory: string }[]} articles
 */
export function assertNoReservedWritingSlugs(articles) {
  for (const { slug, directory } of articles) {
    if (isReservedWritingSlug(slug)) throw new Error(`Reserved writing slug: ${slug} (${directory})`);
  }
}

const isNonemptyText = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * Reads the category registry. File order is display order.
 * @param {string} path
 * @returns {WritingCategory[]}
 */
export function readWritingCategories(path) {
  const entries = parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`${path}: the category registry must be a non-empty list.`);
  }

  const seen = new Set();
  return entries.map((entry, index) => {
    const where = `${path}: category ${index + 1}`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`${where} must have slug, name, and newsletter.`);
    }
    const { slug, name, newsletter } = entry;
    if (!isValidWritingSlug(slug)) {
      throw new Error(`${where}: invalid slug "${slug}". Use lowercase ASCII letters and numbers separated by single hyphens.`);
    }
    if (RESERVED_CATEGORY_SLUGS.includes(slug)) {
      throw new Error(`${where}: "${slug}" is a reserved slug (${RESERVED_CATEGORY_SLUGS.join(', ')}).`);
    }
    if (seen.has(slug)) throw new Error(`${where}: duplicate slug "${slug}".`);
    seen.add(slug);
    if (name === null || typeof name !== 'object' || !isNonemptyText(name.ko) || !isNonemptyText(name.en)) {
      throw new Error(`${where} ("${slug}"): name needs non-empty ko and en text.`);
    }
    if (typeof newsletter !== 'boolean') {
      throw new Error(`${where} ("${slug}"): newsletter must be true or false.`);
    }
    return { slug, name: { ko: name.ko.trim(), en: name.en.trim() }, newsletter };
  });
}
