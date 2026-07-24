import { describe, expect, it } from 'vitest';
import {
  assertWritingInvariants,
  buildWritingSearch,
  filterWriting,
  normalizeWritingSlug,
  parseWritingFilters,
  selectFeatured,
  sortWriting,
  type WritingItem,
} from '../../src/lib/writing';

const item = (overrides: Partial<WritingItem>): WritingItem => ({
  slug: 'base',
  title: 'Base',
  description: 'Base description',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay',
  language: 'ko',
  draft: false,
  featured: false,
  ...overrides,
});

describe('writing domain', () => {
  it('normalizes folder index IDs into stable slugs', () => {
    expect(normalizeWritingSlug('memory-as-a-place/index')).toBe('memory-as-a-place');
    expect(normalizeWritingSlug('small-beginning')).toBe('small-beginning');
  });

  it('sorts newest first and uses slug as a deterministic tie-breaker', () => {
    const entries = [
      item({ slug: 'z', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'a', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'new', publishedAt: new Date('2026-07-02') }),
    ];
    expect(sortWriting(entries).map(({ slug }) => slug)).toEqual(['new', 'a', 'z']);
  });

  it('selects an explicit featured essay, then falls back to the latest essay', () => {
    const entries = sortWriting([
      item({ slug: 'old-featured', featured: true, publishedAt: new Date('2026-06-01') }),
      item({ slug: 'new', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'note', type: 'note', publishedAt: new Date('2026-07-02') }),
    ]);
    expect(selectFeatured(entries)?.slug).toBe('old-featured');
    expect(selectFeatured(entries.map((entry) => ({ ...entry, featured: false })))?.slug).toBe('new');
  });

  it('returns no featured item when only notes exist', () => {
    expect(selectFeatured([item({ type: 'note' })])).toBeUndefined();
  });

  it('filters by type and language independently or together', () => {
    const entries = [
      item({ slug: 'ko-essay' }),
      item({ slug: 'en-essay', language: 'en' }),
      item({ slug: 'ko-note', type: 'note' }),
    ];
    expect(filterWriting(entries, { type: 'essay', language: 'all' })).toHaveLength(2);
    expect(filterWriting(entries, { type: 'all', language: 'ko' })).toHaveLength(2);
    expect(filterWriting(entries, { type: 'note', language: 'ko' }).map(({ slug }) => slug)).toEqual(['ko-note']);
  });

  it('parses supported queries, ignores unsupported values, and serializes non-all values', () => {
    expect(parseWritingFilters('?type=essay&lang=en')).toEqual({ type: 'essay', language: 'en' });
    expect(parseWritingFilters('?type=article&lang=jp')).toEqual({ type: 'all', language: 'all' });
    expect(buildWritingSearch({ type: 'note', language: 'all' })).toBe('?type=note');
    expect(buildWritingSearch({ type: 'all', language: 'all' })).toBe('');
  });

  it('rejects duplicate normalized slugs and multiple published featured essays', () => {
    expect(() => assertWritingInvariants([
      item({ slug: 'same' }),
      item({ slug: 'same' }),
    ])).toThrow('Duplicate writing slug: same');

    expect(() => assertWritingInvariants([
      item({ slug: 'one', featured: true }),
      item({ slug: 'two', featured: true }),
    ])).toThrow('Only one published essay may be featured.');
  });
});
