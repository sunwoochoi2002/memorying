import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import {
  createWorkSchema,
  createWritingMetadataSchema,
  createWritingTranslationSchema,
} from '../../src/lib/content-schema';

const metadataSchema = createWritingMetadataSchema(z.string());
const translationSchema = createWritingTranslationSchema();
const workSchema = createWorkSchema(z.string());
const workBase = {
  title: 'Memorying',
  period: '2026',
  role: 'Designer and Developer',
  description: 'A personal writing and archival space.',
  status: 'Active',
  order: 1,
};
const metadata = {
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  originalLanguage: 'ko' as const,
  draft: false,
};
const translation = {
  title: '기억은 어떻게 장소가 되는가',
  description: '개인 아카이브와 기억에 관한 글',
};

describe('work schema', () => {
  it('accepts complete project metadata', () => {
    expect(workSchema.safeParse(workBase).success).toBe(true);
  });

  it('rejects whitespace-only text and trims accepted text', () => {
    expect(workSchema.safeParse({ ...workBase, title: '   ' }).success).toBe(false);
    expect(workSchema.safeParse({ ...workBase, period: '   ' }).success).toBe(false);
    expect(workSchema.safeParse({ ...workBase, role: '   ' }).success).toBe(false);
    expect(workSchema.safeParse({ ...workBase, description: '   ' }).success).toBe(false);
    expect(workSchema.safeParse({ ...workBase, status: '   ' }).success).toBe(false);

    const result = workSchema.safeParse({
      ...workBase,
      title: '  Memorying  ',
      period: '  2026  ',
      role: '  Designer and Developer  ',
      description: '  A person-first personal writing and archival space.  ',
      status: '  Active  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        title: 'Memorying',
        period: '2026',
        role: 'Designer and Developer',
        description: 'A person-first personal writing and archival space.',
        status: 'Active',
      });
    }
  });

  it('requires an explicit display order', () => {
    const { order: _order, ...withoutOrder } = workBase;
    expect(workSchema.safeParse(withoutOrder).success).toBe(false);
  });

  it('rejects a negative display order', () => {
    expect(workSchema.safeParse({ ...workBase, order: -1 }).success).toBe(false);
  });

  it('rejects a fractional display order', () => {
    expect(workSchema.safeParse({ ...workBase, order: 1.5 }).success).toBe(false);
  });

  it('rejects invalid project URLs', () => {
    expect(workSchema.safeParse({ ...workBase, url: 'not a URL' }).success).toBe(false);
  });
});

describe('bilingual writing schemas', () => {
  it('accepts shared metadata and localized translations', () => {
    expect(metadataSchema.safeParse(metadata).success).toBe(true);
    expect(translationSchema.safeParse(translation).success).toBe(true);
  });

  it('trims localized text', () => {
    const result = translationSchema.safeParse({
      title: '  기억은 어떻게 장소가 되는가  ',
      description: '  개인 아카이브와 기억에 관한 글  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(translation);
    }
  });

  it('retains strict date input behavior for shared metadata', () => {
    expect(metadataSchema.safeParse(metadata).success).toBe(true);
    expect(metadataSchema.safeParse({ ...metadata, publishedAt: '2026-07-01' }).success).toBe(true);
    expect(metadataSchema.safeParse({ ...metadata, publishedAt: null }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, publishedAt: true }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, publishedAt: 0 }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, updatedAt: null }).success).toBe(false);
  });

  it('rejects invalid shared metadata values', () => {
    expect(metadataSchema.safeParse({ ...metadata, originalLanguage: 'kr' }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, type: 'note', featured: true }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, publishedAt: new Date('2100-01-01T00:00:00Z') }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...metadata, canonicalUrl: 'not a URL' }).success).toBe(false);
  });

  it('requires bilingual cover alternative text exactly when a cover image is used', () => {
    expect(metadataSchema.safeParse({ ...metadata, coverImage: 'cover.jpg' }).success).toBe(false);
    expect(metadataSchema.safeParse({
      ...metadata,
      coverImage: 'cover.jpg',
      coverImageAlt: { ko: '노을이 비치는 바다', en: 'A sea at sunset' },
    }).success).toBe(true);
    expect(metadataSchema.safeParse({
      ...metadata,
      coverImageAlt: { ko: '사용되지 않는 설명', en: 'Unused alt text' },
    }).success).toBe(false);
  });
});
