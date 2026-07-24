import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { createWorkSchema, createWritingSchema } from './lib/content-schema';
import { getWritingSourceId } from './lib/writing';

const writing = defineCollection({
  loader: glob({
    pattern: '**/*.(md|mdx)',
    base: './src/content/writing',
    generateId: ({ entry }) => getWritingSourceId(entry),
  }),
  schema: ({ image }) => createWritingSchema(image()),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/work' }),
  schema: ({ image }) => createWorkSchema(image()),
});

export const collections = { writing, work };
