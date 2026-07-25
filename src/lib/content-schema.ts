import { z } from 'astro/zod';

const nonemptyTextSchema = z.string().trim().min(1);
const contentDateSchema = z
  .union([z.date(), nonemptyTextSchema])
  .pipe(z.coerce.date());

const writingMetadataCoreSchema = z.object({
  publishedAt: contentDateSchema,
  updatedAt: contentDateSchema.optional(),
  type: z.enum(['essay', 'note']),
  originalLanguage: z.enum(['ko', 'en']),
  draft: z.boolean(),
  featured: z.boolean().default(false),
  canonicalUrl: z.url().optional(),
});

export function createWritingTranslationSchema() {
  return z.object({ title: nonemptyTextSchema, description: nonemptyTextSchema });
}

export function createWritingMetadataSchema<T extends z.ZodType>(imageSchema: T) {
  return writingMetadataCoreSchema
    .extend({
      coverImage: imageSchema.optional(),
      coverImageAlt: z.object({
        ko: nonemptyTextSchema,
        en: nonemptyTextSchema,
      }).optional(),
    })
    .superRefine((value, context) => {
      if (value.type === 'note' && value.featured) {
        context.addIssue({ code: 'custom', path: ['featured'], message: 'Only essays may be featured.' });
      }
      if (!value.draft && value.publishedAt.getTime() > Date.now()) {
        context.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Published writing cannot use a future date.' });
      }
      if (Boolean(value.coverImage) !== Boolean(value.coverImageAlt)) {
        context.addIssue({
          code: 'custom',
          path: ['coverImageAlt'],
          message: 'Cover images require Korean and English alternative text, and unused cover alt text is not allowed.',
        });
      }
    });
}

const workCoreSchema = z.object({
  title: nonemptyTextSchema,
  period: nonemptyTextSchema,
  role: nonemptyTextSchema,
  description: nonemptyTextSchema,
  status: nonemptyTextSchema.optional(),
  url: z.url().optional(),
  order: z.number().int().nonnegative(),
});

export function createWorkSchema<T extends z.ZodType>(imageSchema: T) {
  return workCoreSchema.extend({ image: imageSchema.optional() });
}
