import { getCollection, type CollectionEntry } from 'astro:content';
import {
  prepareWritingData,
  resolveIncludeDrafts,
  sortWorkData,
  type PreparedWritingPair,
} from './content-data';
import type { WritingArticle } from './writing';

export type WritingEntry = CollectionEntry<'writing'>;
export type WritingMetaEntry = CollectionEntry<'writingMeta'>;
export type WorkEntry = CollectionEntry<'work'>;
export type LoadedWritingArticle = PreparedWritingPair<WritingMetaEntry, WritingEntry>;

async function loadPreparedWriting(includeDrafts: boolean) {
  const [metaEntries, translationEntries] = await Promise.all([
    getCollection('writingMeta'),
    getCollection('writing'),
  ]);
  return prepareWritingData(metaEntries, translationEntries, includeDrafts);
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
