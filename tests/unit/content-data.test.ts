import { describe, expect, it } from 'vitest';
import {
  prepareWritingData,
  resolveIncludeDrafts,
  sortWorkData,
  toWritingItem,
  type WritingMetadataEntryData,
  type WritingTranslationEntryData,
} from '../../src/lib/content-data';
import { originalTranslation } from '../../src/lib/writing';

const metadataEntry = (
  id: string,
  overrides: Partial<WritingMetadataEntryData> = {},
) => ({
  id,
  collection: 'writingMeta' as const,
  filePath: `src/content/writing/${id}/meta.yaml`,
  data: {
    publishedAt: new Date('2026-07-01T00:00:00Z'),
    type: 'essay' as const,
    originalLanguage: 'ko' as const,
    draft: false,
    featured: false,
    ...overrides,
  },
});

const translationEntry = (
  id: string,
  title = `Title for ${id}`,
  description = `Description for ${id}`,
  body = 'Writing body',
  overrides: Partial<WritingTranslationEntryData> = {},
) => ({
  id,
  collection: 'writing' as const,
  body,
  filePath: `src/content/writing/${id}.mdx`,
  data: { title, description, ...overrides },
});

const pair = (slug: string, overrides: Partial<WritingMetadataEntryData> = {}) => ({
  meta: metadataEntry(slug, overrides),
  translations: [
    translationEntry(`${slug}/ko`, `Korean ${slug}`, `Korean description for ${slug}`),
    translationEntry(`${slug}/en`, `English ${slug}`, `English description for ${slug}`),
  ],
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
  it('joins a complete pair into one article and selects its declared original translation', () => {
    const result = prepareWritingData(
      [metadataEntry('memorying-start', { originalLanguage: 'ko' })],
      [
        translationEntry('memorying-start/ko', '한국어 제목', '한국어 설명', '한국어 본문'),
        translationEntry('memorying-start/en', 'English title', 'English description', 'English body'),
      ],
      true,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].translations.ko.title).toBe('한국어 제목');
    expect(originalTranslation(result.items[0]).title).toBe('한국어 제목');
    expect(result.pairs[0].entries.ko.id).toBe('memorying-start/ko');
    expect(result.pairs[0].entries.en.id).toBe('memorying-start/en');
  });

  it('adapts an English-original article to the existing one-entry writing view', () => {
    const coverImage = {
      src: '/images/cover.svg',
      width: 1200,
      height: 630,
      format: 'svg' as const,
    };
    const result = prepareWritingData(
      [metadataEntry('english-original', {
        originalLanguage: 'en',
        coverImage,
        coverImageAlt: { ko: '한국어 대체 텍스트', en: 'English alternative text' },
      })],
      [
        translationEntry('english-original/ko', '한국어 제목', '한국어 설명'),
        translationEntry('english-original/en', 'English title', 'English description'),
      ],
      true,
    );

    const item = toWritingItem(result.items[0]);

    expect(result.pairs[0].entries[result.items[0].originalLanguage].id).toBe('english-original/en');
    expect(item).toMatchObject({
      slug: 'english-original',
      title: 'English title',
      description: 'English description',
      language: 'en',
      coverImageAlt: 'English alternative text',
    });
    expect(item.coverImage).toBe(coverImage);
  });

  it('rejects a missing English translation with the article slug and language', () => {
    expect(() => prepareWritingData(
      [metadataEntry('memorying-start')],
      [translationEntry('memorying-start/ko')],
      true,
    )).toThrow('Writing "memorying-start" is missing translation: en.');
  });

  it('rejects duplicate Korean translations for one article', () => {
    expect(() => prepareWritingData(
      [metadataEntry('memorying-start')],
      [
        translationEntry('memorying-start/ko'),
        translationEntry('memorying-start/ko', 'Another Korean title'),
        translationEntry('memorying-start/en'),
      ],
      true,
    )).toThrow('Writing "memorying-start" has duplicate translation: ko.');
  });

  it('rejects orphan translations that do not have meta.yaml', () => {
    expect(() => prepareWritingData(
      [],
      [translationEntry('orphan/ko'), translationEntry('orphan/en')],
      true,
    )).toThrow('Writing "orphan" is missing meta.yaml.');
  });

  it('rejects invalid translation IDs before pairing', () => {
    expect(() => prepareWritingData(
      [metadataEntry('memorying-start')],
      [translationEntry('memorying-start/ko'), translationEntry('memorying-start/jp')],
      true,
    )).toThrow('Invalid writing translation ID: memorying-start/jp');
  });

  it('rejects translations with whitespace-only bodies', () => {
    expect(() => prepareWritingData(
      [metadataEntry('memorying-start')],
      [
        translationEntry('memorying-start/ko', undefined, undefined, '   \n\t '),
        translationEntry('memorying-start/en'),
      ],
      true,
    )).toThrow('Writing "memorying-start" translation "ko" has an empty body.');
  });

  it('rejects translations whose loader body is absent', () => {
    const korean = { ...translationEntry('memorying-start/ko'), body: undefined };

    expect(() => prepareWritingData(
      [metadataEntry('memorying-start')],
      [korean, translationEntry('memorying-start/en')],
      true,
    )).toThrow('Writing "memorying-start" translation "ko" has an empty body.');
  });

  it('rejects a complete localized pair when its metadata is missing', () => {
    expect(() => prepareWritingData(
      [],
      [translationEntry('missing-meta/ko'), translationEntry('missing-meta/en')],
      true,
    )).toThrow('Writing "missing-meta" is missing meta.yaml.');
  });

  it('rejects published localized draft markers while allowing them for drafts', () => {
    expect(() => prepareWritingData(
      [metadataEntry('published')],
      [
        translationEntry('published/ko', '[Draft] Korean title'),
        translationEntry('published/en'),
      ],
      true,
    )).toThrow('Published writing "published" cannot use [Draft] title or description markers.');

    expect(() => prepareWritingData(
      [metadataEntry('draft', { draft: true })],
      [
        translationEntry('draft/ko', '[Draft] Korean title'),
        translationEntry('draft/en'),
      ],
      true,
    )).not.toThrow();
  });

  it.each([
    { language: 'ko', placeholder: '한국어 본문을 작성하세요.' },
    { language: 'en', placeholder: 'Write the English body here.' },
  ] as const)('rejects a published generated $language body placeholder', ({ language, placeholder }) => {
    const bodies = {
      ko: 'Completed Korean body',
      en: 'Completed English body',
      [language]: placeholder,
    };

    expect(() => prepareWritingData(
      [metadataEntry('published')],
      [
        translationEntry('published/ko', 'Korean title', 'Korean description', bodies.ko),
        translationEntry('published/en', 'English title', 'English description', bodies.en),
      ],
      true,
    )).toThrow(`Published writing "published" cannot use the generated ${language} body placeholder.`);
  });

  it('excludes drafts and returns articles newest-first with stable tie ordering without mutating inputs', () => {
    const old = pair('old', { publishedAt: new Date('2026-07-01T00:00:00Z') });
    const tieZ = pair('z', { publishedAt: new Date('2026-07-03T00:00:00Z') });
    const draft = pair('draft', { publishedAt: new Date('2026-07-04T00:00:00Z'), draft: true });
    const tieA = pair('a', { publishedAt: new Date('2026-07-03T00:00:00Z') });
    const metadata = [old.meta, tieZ.meta, draft.meta, tieA.meta];
    const translations = [
      ...old.translations,
      ...tieZ.translations,
      ...draft.translations,
      ...tieA.translations,
    ];

    const result = prepareWritingData(metadata, translations, false);

    expect(result.items.map(({ slug }) => slug)).toEqual(['a', 'z', 'old']);
    expect(result.pairs.map(({ metaEntry }) => metaEntry.id)).toEqual(['a', 'z', 'old']);
    expect(result.pairs[0].metaEntry).toBe(tieA.meta);
    expect(result.pairs[0].item).toBe(result.items[0]);
    expect(metadata).toEqual([old.meta, tieZ.meta, draft.meta, tieA.meta]);
    expect(translations).toEqual([
      ...old.translations,
      ...tieZ.translations,
      ...draft.translations,
      ...tieA.translations,
    ]);
  });

  it('includes drafts when requested', () => {
    const published = pair('published', { publishedAt: new Date('2026-07-01T00:00:00Z') });
    const draft = pair('draft', { publishedAt: new Date('2026-07-02T00:00:00Z'), draft: true });

    expect(prepareWritingData(
      [published.meta, draft.meta],
      [...published.translations, ...draft.translations],
      true,
    ).items.map(({ slug }) => slug)).toEqual(['draft', 'published']);
  });

  it('rejects duplicate metadata slugs before filtering drafts', () => {
    const first = metadataEntry('same');
    const duplicate = metadataEntry('same', { draft: true });

    expect(() => prepareWritingData(
      [first, duplicate],
      [translationEntry('same/ko'), translationEntry('same/en')],
      false,
    )).toThrow('Duplicate writing slug: same');
  });

  it('resolves the development default while honoring explicit draft overrides', () => {
    expect(resolveIncludeDrafts(undefined, true)).toBe(true);
    expect(resolveIncludeDrafts(undefined, false)).toBe(false);
    expect(resolveIncludeDrafts(false, true)).toBe(false);
    expect(resolveIncludeDrafts(true, false)).toBe(true);
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
