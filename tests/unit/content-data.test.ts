import { describe, expect, it } from 'vitest';
import {
  prepareWritingData,
  resolveIncludeDrafts,
  sortWorkData,
  toWritingItem,
  type WritingEntryData,
} from '../../src/lib/content-data';

const writingEntry = (id: string, overrides: Partial<WritingEntryData> = {}) => ({
  id,
  collection: 'writing' as const,
  body: 'Writing body',
  filePath: `src/content/writing/${id}.mdx`,
  data: {
    title: `Title for ${id}`,
    description: `Description for ${id}`,
    publishedAt: new Date('2026-07-01T00:00:00Z'),
    type: 'essay' as const,
    language: 'ko' as const,
    draft: false,
    featured: false,
    ...overrides,
  },
});

const workEntry = (id: string, order: number) => ({
  id,
  collection: 'work' as const,
  filePath: `src/content/work/${id}.yaml`,
  data: {
    title: `Work ${id}`,
    period: '2026',
    role: 'Designer and Developer',
    description: `Description for ${id}`,
    status: 'Active',
    order,
  },
});

describe('content data preparation', () => {
  it('maps every writing field and normalizes only the route slug', () => {
    const coverImage = {
      src: '/images/cover.webp',
      width: 1200,
      height: 630,
      format: 'webp' as const,
    };
    const entry = writingEntry('complete/index', {
      title: 'Complete entry',
      description: 'Every supported field',
      publishedAt: new Date('2026-07-03T00:00:00Z'),
      updatedAt: new Date('2026-07-04T00:00:00Z'),
      type: 'note',
      language: 'en',
      draft: true,
      featured: false,
      canonicalUrl: 'https://example.com/complete',
      coverImage,
      coverImageAlt: 'A complete cover',
    });

    const result = toWritingItem(entry);

    expect(result).toEqual({
      slug: 'complete',
      title: 'Complete entry',
      description: 'Every supported field',
      publishedAt: new Date('2026-07-03T00:00:00Z'),
      updatedAt: new Date('2026-07-04T00:00:00Z'),
      type: 'note',
      language: 'en',
      draft: true,
      featured: false,
      canonicalUrl: 'https://example.com/complete',
      coverImage,
      coverImageAlt: 'A complete cover',
    });
    expect(result.coverImage).toBe(coverImage);
  });

  it('resolves the development default while honoring explicit draft overrides', () => {
    expect(resolveIncludeDrafts(undefined, true)).toBe(true);
    expect(resolveIncludeDrafts(undefined, false)).toBe(false);
    expect(resolveIncludeDrafts(false, true)).toBe(false);
    expect(resolveIncludeDrafts(true, false)).toBe(true);
  });

  it('excludes drafts and returns newest-first items and pairs with stable tie ordering', () => {
    const old = writingEntry('old', {
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    });
    const tieZ = writingEntry('z', {
      publishedAt: new Date('2026-07-03T00:00:00Z'),
    });
    const draft = writingEntry('draft', {
      publishedAt: new Date('2026-07-04T00:00:00Z'),
      draft: true,
    });
    const tieA = writingEntry('a', {
      publishedAt: new Date('2026-07-03T00:00:00Z'),
    });
    const input = [old, tieZ, draft, tieA];

    const result = prepareWritingData(input, false);

    expect(result.items.map(({ slug }) => slug)).toEqual(['a', 'z', 'old']);
    expect(result.pairs.map(({ entry }) => entry.id)).toEqual(['a', 'z', 'old']);
    expect(result.pairs[0].entry).toBe(tieA);
    expect(result.pairs[0].item).toBe(result.items[0]);
    expect(input).toEqual([old, tieZ, draft, tieA]);
  });

  it('includes drafts when requested', () => {
    const published = writingEntry('published', {
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    });
    const draft = writingEntry('draft', {
      publishedAt: new Date('2026-07-02T00:00:00Z'),
      draft: true,
    });

    expect(prepareWritingData([published, draft], true).items.map(({ slug }) => slug)).toEqual([
      'draft',
      'published',
    ]);
  });

  it('rejects duplicate normalized IDs before filtering drafts', () => {
    const published = writingEntry('same');
    const draftFolderIndex = writingEntry('same/index', { draft: true });

    expect(() => prepareWritingData([published, draftFolderIndex], false)).toThrow(
      'Duplicate writing slug: same',
    );
  });

  it('sorts work by numeric order and uses ID as a deterministic tie-breaker', () => {
    const laterB = workEntry('b', 2);
    const first = workEntry('first', 1);
    const laterA = workEntry('a', 2);
    const input = [laterB, first, laterA];

    const result = sortWorkData(input);

    expect(result.map(({ id }) => id)).toEqual(['first', 'a', 'b']);
    expect(result[0]).toBe(first);
    expect(input).toEqual([laterB, first, laterA]);
  });
});
