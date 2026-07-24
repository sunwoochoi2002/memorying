import type { ImageMetadata } from 'astro';

export type WritingType = 'essay' | 'note';
export type WritingLanguage = 'ko' | 'en';
export type WritingTypeFilter = WritingType | 'all';
export type WritingLanguageFilter = WritingLanguage | 'all';

export interface WritingFilters {
  type: WritingTypeFilter;
  language: WritingLanguageFilter;
}

export interface WritingItem {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  type: WritingType;
  language: WritingLanguage;
  draft: boolean;
  featured: boolean;
  canonicalUrl?: string;
  coverImage?: ImageMetadata;
  coverImageAlt?: string;
}

export function normalizeWritingSlug(id: string): string {
  return id.replace(/\/index$/, '');
}

export function sortWriting<T extends Pick<WritingItem, 'publishedAt' | 'slug'>>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const byDate = right.publishedAt.getTime() - left.publishedAt.getTime();
    return byDate || left.slug.localeCompare(right.slug);
  });
}

export function selectFeatured(entries: WritingItem[]): WritingItem | undefined {
  return entries.find((entry) => entry.type === 'essay' && entry.featured)
    ?? entries.find((entry) => entry.type === 'essay');
}

export function filterWriting(entries: WritingItem[], filters: WritingFilters): WritingItem[] {
  return entries.filter((entry) => {
    const typeMatches = filters.type === 'all' || entry.type === filters.type;
    const languageMatches = filters.language === 'all' || entry.language === filters.language;
    return typeMatches && languageMatches;
  });
}

export function parseWritingFilters(search: string | URLSearchParams): WritingFilters {
  const parameters = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search;
  const type = parameters.get('type');
  const language = parameters.get('lang');

  return {
    type: type === 'essay' || type === 'note' ? type : 'all',
    language: language === 'ko' || language === 'en' ? language : 'all',
  };
}

export function buildWritingSearch(filters: WritingFilters): string {
  const parameters = new URLSearchParams();
  if (filters.type !== 'all') parameters.set('type', filters.type);
  if (filters.language !== 'all') parameters.set('lang', filters.language);
  const value = parameters.toString();
  return value ? `?${value}` : '';
}

export function assertWritingInvariants(entries: WritingItem[]): void {
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate writing slug: ${entry.slug}`);
    slugs.add(entry.slug);
  }

  const featured = entries.filter(
    (entry) => !entry.draft && entry.type === 'essay' && entry.featured,
  );
  if (featured.length > 1) throw new Error('Only one published essay may be featured.');
}
