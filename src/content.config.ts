import { defineCollection } from 'astro:content';
import { assertNoReservedWritingSlugs } from '../scripts/writing-categories.mjs';
import { assertUniqueWritingSlugs, discoverWritingDirectories } from '../scripts/writing-directories.mjs';
import { glob } from 'astro/loaders';
import {
  createAboutSchema,
  createExperienceSchema,
  createProjectSchema,
  createWritingMetadataSchema,
  createWritingTranslationSchema,
} from './lib/content-schema';
import { getWritingMetaSourceId, getWritingSourceId } from './lib/writing';
import { loadWritingCategories } from './lib/writing-categories';
import { createWritingLoader } from './lib/writing-loader';
import { resolveWritingSourceDirectories, stripWritingSourceDirectory } from './lib/writing-sources';

// Real writing lives in src/content/writing. Test fixtures under tests/fixtures/writing
// join only when WRITING_FIXTURES=1 (set by Playwright and the production build test).
const writingDirectories = resolveWritingSourceDirectories(process.env);
// Reject duplicate slugs up front; createWritingLoader also rejects ones added during dev.
const writingArticles = writingDirectories.flatMap(discoverWritingDirectories);
assertUniqueWritingSlugs(writingArticles);
assertNoReservedWritingSlugs(writingArticles);
// Every meta.yaml category must be listed in src/content/categories.yaml.
const categorySlugs = loadWritingCategories().map(({ slug }) => slug);

const writing = defineCollection({
  loader: createWritingLoader(writingDirectories, '**/*.md', (entry) =>
    getWritingSourceId(stripWritingSourceDirectory(entry, writingDirectories)),
  ),
  schema: createWritingTranslationSchema(),
});

const writingMeta = defineCollection({
  loader: createWritingLoader(writingDirectories, '**/meta.(yaml|yml)', (entry) =>
    getWritingMetaSourceId(stripWritingSourceDirectory(entry, writingDirectories)),
  ),
  schema: ({ image }) => createWritingMetadataSchema(image(), categorySlugs),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/projects' }),
  schema: createProjectSchema(),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/experience' }),
  schema: createExperienceSchema(),
});

const about = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/about' }),
  schema: createAboutSchema(),
});

export const collections = { writing, writingMeta, projects, experience, about };
