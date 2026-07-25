import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  createWorkSchema,
  createWritingMetadataSchema,
  createWritingTranslationSchema,
} from './lib/content-schema';
import { getWritingMetaSourceId, getWritingSourceId } from './lib/writing';

const writing = defineCollection({
  loader: glob({
    pattern: '**/*.(md|mdx)',
    base: './src/content/writing',
    generateId: ({ entry }) => getWritingSourceId(entry),
  }),
  schema: createWritingTranslationSchema(),
});

const writingMeta = defineCollection({
  loader: glob({
    pattern: '**/meta.(yaml|yml)',
    base: './src/content/writing',
    generateId: ({ entry }) => getWritingMetaSourceId(entry),
  }),
  schema: ({ image }) => createWritingMetadataSchema(image()),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/work' }),
  schema: ({ image }) => createWorkSchema(image()),
});

export const collections = { writing, writingMeta, work };
