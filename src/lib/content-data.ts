import {
  assertWritingArticleInvariants,
  compareCodePointStrings,
  originalTranslation,
  parseWritingTranslationId,
  sortWritingArticles,
  type WritingArticle,
  type WritingItem,
  type WritingLanguage,
  type WritingTranslation,
} from './writing';

const generatedDraftBodies: Record<WritingLanguage, string> = {
  ko: '한국어 본문을 작성하세요.',
  en: 'Write the English body here.',
};

export type WritingMetadataEntryData = Omit<WritingArticle, 'slug' | 'translations'>;
export type WritingTranslationEntryData = Omit<WritingTranslation, 'language'>;

export interface WritingMetadataDataEntry {
  id: string;
  data: WritingMetadataEntryData;
}

export interface WritingTranslationDataEntry {
  id: string;
  body?: string;
  data: WritingTranslationEntryData;
}

export interface WorkEntryData {
  order: number;
}

export interface WorkDataEntry {
  id: string;
  data: WorkEntryData;
}

export interface PreparedWritingPair<
  TMeta extends WritingMetadataDataEntry,
  TTranslation extends WritingTranslationDataEntry,
> {
  metaEntry: TMeta;
  entries: Record<WritingLanguage, TTranslation>;
  item: WritingArticle;
}

export interface PreparedWritingData<
  TMeta extends WritingMetadataDataEntry,
  TTranslation extends WritingTranslationDataEntry,
> {
  items: WritingArticle[];
  pairs: Array<PreparedWritingPair<TMeta, TTranslation>>;
}

export function toWritingItem(article: WritingArticle): WritingItem {
  const translation = originalTranslation(article);
  return {
    slug: article.slug,
    title: translation.title,
    description: translation.description,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    type: article.type,
    language: translation.language,
    draft: article.draft,
    featured: article.featured,
    canonicalUrl: article.canonicalUrl,
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt?.[translation.language],
  };
}

export function resolveIncludeDrafts(
  explicit: boolean | undefined,
  isDevelopment: boolean,
): boolean {
  return explicit ?? isDevelopment;
}

export function prepareWritingData<
  TMeta extends WritingMetadataDataEntry,
  TTranslation extends WritingTranslationDataEntry,
>(
  metaEntries: readonly TMeta[],
  translationEntries: readonly TTranslation[],
  includeDrafts: boolean,
): PreparedWritingData<TMeta, TTranslation> {
  const metaBySlug = new Map<string, TMeta>();
  for (const metaEntry of metaEntries) {
    if (metaBySlug.has(metaEntry.id)) throw new Error(`Duplicate writing slug: ${metaEntry.id}`);
    metaBySlug.set(metaEntry.id, metaEntry);
  }

  const translationsBySlug = new Map<string, Partial<Record<WritingLanguage, TTranslation>>>();
  for (const translationEntry of translationEntries) {
    const { slug, language } = parseWritingTranslationId(translationEntry.id);
    const translations = translationsBySlug.get(slug) ?? {};
    if (translations[language]) {
      throw new Error(`Writing "${slug}" has duplicate translation: ${language}.`);
    }
    translations[language] = translationEntry;
    translationsBySlug.set(slug, translations);
  }

  const slugs = [...new Set([...metaBySlug.keys(), ...translationsBySlug.keys()])]
    .sort(compareCodePointStrings);
  const pairs: Array<PreparedWritingPair<TMeta, TTranslation>> = [];

  for (const slug of slugs) {
    const metaEntry = metaBySlug.get(slug);
    if (!metaEntry) throw new Error(`Writing "${slug}" is missing meta.yaml.`);

    const translations = translationsBySlug.get(slug) ?? {};
    const ko = translations.ko;
    const en = translations.en;
    if (!ko) throw new Error(`Writing "${slug}" is missing translation: ko.`);
    if (!en) throw new Error(`Writing "${slug}" is missing translation: en.`);

    const entries = { ko, en };
    for (const [language, entry] of Object.entries(entries) as Array<[WritingLanguage, TTranslation]>) {
      if (!entry.body?.trim()) {
        throw new Error(`Writing "${slug}" translation "${language}" has an empty body.`);
      }
      if (!metaEntry.data.draft && (entry.data.title.startsWith('[Draft]')
        || entry.data.description.startsWith('[Draft]'))) {
        throw new Error(`Published writing "${slug}" cannot use [Draft] title or description markers.`);
      }
      if (!metaEntry.data.draft && entry.body.trim() === generatedDraftBodies[language]) {
        throw new Error(`Published writing "${slug}" cannot use the generated ${language} body placeholder.`);
      }
    }

    pairs.push({
      metaEntry,
      entries,
      item: {
        slug,
        ...metaEntry.data,
        translations: {
          ko: { language: 'ko', ...ko.data },
          en: { language: 'en', ...en.data },
        },
      },
    });
  }

  assertWritingArticleInvariants(pairs.map(({ item }) => item));
  const visibleItems = sortWritingArticles(
    pairs.map(({ item }) => item).filter((item) => includeDrafts || !item.draft),
  );
  const pairsByItem = new Map(pairs.map((pair) => [pair.item, pair]));

  return {
    items: visibleItems,
    pairs: visibleItems.map((item) => pairsByItem.get(item)!),
  };
}

export function sortWorkData<TEntry extends WorkDataEntry>(entries: readonly TEntry[]): TEntry[] {
  return [...entries].sort((left, right) => {
    const byOrder = left.data.order - right.data.order;
    return byOrder || compareCodePointStrings(left.id, right.id);
  });
}
