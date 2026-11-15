import { describe, expect, it } from 'vitest';
import {
  filterWritingArticles,
  findWritingCategory,
  formatWritingDate,
  getWritingMetaSourceId,
  getWritingSourceId,
  normalizeWritingSlug,
  originalTranslation,
  parseWritingTranslationId,
  selectFeaturedArticle,
  sortWritingArticles,
  assertWritingArticleInvariants,
  type WritingArticle,
  type WritingCategory,
} from '../../src/lib/writing';

const article = (overrides: Partial<WritingArticle> = {}): WritingArticle => ({
  slug: 'base',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  category: 'essay',
  originalLanguage: 'ko',
  draft: false,
  featured: false,
  translations: {
    ko: { language: 'ko', title: '기본 제목' },
    en: { language: 'en', title: 'Base title' },
  },
  ...overrides,
});

describe('writing article domain', () => {
  it('formats visible writing dates as zero-padded UTC calendar dates', () => {
    expect(formatWritingDate(new Date('2026-07-24T00:30:00Z'))).toBe('2026-07-24');
    expect(formatWritingDate(new Date('2026-01-02T23:30:00-11:00'))).toBe('2026-01-03');
  });

  it('keeps flat and folder-index source IDs distinct until route normalization', () => {
    const sourceIds = [
      getWritingSourceId('same.md'),
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

  it('filters logical articles by category only', () => {
    const entries = [article({ slug: 'essay' }), article({ slug: 'note', category: 'note' })];
    expect(filterWritingArticles(entries, 'essay').map(({ slug }) => slug)).toEqual(['essay']);
    expect(filterWritingArticles(entries, 'note').map(({ slug }) => slug)).toEqual(['note']);
    expect(filterWritingArticles(entries, 'poem')).toEqual([]);
  });

  it('finds a category by slug and refuses one that is not registered', () => {
    const categories: WritingCategory[] = [
      { slug: 'essay', name: { ko: '에세이', en: 'Essay' }, newsletter: true },
      { slug: 'note', name: { ko: '노트', en: 'Note' }, newsletter: false },
    ];
    expect(findWritingCategory(categories, 'note')).toBe(categories[1]);
    expect(() => findWritingCategory(categories, 'poem')).toThrow(/poem/);
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

  it.each(['2026-11-13/quiet-note', 'drafts/2026-11-13/quiet-note', 'note/2026-11-13/quiet-note', 'drafts/note/2026-11-13/quiet-note'])('keeps nested %s IDs independent of storage parents', (directory) => {
    expect(getWritingSourceId(`${directory}/ko.md`)).toBe('quiet-note/ko');
    expect(getWritingSourceId(`${directory}/en.md`)).toBe('quiet-note/en');
    expect(getWritingMetaSourceId(`${directory}/meta.yaml`)).toBe('quiet-note');
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

  it('selects the explicitly featured article in any category', () => {
    const entries = [
      article({ slug: 'new', publishedAt: new Date('2026-07-03') }),
      article({ slug: 'old-featured', category: 'note', featured: true, publishedAt: new Date('2026-06-01') }),
    ];

    expect(selectFeaturedArticle(entries)?.slug).toBe('old-featured');
  });

  it('falls back to the newest article in any category, and to nothing when there is no writing', () => {
    const entries = [
      article({ slug: 'z', publishedAt: new Date('2026-07-01') }),
      article({ slug: 'note', category: 'note', publishedAt: new Date('2026-07-02') }),
      article({ slug: 'a', publishedAt: new Date('2026-07-01') }),
    ];

    expect(selectFeaturedArticle(entries)?.slug).toBe('note');
    expect(selectFeaturedArticle([])).toBeUndefined();
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

  it('rejects multiple published featured articles, whatever their categories', () => {
    expect(() => assertWritingArticleInvariants([
      article({ slug: 'one', featured: true }),
      article({ slug: 'two', category: 'note', featured: true }),
    ])).toThrow('Only one published article may be featured.');
  });
});
