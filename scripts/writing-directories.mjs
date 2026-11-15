import { lstatSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

export function isValidWritingSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function assertWritingDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid published date: ${value}`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid published date: ${value}`);
  }
  return value;
}

export function pathStatus(path) {
  try { return lstatSync(path); }
  catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Article folders are leaves: attachments travel with them and are never scanned. */
export function discoverWritingDirectories(root) {
  const articles = [];
  function visit(directory) {
    const entries = readdirSync(directory, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && ['meta.yaml', 'meta.yml', 'ko.md', 'en.md'].includes(entry.name))) {
      articles.push({ directory, slug: basename(directory) });
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) visit(join(directory, entry.name));
    }
  }
  if (pathStatus(root)?.isDirectory() && !pathStatus(root).isSymbolicLink()) visit(root);
  return articles;
}

export function assertUniqueWritingSlugs(articles) {
  const seen = new Set();
  for (const { slug } of articles) {
    if (seen.has(slug)) throw new Error(`Duplicate writing slug: ${slug}`);
    seen.add(slug);
  }
}

const ARTICLE_FILES = ['meta.yaml', 'meta.yml', 'ko.md', 'en.md'];

/**
 * Includes unfinished folders with no metadata, so scaffolding cannot reuse their slug.
 * Storage folders (`drafts`, a registered category, a date) above articles are not slugs.
 */
export function writingSlugExists(root, slug, categories = []) {
  const isStorageName = (name) => name === 'drafts' || categories.includes(name) || /^\d{4}-\d{2}-\d{2}$/.test(name);
  function visit(directory) {
    const entries = readdirSync(directory, { withFileTypes: true });
    if (directory !== root && entries.some((entry) => entry.isFile() && ARTICLE_FILES.includes(entry.name))) return false;
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const path = join(directory, entry.name);
      if (entry.name === slug) {
        if (!entry.isDirectory() || !isStorageName(entry.name)) return true;
        if (readdirSync(path, { withFileTypes: true }).some((child) => child.isFile() && ARTICLE_FILES.includes(child.name))) return true;
      }
      if (entry.isDirectory() && visit(path)) return true;
    }
    return false;
  }
  return pathStatus(root)?.isDirectory() ? visit(root) : false;
}

/** Validate all ancestors without following symlinks, including dangling ones. */
export function assertWritingDestination(root, target) {
  const parts = relative(resolve(root), resolve(target)).split('/');
  let directory = resolve(root);
  for (let index = 0; index < parts.length; index += 1) {
    directory = join(directory, parts[index]);
    const status = pathStatus(directory);
    if (status && (index === parts.length - 1 || !status.isDirectory() || status.isSymbolicLink())) {
      throw new Error(`Writing destination is occupied: ${directory}`);
    }
  }
}
