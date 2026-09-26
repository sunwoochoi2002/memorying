import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import {
  createAboutSchema,
  createExperienceSchema,
  createProjectSchema,
  createWritingMetadataSchema,
  createWritingTranslationSchema,
} from '../../src/lib/content-schema';

const about = {
  labels: { pageTitle: 'About', more: { ko: '자세히 보기', en: 'Details' }, less: { ko: '접기', en: 'Close' } },
  intro: { ko: ['안녕하세요, 최선우입니다.'], en: ['Hello, I’m Sunwoo Choi.'] },
  affiliations: Array.from({ length: 4 }, () => ({ title: 'Mathematics @ POSTECH', period: '2021.02–Present' })),
};
const project = {
  name: 'JARVIS', period: '2026.02', order: 2,
  description: { ko: '로컬 파일을 인덱싱합니다.', en: 'Indexes local files.' },
};
const experience = {
  id: 'education', heading: 'Education', order: 1,
  entries: [{ title: 'Mathematics @ POSTECH', period: '2021.02–Present', originalLanguage: 'ko', description: { ko: '수학을 공부합니다.', en: 'Mathematics student.' } }],
};

describe('public profile schemas', () => {
  it('requires a four-item About summary with complete intro translations and dated affiliations', () => {
    const schema = createAboutSchema();
    expect(schema.safeParse(about).success).toBe(true);
    expect(schema.safeParse({ ...about, intro: { ko: ['안녕하세요'] } }).success).toBe(false);
    expect(schema.safeParse({ ...about, affiliations: about.affiliations.slice(0, 3) }).success).toBe(false);
    expect(schema.safeParse({ ...about, affiliations: [{ ...about.affiliations[0], period: 'sometime' }, ...about.affiliations.slice(1)] }).success).toBe(false);
  });

  it('requires complete bilingual project and experience content', () => {
    const projectSchema = createProjectSchema();
    const experienceSchema = createExperienceSchema();
    expect(projectSchema.safeParse(project).success).toBe(true);
    expect(projectSchema.safeParse({ ...project, description: { ko: '설명' } }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, order: -1 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, url: 'not a URL' }).success).toBe(false);
    expect(experienceSchema.safeParse(experience).success).toBe(true);
    expect(experienceSchema.safeParse({ ...experience, entries: [{ ...experience.entries[0], description: { en: 'English only' } }] }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...experience, id: 'other' }).success).toBe(false);
  });

  it('accepts experience links to external sites or to a page on this site', () => {
    const schema = createExperienceSchema();
    const withLink = (href: string) => ({ ...experience, entries: [{ ...experience.entries[0], link: { href, label: { ko: '보기', en: 'View' } } }] });
    expect(schema.safeParse(withLink('https://example.com/')).success).toBe(true);
    expect(schema.safeParse(withLink('/projects/#bera')).success).toBe(true);
    expect(schema.safeParse(withLink('projects')).success).toBe(false);
    expect(schema.safeParse(withLink('//evil.example')).success).toBe(false);
  });

  it('requires each experience entry to declare the original language of its description', () => {
    const schema = createExperienceSchema();
    const withLanguage = (originalLanguage?: string) => ({ ...experience, entries: [{ ...experience.entries[0], originalLanguage }] });
    expect(schema.safeParse(withLanguage('ko')).success).toBe(true);
    expect(schema.safeParse(withLanguage('en')).success).toBe(true);
    expect(schema.safeParse(withLanguage(undefined)).success).toBe(false);
    expect(schema.safeParse(withLanguage('fr')).success).toBe(false);
  });
});

const metadataSchema = createWritingMetadataSchema(z.string());
const translationSchema = createWritingTranslationSchema();
const metadata = {
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  originalLanguage: 'ko' as const,
  draft: false,
};
const translation = { title: '기억은 어떻게 장소가 되는가' };

describe('bilingual writing schemas', () => {
  it('accepts shared metadata and localized translations', () => {
    expect(metadataSchema.safeParse(metadata).success).toBe(true);
    expect(translationSchema.safeParse(translation).success).toBe(true);
  });

  it('has no description: a translation is only a title, and a leftover description is rejected', () => {
    expect(translationSchema.safeParse({ title: '기억은 어떻게 장소가 되는가' }).success).toBe(true);
    expect(translationSchema.safeParse({ title: '기억은 어떻게 장소가 되는가', description: '설명' }).success).toBe(false);
  });

  it('trims localized text', () => {
    const result = translationSchema.safeParse({ title: '  기억은 어떻게 장소가 되는가  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(translation);
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
    expect(metadataSchema.safeParse({ ...metadata, coverImage: 'cover.jpg', coverImageAlt: { ko: '노을이 비치는 바다', en: 'A sea at sunset' } }).success).toBe(true);
    expect(metadataSchema.safeParse({ ...metadata, coverImageAlt: { ko: '사용되지 않는 설명', en: 'Unused alt text' } }).success).toBe(false);
  });
});
