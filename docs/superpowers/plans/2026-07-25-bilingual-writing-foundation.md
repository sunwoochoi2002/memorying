# Bilingual Writing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-language post model with one validated bilingual article per slug, render both languages at one stable URL, and provide a safe repository-first writing command.

**Architecture:** Astro loads shared `meta.yaml` entries and localized `ko.mdx`/`en.mdx` entries as two collections, then `prepareWritingData()` joins them into `WritingArticle` objects plus renderable language-entry maps. The article route pre-renders both MDX bodies, shows the recorded original by default, and switches local panels without navigation or persistence. A Node script creates complete draft folders and publishing validation rejects missing pairs, placeholder titles, invalid covers, and inconsistent metadata.

**Tech Stack:** Astro 7 content collections, MDX, TypeScript 6, Zod through `astro/zod`, Vitest 4, Playwright 1.61, Node.js ESM.

## Global Constraints

- Every Essay and Note requires `meta.yaml`, `ko.mdx`, and `en.mdx` before the content collection is usable, including drafts.
- Public article URLs remain `/writing/[slug]/`; do not add language paths or language query parameters.
- Every load and reload displays `originalLanguage` first; do not persist visitor language selection.
- Canonical, Open Graph, structured metadata, archive copy, and featured selection use the original-language version.
- Cover images are optional and local; a cover requires Korean and English alternative text.
- Notion is a one-time manual copy source only; do not add an API, importer, or synchronization dependency.
- Do not create a Cloudflare Pages project, modify DNS, connect a domain, or set the final `SITE_URL`.
- Preserve static output, trailing slashes, Buttondown behavior, draft exclusion, and all unrelated MVP behavior.
- Follow strict TDD: observe each targeted test fail before implementation, then pass before committing.
- After every task, request spec-compliance review, then code-quality review, and fix findings before starting the next task.

---

## File Structure

### Create

- `scripts/new-writing.mjs` — validates CLI arguments and atomically scaffolds one bilingual draft directory.
- `tests/unit/new-writing.test.ts` — tests creation, input rejection, and overwrite protection in temporary roots.
- `src/content/writing/memorying-start/meta.yaml` — shared metadata for the Korean-original starter Essay.
- `src/content/writing/memorying-start/ko.mdx` — Korean title, description, and original body.
- `src/content/writing/memorying-start/en.mdx` — English title, description, and translation body.
- `src/content/writing/memorying-start/cover.svg` — local draft cover fixture used to verify detail-only responsive rendering and bilingual alt text.
- `src/content/writing/small-beginning/meta.yaml` — shared metadata for the English-original starter Note.
- `src/content/writing/small-beginning/ko.mdx` — Korean translation.
- `src/content/writing/small-beginning/en.mdx` — English title, description, and original body.

### Modify

- `src/lib/writing.ts` — adds bilingual domain types and helpers alongside a temporary single-language view used by the existing home/archive until the compact UI plan migrates them.
- `src/lib/content-schema.ts` — defines separate shared-metadata and localized-MDX schemas.
- `src/lib/content-data.ts` — combines metadata and translation entries into validated logical articles.
- `src/content.config.ts` — registers `writingMeta` YAML and `writing` MDX collections.
- `src/lib/content.ts` — loads both collections and returns articles or renderable article-entry pairs.
- `src/pages/writing/[...slug].astro` — creates one route per logical article and renders both language entries.
- `src/layouts/WritingLayout.astro` — renders original-first localized header/body panels, language controls, and optional cover.
- `src/components/ContentMetadata.astro` — formats shared type/date metadata without treating a translation as a separate post.
- `src/styles/global.css` — styles the compact language control, localized fragments, and detail-only cover.
- `package.json` — exposes `new:writing`.
- `docs/publishing.md` — documents repository-first creation, one-time Notion copying, translations, images, preview, and publication.
- `tests/unit/writing.test.ts` — adds bilingual article expectations while retaining the temporary flat-item compatibility tests.
- `tests/unit/content-schema.test.ts` — verifies shared/localized schemas and cover-alt rules.
- `tests/unit/content-data.test.ts` — verifies pairing, original selection, draft filtering, and actionable failures.
- `tests/unit/production-writing.test.ts` — keeps paired drafts out of production routes, archives, home, and sitemap.
- `tests/e2e/writing.spec.ts` — verifies original-first output, same-URL switching, reload reset, no-JS fallback, and both starter originals.
- `tests/e2e/accessibility.spec.ts` — retains the detail route in the axe matrix after the model migration.

### Delete

- `src/content/writing/memorying-start/index.mdx` — replaced by shared metadata and two localized files.
- `src/content/writing/small-beginning/index.mdx` — replaced by shared metadata and two localized files.

---

### Task 1: Define the bilingual domain and schemas

**Files:**

- Modify: `src/lib/writing.ts`
- Modify: `src/lib/content-schema.ts`
- Modify: `tests/unit/writing.test.ts`
- Modify: `tests/unit/content-schema.test.ts`

**Interfaces:**

- Produces: `WritingLanguage`, `WritingTranslation`, and `WritingArticle` alongside the existing `WritingItem` compatibility type.
- Produces: `parseWritingTranslationId(id): { slug: string; language: WritingLanguage }`.
- Produces: `getWritingMetaSourceId(entry): string`.
- Produces: `originalTranslation(article): WritingTranslation`.
- Produces: `filterWritingArticles()`, `sortWritingArticles()`, `selectFeaturedArticle()`, and `assertWritingArticleInvariants()` without renaming the legacy helpers during this task.
- Produces: `createWritingMetadataSchema(imageSchema)` and `createWritingTranslationSchema()`.
- Consumed later by: Tasks 2–4 and the compact UI plan.

- [ ] **Step 1: Add bilingual domain expectations beside compatibility tests**

Use an article factory whose original translation is explicit:

```ts
const article = (overrides: Partial<WritingArticle> = {}): WritingArticle => ({
  slug: 'base',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay',
  originalLanguage: 'ko',
  draft: false,
  featured: false,
  translations: {
    ko: { language: 'ko', title: '기본 제목', description: '기본 설명' },
    en: { language: 'en', title: 'Base title', description: 'Base description' },
  },
  ...overrides,
});
```

Add exact assertions:

```ts
expect(parseWritingTranslationId('memorying-start/ko')).toEqual({
  slug: 'memorying-start', language: 'ko',
});
expect(() => parseWritingTranslationId('memorying-start/jp')).toThrow(
  'Invalid writing translation ID: memorying-start/jp',
);
expect(getWritingMetaSourceId('memorying-start/meta.yaml')).toBe('memorying-start');
expect(originalTranslation(article()).title).toBe('기본 제목');
expect(filterWritingArticles([article(), article({ slug: 'note', type: 'note' })], 'note'))
  .toHaveLength(1);
```

Keep the existing single-language tests unchanged for temporary compatibility. Add parallel article tests for sorting, immutable input, slug policy, draft-featured, featured-Note, and single-published-featured behavior using the new article helper names.

- [ ] **Step 2: Split schema tests into shared and localized metadata**

Define these valid fixtures in `tests/unit/content-schema.test.ts`:

```ts
const metadataSchema = createWritingMetadataSchema(z.string());
const translationSchema = createWritingTranslationSchema();
const metadata = {
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  originalLanguage: 'ko' as const,
  draft: false,
};
const translation = {
  title: '기억은 어떻게 장소가 되는가',
  description: '개인 아카이브와 기억에 관한 글',
};
```

Assert that localized text is trimmed; shared dates retain the current strict input behavior; `originalLanguage: 'kr'`, featured Notes, public future dates, and malformed URLs fail. For covers, assert all three outcomes:

```ts
expect(metadataSchema.safeParse({ ...metadata, coverImage: 'cover.jpg' }).success).toBe(false);
expect(metadataSchema.safeParse({
  ...metadata,
  coverImage: 'cover.jpg',
  coverImageAlt: { ko: '노을이 비치는 바다', en: 'A sea at sunset' },
}).success).toBe(true);
expect(metadataSchema.safeParse({
  ...metadata,
  coverImageAlt: { ko: '사용되지 않는 설명', en: 'Unused alt text' },
}).success).toBe(false);
```

- [ ] **Step 3: Run the focused tests and confirm the old interfaces fail**

Run:

```bash
npm test -- tests/unit/writing.test.ts tests/unit/content-schema.test.ts
```

Expected: FAIL because `WritingArticle`, the article-specific helpers, `parseWritingTranslationId`, `getWritingMetaSourceId`, `originalTranslation`, `createWritingMetadataSchema`, and `createWritingTranslationSchema` do not exist.

- [ ] **Step 4: Implement the domain types and pure helpers**

Add these public shapes in `src/lib/writing.ts` without removing the existing `WritingItem`, `WritingFilters`, query helpers, or flat-item functions:

```ts
export type WritingType = 'essay' | 'note';
export type WritingLanguage = 'ko' | 'en';
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
```

Implement translation ID parsing with `/^(?<slug>[^/]+)\/(?<language>ko|en)$/`, metadata ID generation by removing `/meta.yaml` or `/meta.yml`, and original lookup through `article.translations[article.originalLanguage]`. Add article-specific sort, feature, type-filter, and invariant helpers that reuse the current code-point comparator and slug policy. The temporary flat-item exports remain intact so the application still compiles before collection cutover.

- [ ] **Step 5: Implement separate shared and localized schemas**

In `src/lib/content-schema.ts`, keep the strict text/date helpers and add the new schemas alongside temporary `createWritingSchema()` compatibility. Task 2 removes the old schema only after `src/content.config.ts` switches collections:

```ts
export function createWritingTranslationSchema() {
  return z.object({ title: nonemptyTextSchema, description: nonemptyTextSchema });
}

export function createWritingMetadataSchema<T extends z.ZodType>(imageSchema: T) {
  return writingMetadataCoreSchema
    .extend({
      coverImage: imageSchema.optional(),
      coverImageAlt: z.object({
        ko: nonemptyTextSchema,
        en: nonemptyTextSchema,
      }).optional(),
    })
    .superRefine((value, context) => {
      if (value.type === 'note' && value.featured) {
        context.addIssue({ code: 'custom', path: ['featured'], message: 'Only essays may be featured.' });
      }
      if (!value.draft && value.publishedAt.getTime() > Date.now()) {
        context.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Published writing cannot use a future date.' });
      }
      if (Boolean(value.coverImage) !== Boolean(value.coverImageAlt)) {
        context.addIssue({
          code: 'custom', path: ['coverImageAlt'],
          message: 'Cover images require Korean and English alternative text, and unused cover alt text is not allowed.',
        });
      }
    });
}
```

Shared metadata fields are `publishedAt`, optional `updatedAt`, `type`, `originalLanguage`, `draft`, defaulted `featured`, and optional `canonicalUrl`.

- [ ] **Step 6: Run the focused tests and type check**

Run:

```bash
npm test -- tests/unit/writing.test.ts tests/unit/content-schema.test.ts
npm run check
```

Expected: the two unit files PASS and Astro reports zero diagnostics. If downstream imports fail, restore the temporary legacy exports rather than weakening the new article interfaces.

- [ ] **Step 7: Commit the reviewed domain boundary**

```bash
git add src/lib/writing.ts src/lib/content-schema.ts tests/unit/writing.test.ts tests/unit/content-schema.test.ts
git commit -m "refactor: define bilingual writing domain"
```

---

### Task 2: Join collections and migrate starter content

**Files:**

- Modify: `src/content.config.ts`
- Modify: `src/lib/content-data.ts`
- Modify: `src/lib/content.ts`
- Modify: `tests/unit/content-data.test.ts`
- Modify: `tests/unit/production-writing.test.ts`
- Create/Delete: the eight starter-content paths listed in File Structure.

**Interfaces:**

- Consumes: Task 1's `WritingArticle`, schemas, ID parsers, sorting, and invariants.
- Produces: `WritingMetaEntry`, `WritingEntry`, `LoadedWritingArticle`.
- Produces: `prepareWritingData(metaEntries, translationEntries, includeDrafts)` returning `{ items, pairs }`.
- Produces: `loadWritingArticles()` and `loadWritingArticleEntries()` operating once per logical article, plus temporary original-language `loadWriting()` and `loadWritingEntries()` views for existing UI and route consumers.

- [ ] **Step 1: Write grouping tests before changing loaders**

Use lightweight metadata and translation entry factories in `tests/unit/content-data.test.ts`. Assert a complete pair becomes one item and selects the correct original:

```ts
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
```

Add exact failure assertions for a missing English entry, duplicate Korean entry, orphan translation, invalid translation ID, whitespace-only body, missing metadata, and published `[Draft]` title. Preserve tests for draft exclusion, newest-first sorting, immutable inputs, duplicate slugs, and work sorting.

- [ ] **Step 2: Run the grouping test and verify signature failure**

Run:

```bash
npm test -- tests/unit/content-data.test.ts
```

Expected: FAIL because `prepareWritingData` still accepts one flat entry array and returns one item per translation file.

- [ ] **Step 3: Register metadata and translation collections**

Configure `src/content.config.ts` with these responsibilities:

```ts
const writing = defineCollection({
  loader: glob({
    pattern: '**/*.(md|mdx)',
    base: './src/content/writing',
    generateId: ({ entry }) => getWritingSourceId(entry),
  }),
  schema: createWritingTranslationSchema(),
});

const writingMeta = defineCollection({
  loader: glob({
    pattern: '**/meta.(yaml|yml)',
    base: './src/content/writing',
    generateId: ({ entry }) => getWritingMetaSourceId(entry),
  }),
  schema: ({ image }) => createWritingMetadataSchema(image()),
});

export const collections = { writing, writingMeta, work };
```

- [ ] **Step 4: Implement deterministic pairing and actionable failures**

In `src/lib/content-data.ts`, define generic input interfaces for metadata and translation entries and return:

```ts
export interface PreparedWritingPair<TMeta, TTranslation> {
  metaEntry: TMeta;
  entries: Record<WritingLanguage, TTranslation>;
  item: WritingArticle;
}

export interface PreparedWritingData<TMeta, TTranslation> {
  items: WritingArticle[];
  pairs: Array<PreparedWritingPair<TMeta, TTranslation>>;
}
```

Build maps keyed by slug, reject duplicate language entries, compare the union of metadata and translation slugs, require both `ko` and `en`, trim-check each entry body, and construct `translations` from localized data. Before returning, call `assertWritingArticleInvariants()` on every article, then filter drafts and use `sortWritingArticles()`. Use messages of the form `Writing "memorying-start" is missing translation: en.` and `Writing "orphan" is missing meta.yaml.`

Reject a public translation whose title or description starts with `[Draft]`; drafts may retain those scaffold markers.

- [ ] **Step 5: Update the public content loader types**

In `src/lib/content.ts`, load collections in parallel and pass both into the pairing function:

```ts
export type WritingEntry = CollectionEntry<'writing'>;
export type WritingMetaEntry = CollectionEntry<'writingMeta'>;
export type LoadedWritingArticle = PreparedWritingPair<WritingMetaEntry, WritingEntry>;

const loadPreparedWriting = async (includeDrafts: boolean) => prepareWritingData(
  await getCollection('writingMeta'),
  await getCollection('writing'),
  includeDrafts,
);
```

`loadWritingArticles()` returns `WritingArticle[]`; `loadWritingArticleEntries()` returns `LoadedWritingArticle[]`. Preserve `resolveIncludeDrafts()` behavior. Until Task 3 migrates the detail route, keep `loadWritingEntries()` mapping each pair to its original MDX entry plus one compatibility item. Until the compact UI plan migrates home and archive, keep `loadWriting()` returning one compatibility `WritingItem` per article by copying shared fields plus the original translation's `title`, `description`, and `language`. Neither view may duplicate an article.

- [ ] **Step 6: Migrate the two starters without changing their slugs**

Create `memorying-start/meta.yaml`:

```yaml
publishedAt: 2026-07-24
type: essay
originalLanguage: ko
draft: true
featured: false
coverImage: ./cover.svg
coverImageAlt:
  ko: 저녁빛 아래 겹쳐진 기억의 풍경
  en: Layered memory landscapes in evening light
```

Create Korean and English localized MDX with these frontmatter values:

```yaml
# ko.mdx
title: Memorying을 시작하며
description: 시간이 지나도 잊고 싶지 않은 것들을 기록하기 위한 첫 글입니다.
```

```yaml
# en.mdx
title: Beginning Memorying
description: The first essay in an archive for the things I do not want to forget.
```

Keep the current Korean body verbatim. Use this exact English body:

```md
I write down the things I do not want to forget over time.

Hello, I’m Sunwoo Choi. Welcome to this space.
I write about the happiness and value I discover in everyday life, and about dreams.
```

Add this text-free 1200 × 630 local SVG as the draft cover fixture; it uses the approved warm neutral palette and is not a permanent personal photograph:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img">
  <rect width="1200" height="630" fill="#f1ede4"/>
  <path d="M0 430C230 340 390 510 620 410S990 260 1200 350V630H0Z" fill="#8e6140" opacity=".72"/>
  <path d="M0 500C250 420 460 570 690 475s340-80 510-30v185H0Z" fill="#30342f" opacity=".86"/>
  <circle cx="890" cy="190" r="76" fill="#d8b78e"/>
</svg>
```

Create `small-beginning/meta.yaml` with `publishedAt: 2026-07-23`, `type: note`, `originalLanguage: en`, `draft: true`, and `featured: false`. Preserve the English title, description, and body. Add Korean title `작은 시작`, description `개인 아카이브의 시작을 기록하는 짧은 노트입니다.`, and this exact body:

```md
기억할 가치가 있는 것들을 위한 아카이브의 작은 시작입니다.
```

Give this Note no cover so both conditional branches are exercised. Delete both old `index.mdx` files.

- [ ] **Step 7: Update production draft assertions for paired sources**

Keep the production expectations at the logical article level: two draft titles absent, two routes absent, and two sitemap paths absent. Add source assertions that `small-beginning` contains exactly `en.mdx`, `ko.mdx`, and `meta.yaml`, while `memorying-start` contains those three files plus `cover.svg`, before the production build begins.

- [ ] **Step 8: Run content, production, and type checks**

Run:

```bash
npm test -- tests/unit/content-data.test.ts tests/unit/production-writing.test.ts
npm run check
```

Expected: all targeted tests PASS and Astro reports zero diagnostics after downstream type imports are adjusted to `WritingArticle` where compilation requires it.

- [ ] **Step 9: Commit the paired content pipeline**

```bash
git add src/content.config.ts src/lib/content-data.ts src/lib/content.ts src/content/writing tests/unit/content-data.test.ts tests/unit/production-writing.test.ts
git commit -m "feat: pair bilingual writing content"
```

---

### Task 3: Render same-URL original-first language switching

**Files:**

- Modify: `src/pages/writing/[...slug].astro`
- Modify: `src/layouts/WritingLayout.astro`
- Modify: `src/components/ContentMetadata.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/writing.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

**Interfaces:**

- Consumes: Task 2's `loadWritingArticleEntries()` and `LoadedWritingArticle` with `entries.ko`, `entries.en`, and `item`.
- Produces DOM hooks: `[data-language-toggle]`, `[data-language-button]`, `[data-language-fragment]`, `[data-language-panel]`, and `[data-writing-cover]`.
- Produces client behavior that changes visible language and `<html lang>` without changing URL, history, or head metadata.

- [ ] **Step 1: Replace the old article smoke test with complete bilingual behavior**

In `tests/e2e/writing.spec.ts`, assert for `/writing/memorying-start/`:

```ts
await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
await expect(page.getByRole('button', { name: /한국어.*Original/ })).toHaveAttribute('aria-pressed', 'true');
await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
await expect(page.locator('[data-language-panel="ko"]')).toBeVisible();
await expect(page.locator('[data-language-panel="en"]')).toBeHidden();

const initialUrl = page.url();
await page.getByRole('button', { name: 'English' }).click();
await expect(page.getByRole('heading', { level: 1, name: 'Beginning Memorying' })).toBeVisible();
await expect(page.locator('[data-language-panel="en"]')).toBeVisible();
await expect(page.locator('html')).toHaveAttribute('lang', 'en');
expect(page.url()).toBe(initialUrl);

await page.reload();
await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
```

Add the mirror assertion that `/writing/small-beginning/` begins in English and labels English as Original. In a JavaScript-disabled context, require the Korean-original heading/body to remain visible and the English translation hidden. Keep canonical and `og:type=article` assertions.

For the Korean-original Essay, assert one `[data-writing-cover] img` exists with Korean alt text initially and English alt text after toggling. For the English-original Note, assert `[data-writing-cover]` has count zero.

- [ ] **Step 2: Run the article E2E test and verify missing controls**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
```

Expected: FAIL because the route renders one `entry`, no language buttons exist, and the translated heading/body are absent.

- [ ] **Step 3: Render both MDX entries from one static path**

Change `getStaticPaths()` to call `loadWritingArticleEntries()` and pass the complete loaded pair. Render both entries:

```astro
const { item, entries } = Astro.props;
const { Content: KoreanContent } = await render(entries.ko);
const { Content: EnglishContent } = await render(entries.en);
---
<WritingLayout item={item}>
  <div slot="ko"><KoreanContent /></div>
  <div slot="en"><EnglishContent /></div>
</WritingLayout>
```

Each logical article produces exactly one path using `item.slug`.

After the route compiles against `loadWritingArticleEntries()`, remove the temporary route-only `loadWritingEntries()` adapter. Keep the home/archive `loadWriting()` adapter until the compact UI plan finishes.

- [ ] **Step 4: Implement original-first localized fragments and toggle semantics**

`WritingLayout.astro` must derive `original`, `ko`, and `en` from the article. Render duplicated localized title and description fragments with `hidden={language !== originalLanguage}`, plus two body panels with the same rule and correct `lang`.

Render buttons in a labelled group:

```astro
<div class="language-toggle" role="group" aria-label="Language" data-language-toggle>
  <button type="button" data-language-button="ko" aria-pressed={originalLanguage === 'ko'}>
    한국어 {originalLanguage === 'ko' && <small>Original</small>}
  </button>
  <span aria-hidden="true">/</span>
  <button type="button" data-language-button="en" aria-pressed={originalLanguage === 'en'}>
    English {originalLanguage === 'en' && <small>Original</small>}
  </button>
</div>
```

The inline script handles only click events within `[data-language-toggle]`: toggle `hidden` on matching fragments and panels, update `aria-pressed`, set `document.documentElement.lang`, and update the cover `alt` from `data-alt-ko`/`data-alt-en`. Do not read or write storage, history, cookies, or query parameters.

Pass original title, description, language, and canonical URL to `BaseLayout`; do not mutate head metadata after switching.

- [ ] **Step 5: Render a detail-only responsive cover**

When `item.coverImage` exists, render one Astro `<Image>` after the header with the original localized alt, responsive widths `[640, 960, 1280]`, and the two localized alt values in data attributes. Omit the entire cover wrapper otherwise. Do not add image markup to cards, archive rows, or home.

- [ ] **Step 6: Make shared metadata language-neutral**

Change `ContentMetadata.astro` to accept `WritingArticle`, format the date using the original language locale, and display only type/date/update. Language is communicated by the adjacent control, not duplicated as archive metadata.

- [ ] **Step 7: Run article, accessibility, and type checks**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts tests/e2e/accessibility.spec.ts
npm run check
```

Expected: both E2E files PASS, axe reports no serious or critical violations, and Astro reports zero diagnostics.

- [ ] **Step 8: Commit the complete bilingual detail experience**

```bash
git add src/pages/writing/[...slug].astro src/layouts/WritingLayout.astro src/components/ContentMetadata.astro src/styles/global.css tests/e2e/writing.spec.ts tests/e2e/accessibility.spec.ts
git commit -m "feat: add original-first article translations"
```

---

### Task 4: Add the repository-first writing command and guide

**Files:**

- Create: `scripts/new-writing.mjs`
- Create: `tests/unit/new-writing.test.ts`
- Modify: `package.json`
- Modify: `docs/publishing.md`

**Interfaces:**

- Produces: `isValidWritingSlug(slug): boolean`.
- Produces: `createWritingDraft({ root, slug, originalLanguage, publishedAt }): Promise<string>` returning the created directory.
- Produces CLI: `npm run new:writing -- <slug> --original <ko|en>`.

- [ ] **Step 1: Write filesystem-isolated generator tests**

Use `mkdtemp()` under `tmpdir()` and remove only that exact temporary directory in `afterEach`. Test fixed input:

```ts
const created = await createWritingDraft({
  root,
  slug: 'remembering-summer',
  originalLanguage: 'ko',
  publishedAt: '2026-07-25',
});

expect(basename(created)).toBe('remembering-summer');
expect(await readdir(created)).toEqual(['en.mdx', 'ko.mdx', 'meta.yaml']);
expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('originalLanguage: ko');
expect(await readFile(join(created, 'meta.yaml'), 'utf8')).toContain('draft: true');
expect(await readFile(join(created, 'ko.mdx'), 'utf8')).toContain('[Draft] 한국어 제목');
expect(await readFile(join(created, 'en.mdx'), 'utf8')).toContain('[Draft] English title');
```

Assert rejection of `Uppercase`, `two words`, `../escape`, invalid original `jp`, and an existing target. After every rejection, assert no new target files were written and the existing sentinel file remains unchanged.

- [ ] **Step 2: Run the generator test and verify the missing module failure**

Run:

```bash
npm test -- tests/unit/new-writing.test.ts
```

Expected: FAIL because `scripts/new-writing.mjs` does not exist.

- [ ] **Step 3: Implement the generator and CLI parser**

Use only Node built-ins. Validate slugs with `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, validate ISO dates with `/^\d{4}-\d{2}-\d{2}$/`, and check target existence before `mkdir`. Generate exactly:

```yaml
publishedAt: 2026-07-25
type: essay
originalLanguage: ko
draft: true
featured: false
```

Korean MDX starts with `[Draft] 한국어 제목`, `[Draft] 한국어 설명`, and `한국어 본문을 작성하세요.`; English MDX starts with `[Draft] English title`, `[Draft] English description`, and `Write the English body here.` Write files with UTF-8 and a final newline.

The CLI requires exactly one slug and `--original` followed by `ko` or `en`, uses `new Date().toISOString().slice(0, 10)`, targets `src/content/writing`, prints the created relative path, and sets a nonzero exit code with a concise error on failure.

- [ ] **Step 4: Expose and manually smoke-test the command**

Add:

```json
"new:writing": "node scripts/new-writing.mjs"
```

Run an invalid command that performs no write:

```bash
npm run new:writing -- Invalid-Slug --original ko
```

Expected: nonzero exit and `Invalid writing slug: Invalid-Slug`.

- [ ] **Step 5: Rewrite the publishing guide around direct repository authoring**

Document the exact command, generated tree, shared/localized field ownership, one-time Notion copy cleanup, downloading Notion images locally, accepted JPEG/PNG/WebP examples, bilingual alt text, `npm run dev`, `npm run verify`, draft publication, permanent slugs, manual Buttondown delivery, and the still-separate Cloudflare/domain checklist.

- [ ] **Step 6: Run focused and full foundation verification**

Run:

```bash
npm test -- tests/unit/new-writing.test.ts tests/unit/writing.test.ts tests/unit/content-schema.test.ts tests/unit/content-data.test.ts tests/unit/production-writing.test.ts
npm run check
npm run check:assets
npm run build
npm run check:links
```

Expected: every command exits zero; Vitest reports zero failed tests; Astro reports zero diagnostics; production omits both paired drafts; asset and built-link checks pass.

- [ ] **Step 7: Commit the authoring workflow**

```bash
git add scripts/new-writing.mjs tests/unit/new-writing.test.ts package.json docs/publishing.md
git commit -m "feat: add bilingual writing scaffold"
```

---

## Foundation Plan Completion Gate

Before starting the compact UI plan:

1. Run the Task 4 full foundation verification again from the committed tree.
2. Confirm `git status --short` is empty.
3. Review the cumulative diff against Sections 4–9 of the approved design.
4. Confirm no Notion integration, language routes, language query state, storage persistence, Cloudflare project, DNS, or domain changes were introduced.
5. Start `docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md` only after the review findings are resolved.
