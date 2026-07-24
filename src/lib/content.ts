import { getCollection, type CollectionEntry } from 'astro:content';
import {
  assertWritingInvariants,
  normalizeWritingSlug,
  sortWriting,
  type WritingItem,
} from './writing';

export type WritingEntry = CollectionEntry<'writing'>;
export type WorkEntry = CollectionEntry<'work'>;

export function toWritingItem(entry: WritingEntry): WritingItem {
  return {
    slug: normalizeWritingSlug(entry.id),
    title: entry.data.title,
    description: entry.data.description,
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    type: entry.data.type,
    language: entry.data.language,
    draft: entry.data.draft,
    featured: entry.data.featured,
    canonicalUrl: entry.data.canonicalUrl,
    coverImage: entry.data.coverImage,
    coverImageAlt: entry.data.coverImageAlt,
  };
}

export async function loadWriting(options: { includeDrafts?: boolean } = {}): Promise<WritingItem[]> {
  const includeDrafts = options.includeDrafts ?? import.meta.env.DEV;
  const entries = (await getCollection('writing')).map(toWritingItem);
  assertWritingInvariants(entries);
  return sortWriting(entries.filter((entry) => includeDrafts || !entry.draft));
}

export async function loadWritingEntries(
  options: { includeDrafts?: boolean } = {},
): Promise<Array<{ entry: WritingEntry; item: WritingItem }>> {
  const includeDrafts = options.includeDrafts ?? import.meta.env.DEV;
  const pairs = (await getCollection('writing')).map((entry) => ({ entry, item: toWritingItem(entry) }));
  assertWritingInvariants(pairs.map(({ item }) => item));
  const visible = pairs.filter(({ item }) => includeDrafts || !item.draft);
  const order = new Map(
    sortWriting(visible.map(({ item }) => item)).map((item, index) => [item.slug, index]),
  );
  return visible.sort(
    (left, right) => (order.get(left.item.slug) ?? 0) - (order.get(right.item.slug) ?? 0),
  );
}

export async function loadWork(): Promise<WorkEntry[]> {
  return (await getCollection('work')).sort((left, right) => left.data.order - right.data.order);
}
