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
  return z.strictObject({ title: nonemptyTextSchema });
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

const bilingualTextSchema = z.strictObject({ ko: nonemptyTextSchema, en: nonemptyTextSchema });
const profilePeriodSchema = nonemptyTextSchema.regex(/^\d{4}\.\d{2}(?:–(?:\d{4}\.\d{2}|Present))?$/);
const profileEntrySchema = z.strictObject({
  title: nonemptyTextSchema,
  period: nonemptyTextSchema,
  description: bilingualTextSchema,
  link: z.strictObject({ href: z.url(), label: bilingualTextSchema }).optional(),
});

export type ProfileEntry = z.infer<typeof profileEntrySchema>;

export function createAboutSchema() {
  return z.strictObject({
    labels: z.strictObject({
      pageTitle: nonemptyTextSchema,
      more: bilingualTextSchema,
      less: bilingualTextSchema,
    }),
    intro: z.strictObject({
      ko: z.array(nonemptyTextSchema).min(1),
      en: z.array(nonemptyTextSchema).min(1),
    }),
    affiliations: z.array(z.strictObject({
      title: nonemptyTextSchema,
      period: profilePeriodSchema,
    })).length(4),
  });
}

export function createProjectSchema() {
  return z.strictObject({
    name: nonemptyTextSchema,
    period: nonemptyTextSchema,
    order: z.number().int().nonnegative(),
    description: bilingualTextSchema,
    award: nonemptyTextSchema.optional(),
    url: z.url().optional(),
  });
}

export function createExperienceSchema() {
  return z.strictObject({
    id: z.enum(['education', 'work-research', 'activities', 'awards']),
    heading: nonemptyTextSchema,
    order: z.number().int().nonnegative(),
    entries: z.array(profileEntrySchema).min(1),
  });
}
