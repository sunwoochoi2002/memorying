import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { createWorkSchema, createWritingSchema } from '../../src/lib/content-schema';

const schema = createWritingSchema(z.string());
const workSchema = createWorkSchema(z.string());
const base = {
  title: '기억은 어떻게 장소가 되는가',
  description: '개인 아카이브와 기억에 관한 글',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  language: 'ko' as const,
  draft: false,
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
    expect(schema.safeParse({
      ...base,
      coverImage: 'cover.jpg',
      coverImageAlt: 'Sunlight falling across an open notebook',
    }).success).toBe(true);
  });

  it('rejects future-dated public writing but permits future drafts', () => {
    const future = new Date('2100-01-01T00:00:00Z');
    expect(schema.safeParse({ ...base, publishedAt: future }).success).toBe(false);
    expect(schema.safeParse({ ...base, publishedAt: future, draft: true }).success).toBe(true);
  });
});

describe('work schema', () => {
  it('requires explicit display order and core project fields', () => {
    expect(workSchema.safeParse({
      title: 'Memorying',
      period: '2026',
      role: 'Designer and Developer',
      description: 'A personal writing and archival space.',
      order: 1,
    }).success).toBe(true);

    expect(workSchema.safeParse({ title: 'Memorying' }).success).toBe(false);
  });
});
