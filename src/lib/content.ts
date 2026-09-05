import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import {
  prepareWritingData,
  resolveIncludeDrafts,
  sortWorkData,
  type PreparedWritingPair,
} from './content-data';
import type { WritingArticle } from './writing';
import {
  applyAutomaticWritingCovers,
  collectAutomaticWritingCovers,
} from './writing-covers';

export type WritingEntry = CollectionEntry<'writing'>;
export type WritingMetaEntry = CollectionEntry<'writingMeta'>;
export type WorkEntry = CollectionEntry<'work'>;
export type LoadedWritingArticle = PreparedWritingPair<WritingMetaEntry, WritingEntry>;

const coverModules = import.meta.glob<{ default: ImageMetadata }>(
  '../content/writing/*/cover.{avif,jpeg,jpg,png,svg,webp}',
  { eager: true },
);
const coverAltModules = import.meta.glob<string>(
  '../content/writing/*/cover.alt.{ko,en}.txt',
  { eager: true, import: 'default', query: '?raw' },
);

async function loadPreparedWriting(includeDrafts: boolean) {
  const [metaEntries, translationEntries] = await Promise.all([
    getCollection('writingMeta'),
    getCollection('writing'),
  ]);
  const prepared = prepareWritingData(metaEntries, translationEntries, includeDrafts);
  const items = applyAutomaticWritingCovers(
    prepared.items,
    collectAutomaticWritingCovers(coverModules, coverAltModules),
  );
  const itemBySlug = new Map(items.map((item) => [item.slug, item]));

  return {
    items,
    pairs: prepared.pairs.map((pair) => ({
      ...pair,
      item: itemBySlug.get(pair.item.slug)!,
    })),
  };
}

export async function loadWritingArticles(
  options: { includeDrafts?: boolean } = {},
): Promise<WritingArticle[]> {
  const includeDrafts = resolveIncludeDrafts(options.includeDrafts, import.meta.env.DEV);
  return (await loadPreparedWriting(includeDrafts)).items;
}

export async function loadWritingArticleEntries(
  options: { includeDrafts?: boolean } = {},
): Promise<LoadedWritingArticle[]> {
  const includeDrafts = resolveIncludeDrafts(options.includeDrafts, import.meta.env.DEV);
  return (await loadPreparedWriting(includeDrafts)).pairs;
}

export async function loadWork(): Promise<WorkEntry[]> {
  return sortWorkData(await getCollection('work'));
}
