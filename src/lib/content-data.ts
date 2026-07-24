import {
  assertWritingInvariants,
  compareCodePointStrings,
  compareWritingItems,
  normalizeWritingSlug,
  type WritingItem,
} from './writing';

export type WritingEntryData = Omit<WritingItem, 'slug'>;

export interface WritingDataEntry {
  id: string;
  data: WritingEntryData;
}

export interface WorkEntryData {
  order: number;
}

export interface WorkDataEntry {
  id: string;
  data: WorkEntryData;
}

export interface PreparedWritingPair<TEntry extends WritingDataEntry> {
  entry: TEntry;
  item: WritingItem;
}

export interface PreparedWritingData<TEntry extends WritingDataEntry> {
  items: WritingItem[];
  pairs: Array<PreparedWritingPair<TEntry>>;
}

export function toWritingItem(entry: WritingDataEntry): WritingItem {
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

export function resolveIncludeDrafts(
  explicit: boolean | undefined,
  isDevelopment: boolean,
): boolean {
  return explicit ?? isDevelopment;
}

export function prepareWritingData<TEntry extends WritingDataEntry>(
  entries: readonly TEntry[],
  includeDrafts: boolean,
): PreparedWritingData<TEntry> {
  const pairs = entries.map((entry) => ({ entry, item: toWritingItem(entry) }));
  assertWritingInvariants(pairs.map(({ item }) => item));

  const visiblePairs = pairs.filter(({ item }) => includeDrafts || !item.draft);
  const sortedPairs = [...visiblePairs].sort((left, right) => (
    compareWritingItems(left.item, right.item)
  ));

  return {
    pairs: sortedPairs,
    items: sortedPairs.map(({ item }) => item),
  };
}

export function sortWorkData<TEntry extends WorkDataEntry>(entries: readonly TEntry[]): TEntry[] {
  return [...entries].sort((left, right) => {
    const byOrder = left.data.order - right.data.order;
    return byOrder || compareCodePointStrings(left.id, right.id);
  });
}
