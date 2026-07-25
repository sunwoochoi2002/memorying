import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import {
  createWorkSchema,
  createWritingMetadataSchema,
  createWritingSchema,
  createWritingTranslationSchema,
} from '../../src/lib/content-schema';

const schema = createWritingSchema(z.string());
const metadataSchema = createWritingMetadataSchema(z.string());
const translationSchema = createWritingTranslationSchema();
const workSchema = createWorkSchema(z.string());
const base = {
  title: '기억은 어떻게 장소가 되는가',
  description: '개인 아카이브와 기억에 관한 글',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  language: 'ko' as const,
  draft: false,
};
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

describe('writing schema', () => {
  it('accepts valid bilingual writing metadata', () => {
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, language: 'en', type: 'note' }).success).toBe(true);
  });

  it('rejects unsupported type and language values', () => {
    expect(schema.safeParse({ ...base, type: 'article' }).success).toBe(false);
    expect(schema.safeParse({ ...base, language: 'kr' }).success).toBe(false);
  });

  it('rejects featured notes', () => {
    const result = schema.safeParse({ ...base, type: 'note', featured: true });
    expect(result.success).toBe(false);
  });

  it('requires meaningful alternative text when a cover image exists', () => {
    expect(schema.safeParse({ ...base, coverImage: 'cover.jpg' }).success).toBe(false);
    expect(schema.safeParse({ ...base, coverImage: 'cover.jpg', coverImageAlt: '   ' }).success).toBe(false);
    expect(schema.safeParse({
      ...base,
      coverImage: 'cover.jpg',
      coverImageAlt: 'Sunlight falling across an open notebook',
    }).success).toBe(true);
  });

  it('rejects whitespace-only text and trims accepted text', () => {
    expect(schema.safeParse({ ...base, title: '   ' }).success).toBe(false);
    expect(schema.safeParse({ ...base, description: '   ' }).success).toBe(false);

    const result = schema.safeParse({
      ...base,
      title: '  기억은 어떻게 장소가 되는가  ',
      description: '  개인 아카이브와 기억에 관한 글  ',
      coverImage: 'cover.jpg',
      coverImageAlt: '  Sunlight falling across an open notebook  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('기억은 어떻게 장소가 되는가');
      expect(result.data.description).toBe('개인 아카이브와 기억에 관한 글');
      expect(result.data.coverImageAlt).toBe('Sunlight falling across an open notebook');
    }
  });

  it('accepts Date and string dates while rejecting other coercible primitives', () => {
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, publishedAt: '2026-07-01' }).success).toBe(true);
    expect(schema.safeParse({ ...base, publishedAt: null }).success).toBe(false);
    expect(schema.safeParse({ ...base, publishedAt: true }).success).toBe(false);
    expect(schema.safeParse({ ...base, publishedAt: 0 }).success).toBe(false);
  });

  it('applies the same strict date input rules to updatedAt', () => {
    expect(schema.safeParse({ ...base, updatedAt: '2026-07-02' }).success).toBe(true);
    expect(schema.safeParse({ ...base, updatedAt: null }).success).toBe(false);
    expect(schema.safeParse({ ...base, updatedAt: false }).success).toBe(false);
    expect(schema.safeParse({ ...base, updatedAt: 1 }).success).toBe(false);
  });

  it('rejects invalid canonical URLs', () => {
    expect(schema.safeParse({ ...base, canonicalUrl: 'not a URL' }).success).toBe(false);
  });

  it('rejects future-dated public writing but permits future drafts', () => {
    const future = new Date('2100-01-01T00:00:00Z');
    expect(schema.safeParse({ ...base, publishedAt: future }).success).toBe(false);
    expect(schema.safeParse({ ...base, publishedAt: future, draft: true }).success).toBe(true);
  });
});

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
