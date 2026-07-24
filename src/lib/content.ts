import { getCollection, type CollectionEntry } from 'astro:content';
import {
  prepareWritingData,
  resolveIncludeDrafts,
  sortWorkData,
} from './content-data';
import type { WritingItem } from './writing';

export { toWritingItem } from './content-data';

export type WritingEntry = CollectionEntry<'writing'>;
export type WorkEntry = CollectionEntry<'work'>;

export async function loadWriting(options: { includeDrafts?: boolean } = {}): Promise<WritingItem[]> {
  const includeDrafts = resolveIncludeDrafts(options.includeDrafts, import.meta.env.DEV);
  const prepared = prepareWritingData(await getCollection('writing'), includeDrafts);
  return prepared.items;
}

export async function loadWritingEntries(
  options: { includeDrafts?: boolean } = {},
): Promise<Array<{ entry: WritingEntry; item: WritingItem }>> {
  const includeDrafts = resolveIncludeDrafts(options.includeDrafts, import.meta.env.DEV);
  const prepared = prepareWritingData(await getCollection('writing'), includeDrafts);
  return prepared.pairs;
}

export async function loadWork(): Promise<WorkEntry[]> {
  return sortWorkData(await getCollection('work'));
}
