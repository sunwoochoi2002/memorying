import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  createWorkSchema,
  createWritingMetadataSchema,
  createWritingTranslationSchema,
} from './lib/content-schema';
import { getWritingMetaSourceId, getWritingSourceId } from './lib/writing';
import {
  createWritingGlobPattern,
  resolveWritingSourceDirectories,
  stripWritingSourceDirectory,
} from './lib/writing-sources';

// Real writing lives in src/content/writing. Test fixtures under tests/fixtures/writing
// join only when WRITING_FIXTURES=1 (set by Playwright and the production build test).
const writingDirectories = resolveWritingSourceDirectories(process.env);

const writing = defineCollection({
  loader: glob({
    pattern: createWritingGlobPattern(writingDirectories, '**/*.md'),
    base: '.',
    generateId: ({ entry }) =>
      getWritingSourceId(stripWritingSourceDirectory(entry, writingDirectories)),
  }),
  schema: createWritingTranslationSchema(),
});

const writingMeta = defineCollection({
  loader: glob({
    pattern: createWritingGlobPattern(writingDirectories, '**/meta.(yaml|yml)'),
    base: '.',
    generateId: ({ entry }) =>
      getWritingMetaSourceId(stripWritingSourceDirectory(entry, writingDirectories)),
  }),
  schema: ({ image }) => createWritingMetadataSchema(image()),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/work' }),
  schema: ({ image }) => createWorkSchema(image()),
});

export const collections = { writing, writingMeta, work };
