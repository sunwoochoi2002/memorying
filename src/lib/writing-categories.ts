import { join } from 'node:path';
import { readWritingCategories } from '../../scripts/writing-categories.mjs';
import type { WritingCategory } from './writing';

export const WRITING_CATEGORIES_FILE = 'src/content/categories.yaml';

/** Read at build time from the project root; not cached so dev picks up edits. */
export function loadWritingCategories(root = process.cwd()): WritingCategory[] {
  return readWritingCategories(join(root, WRITING_CATEGORIES_FILE));
}
