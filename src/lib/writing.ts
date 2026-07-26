import type { ImageMetadata } from 'astro';

export type WritingType = 'essay' | 'note';
export type WritingLanguage = 'ko' | 'en';
export type WritingTypeFilter = WritingType | 'all';

export interface WritingFilters {
  type: WritingTypeFilter;
}

export interface WritingTranslation {
  language: WritingLanguage;
  title: string;
  description: string;
}

export interface WritingArticle {
  slug: string;
  publishedAt: Date;
  updatedAt?: Date;
  type: WritingType;
  originalLanguage: WritingLanguage;
  draft: boolean;
  featured: boolean;
  canonicalUrl?: string;
  coverImage?: ImageMetadata;
  coverImageAlt?: Record<WritingLanguage, string>;
  translations: Record<WritingLanguage, WritingTranslation>;
}

export function getWritingSourceId(entry: string): string {
  return entry.replace(/\.(md|mdx)$/, '');
}

export function parseWritingTranslationId(id: string): { slug: string; language: WritingLanguage } {
  const match = /^(?<slug>[^/]+)\/(?<language>ko|en)$/.exec(id);
  if (!match?.groups) throw new Error(`Invalid writing translation ID: ${id}`);

  return {
    slug: match.groups.slug,
    language: match.groups.language as WritingLanguage,
  };
}

export function getWritingMetaSourceId(entry: string): string {
  return entry.replace(/\/meta\.ya?ml$/, '');
}

export function originalTranslation(article: WritingArticle): WritingTranslation {
  return article.translations[article.originalLanguage];
}

export function normalizeWritingSlug(id: string): string {
  return id.replace(/\/index$/, '');
}

export function compareCodePointStrings(left: string, right: string): number {
  const leftCodePoints = Array.from(left, (character) => character.codePointAt(0)!);
  const rightCodePoints = Array.from(right, (character) => character.codePointAt(0)!);
  const length = Math.min(leftCodePoints.length, rightCodePoints.length);

  for (let index = 0; index < length; index += 1) {
    const difference = leftCodePoints[index] - rightCodePoints[index];
    if (difference !== 0) return difference;
  }

  return leftCodePoints.length - rightCodePoints.length;
}

export function compareWritingItems(
  left: Pick<WritingArticle, 'publishedAt' | 'slug'>,
  right: Pick<WritingArticle, 'publishedAt' | 'slug'>,
): number {
  const byDate = right.publishedAt.getTime() - left.publishedAt.getTime();
  return byDate || compareCodePointStrings(left.slug, right.slug);
}

export function sortWritingArticles(entries: WritingArticle[]): WritingArticle[] {
  return [...entries].sort(compareWritingItems);
}

export function selectFeaturedArticle(entries: WritingArticle[]): WritingArticle | undefined {
  const essays = sortWritingArticles(entries.filter((entry) => entry.type === 'essay'));
  return essays.find((entry) => entry.featured) ?? essays[0];
}

export function filterWriting(entries: WritingArticle[], filters: WritingFilters): WritingArticle[] {
  return filterWritingArticles(entries, filters.type);
}

export function filterWritingArticles(entries: WritingArticle[], type: WritingTypeFilter): WritingArticle[] {
  return entries.filter((entry) => type === 'all' || entry.type === type);
}

export function parseWritingFilters(search: string | URLSearchParams): WritingFilters {
  const parameters = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search;
  const type = parameters.get('type');
  return {
    type: type === 'essay' || type === 'note' ? type : 'all',
  };
}

export function buildWritingSearch(filters: WritingFilters): string {
  const parameters = new URLSearchParams();
  if (filters.type !== 'all') parameters.set('type', filters.type);
  const value = parameters.toString();
  return value ? `?${value}` : '';
}

export function assertWritingArticleInvariants(entries: WritingArticle[]): void {
  assertWritingSlugInvariants(entries);

  const featured = entries.filter(
    (entry) => !entry.draft && entry.type === 'essay' && entry.featured,
  );
  if (featured.length > 1) throw new Error('Only one published essay may be featured.');
}

function assertWritingSlugInvariants(entries: Array<Pick<WritingArticle, 'slug'>>): void {
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) {
      throw new Error(
        `Invalid writing slug: "${entry.slug}". Slugs must use lowercase ASCII letters and numbers separated by single hyphens.`,
      );
    }
    if (slugs.has(entry.slug)) throw new Error(`Duplicate writing slug: ${entry.slug}`);
    slugs.add(entry.slug);
  }
}
