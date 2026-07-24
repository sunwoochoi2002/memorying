import { z } from 'astro/zod';

const writingCoreSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  type: z.enum(['essay', 'note']),
  language: z.enum(['ko', 'en']),
  draft: z.boolean(),
  featured: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  coverImageAlt: z.string().min(1).optional(),
});

export function createWritingSchema<T extends z.ZodType>(imageSchema: T) {
  return writingCoreSchema
    .extend({ coverImage: imageSchema.optional() })
    .superRefine((value, context) => {
      if (value.type === 'note' && value.featured) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['featured'],
          message: 'Only essays may be featured.',
        });
      }

      if (!value.draft && value.publishedAt.getTime() > Date.now()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['publishedAt'],
          message: 'Published writing cannot use a future date.',
        });
      }

      if (value.coverImage && !value.coverImageAlt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['coverImageAlt'],
          message: 'Cover images require meaningful alternative text.',
        });
      }
    });
}

const workCoreSchema = z.object({
  title: z.string().min(1),
  period: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  status: z.string().min(1).optional(),
  url: z.string().url().optional(),
  order: z.number().int().nonnegative(),
});

export function createWorkSchema<T extends z.ZodType>(imageSchema: T) {
  return workCoreSchema.extend({ image: imageSchema.optional() });
}
