import { describe, expect, it } from 'vitest';
import {
  buildWritingSearch,
  filterWriting,
  filterWritingArticles,
  getWritingMetaSourceId,
  getWritingSourceId,
  normalizeWritingSlug,
  originalTranslation,
  parseWritingTranslationId,
  parseWritingFilters,
  selectFeaturedArticle,
  sortWritingArticles,
  assertWritingArticleInvariants,
  type WritingArticle,
} from '../../src/lib/writing';

const article = (overrides: Partial<WritingArticle> = {}): WritingArticle => ({
  slug: 'base',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay',
  originalLanguage: 'ko',
  draft: false,
  featured: false,
  translations: {
    ko: { language: 'ko', title: '기본 제목', description: '기본 설명' },
    en: { language: 'en', title: 'Base title', description: 'Base description' },
  },
  ...overrides,
});

describe('writing article domain', () => {
  it('keeps flat and folder-index source IDs distinct until route normalization', () => {
    const sourceIds = [
      getWritingSourceId('same.mdx'),
      getWritingSourceId('same/index.md'),
    ];

    expect(sourceIds).toEqual(['same', 'same/index']);
    expect(sourceIds[0]).not.toBe(sourceIds[1]);

    const slugs = sourceIds.map(normalizeWritingSlug);
    expect(slugs).toEqual(['same', 'same']);
    expect(() => assertWritingArticleInvariants(slugs.map((slug) => article({ slug })))).toThrow(
      'Duplicate writing slug: same',
    );
  });

  it('normalizes folder index IDs into stable slugs', () => {
    expect(normalizeWritingSlug('memory-as-a-place/index')).toBe('memory-as-a-place');
    expect(normalizeWritingSlug('small-beginning')).toBe('small-beginning');
  });

  it('filters logical articles by type only', () => {
    const entries = [article({ slug: 'essay' }), article({ slug: 'note', type: 'note' })];
    expect(filterWriting(entries, { type: 'essay' }).map(({ slug }) => slug)).toEqual(['essay']);
    expect(filterWriting(entries, { type: 'all' })).toHaveLength(2);
    expect(filterWriting(entries, { type: 'note' }).map(({ slug }) => slug)).toEqual(['note']);
  });

  it('ignores legacy language queries and serializes type-only filters', () => {
    expect(parseWritingFilters('?type=essay&lang=en')).toEqual({ type: 'essay' });
    expect(parseWritingFilters('?type=article&lang=ko')).toEqual({ type: 'all' });
    expect(buildWritingSearch({ type: 'note' })).toBe('?type=note');
    expect(buildWritingSearch({ type: 'all' })).toBe('');
  });
});

describe('bilingual writing article domain', () => {
  it('parses translation and metadata source IDs and retrieves the original translation', () => {
    expect(parseWritingTranslationId('memorying-start/ko')).toEqual({
      slug: 'memorying-start', language: 'ko',
    });
    expect(() => parseWritingTranslationId('memorying-start/jp')).toThrow(
      'Invalid writing translation ID: memorying-start/jp',
    );
    expect(getWritingMetaSourceId('memorying-start/meta.yaml')).toBe('memorying-start');
    expect(originalTranslation(article()).title).toBe('기본 제목');
  });

  it('filters articles by type', () => {
    expect(filterWritingArticles([article(), article({ slug: 'note', type: 'note' })], 'note'))
      .toHaveLength(1);
  });

  it('sorts newest first and uses code-point slug order as a deterministic tie-breaker', () => {
    const entries = [
      article({ slug: 'z', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'a', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'B', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'new', publishedAt: new Date('2026-07-02') }),
    ];

    expect(sortWritingArticles(entries).map(({ slug }) => slug)).toEqual(['new', 'B', 'a', 'z']);
  });

  it('sorts without mutating the article input array', () => {
    const entries = [
      article({ slug: 'old', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'new', publishedAt: new Date('2026-07-02') }),
    ];

    sortWritingArticles(entries);

    expect(entries.map(({ slug }) => slug)).toEqual(['old', 'new']);
  });

  it('selects an explicit featured essay and ignores featured notes', () => {
    const entries = [
      article({ slug: 'new', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'note', type: 'note', featured: true, publishedAt: new Date('2026-07-02') }),
      article({ slug: 'old-featured', featured: true, publishedAt: new Date('2026-06-01') }),
    ];

    expect(selectFeaturedArticle(entries)?.slug).toBe('old-featured');
  });

  it('falls back to the newest essay and returns no featured article when only notes exist', () => {
    const entries = [
      article({ slug: 'z', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'note', type: 'note', publishedAt: new Date('2026-07-02') }),
      article({ slug: 'a', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'old', publishedAt: new Date('2026-06-01') }),
    ];

    expect(selectFeaturedArticle(entries)?.slug).toBe('a');
    expect(selectFeaturedArticle([article({ type: 'note' })])).toBeUndefined();
  });

  it('accepts stable lowercase ASCII alphanumeric slugs separated by single hyphens', () => {
    const validSlugs = ['a', 'memorying-start', 'essay-2', '2026'];

    expect(() => assertWritingArticleInvariants(validSlugs.map((slug) => article({ slug })))).not.toThrow();
  });

  it('rejects article slugs outside the stable lowercase ASCII hyphen policy', () => {
    expect(() => assertWritingArticleInvariants([article({ slug: 'Uppercase' })])).toThrow(
      'Invalid writing slug: "Uppercase". Slugs must use lowercase ASCII letters and numbers separated by single hyphens.',
    );
  });

  it('does not count draft featured articles toward the published featured invariant', () => {
    expect(() => assertWritingArticleInvariants([
      article({ slug: 'published', featured: true }),
      article({ slug: 'draft', draft: true, featured: true }),
    ])).not.toThrow();
  });

  it('rejects multiple published featured essays', () => {
    expect(() => assertWritingArticleInvariants([
      article({ slug: 'one', featured: true }),
      article({ slug: 'two', featured: true }),
    ])).toThrow('Only one published essay may be featured.');
  });
});
