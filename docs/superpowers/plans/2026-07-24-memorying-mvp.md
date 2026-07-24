# Memorying MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a person-first bilingual Astro writing archive with selected Work, lightweight archive filters, and a Buttondown-backed newsletter signup, ready for Cloudflare Pages deployment.

**Architecture:** Astro statically renders every public page from validated MDX and YAML content. Pure TypeScript modules own content invariants, featured selection, sorting, and filtering; only archive filters and newsletter submit feedback use browser JavaScript. Cloudflare Pages serves the build, while Buttondown owns subscriber storage and email delivery.

**Tech Stack:** Astro, TypeScript, MDX, Zod, project CSS, Vitest, Playwright, axe-core, Cloudflare Pages, Buttondown

---

## File map

### Project configuration

- `package.json` — scripts and dependencies
- `astro.config.mjs` — static output, MDX, sitemap, canonical site URL
- `tsconfig.json` — Astro strict TypeScript settings
- `vitest.config.ts` — unit-test discovery
- `playwright.config.ts` — browser-test server and viewport defaults
- `src/env.d.ts` — Astro and public Buttondown environment typing
- `.gitignore` — build, test, environment, and visual-companion artifacts

### Content and domain logic

- `src/content.config.ts` — Astro writing and work collection registration
- `src/lib/content-schema.ts` — reusable Zod schemas and cross-field validation
- `src/lib/writing.ts` — slug normalization, sorting, featured selection, filter parsing
- `src/lib/content.ts` — Astro collection loading and mapping
- `src/content/writing/memorying-start/index.mdx` — Korean draft Essay fixture/starter
- `src/content/writing/small-beginning/index.mdx` — English draft Note fixture/starter
- `src/content/work/memorying.yaml` — initial selected Work entry

### Layout and UI

- `src/layouts/BaseLayout.astro` — document shell, canonical and social metadata
- `src/layouts/WritingLayout.astro` — individual writing-page shell
- `src/components/SiteHeader.astro` — global navigation
- `src/components/SiteFooter.astro` — global footer
- `src/components/PersonalIntroduction.astro` — approved single-column introduction
- `src/components/FeaturedWriting.astro` — homepage lead Essay
- `src/components/WritingCard.astro` — Essay/Note archive card
- `src/components/WritingFilters.astro` — filter controls and URL-state client logic
- `src/components/NewsletterSignup.astro` — direct Buttondown form
- `src/components/WorkList.astro` — ordered Work listing
- `src/styles/global.css` — tokens, typography, responsive layout, prose, focus states

### Routes and public assets

- `src/pages/index.astro` — homepage
- `src/pages/about.astro` — personal introduction
- `src/pages/writing/index.astro` — archive and primary subscription form
- `src/pages/writing/[...slug].astro` — generated Essay and Note pages
- `src/pages/work.astro` — selected Work
- `src/pages/privacy.astro` — newsletter data-handling notice
- `src/pages/404.astro` — designed not-found page
- `public/og-default.svg` — default Open Graph image
- `public/_headers` — baseline security and caching headers

### Verification and operations

- `tests/unit/content-schema.test.ts` — metadata validation
- `tests/unit/writing.test.ts` — sorting, slugs, featured selection, filters
- `tests/e2e/shell.spec.ts` — shared layout and navigation
- `tests/e2e/home-and-work.spec.ts` — person-first pages
- `tests/e2e/writing.spec.ts` — archive filters and articles
- `tests/e2e/newsletter.spec.ts` — form validation and provider request
- `tests/e2e/accessibility.spec.ts` — axe and keyboard smoke checks
- `tests/e2e/responsive.spec.ts` — representative viewport smoke checks
- `scripts/check-built-links.mjs` — generated internal-link verification
- `scripts/check-source-assets.mjs` — Cloudflare source-asset size verification
- `docs/publishing.md` — authoring, Buttondown, Cloudflare, and launch runbook
- `README.md` — project commands and documentation links

## Task 1: Scaffold Astro and the verification harness

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Initialize Astro without overwriting the non-empty repository**

Run from the repository root:

```bash
npm init --yes
npm pkg set type=module
npm install astro @astrojs/mdx @astrojs/sitemap
npm install --save-dev @astrojs/check typescript vitest @playwright/test @axe-core/playwright linkedom
npx playwright install chromium
```

Expected: dependencies install without replacing `.git`, `README.md`, `docs/`, or `image.png`.

- [ ] **Step 2: Add exact project scripts**

Run:

```bash
npm pkg set 'scripts.check=astro check'
npm pkg set 'scripts.dev=astro dev'
npm pkg set 'scripts.build=astro build'
npm pkg set 'scripts.preview=astro preview'
npm pkg set 'scripts.test=vitest run'
npm pkg set 'scripts.test:watch=vitest'
npm pkg set 'scripts.test:e2e=playwright test'
npm pkg set 'scripts.check:links=node scripts/check-built-links.mjs'
npm pkg set 'scripts.check:assets=node scripts/check-source-assets.mjs'
npm pkg set 'scripts.verify=npm run check && npm run test && npm run check:assets && npm run build && npm run check:links && npm run test:e2e'
```

Expected: `package.json` contains all ten project scripts, including `dev`, `build`, and `preview`.

- [ ] **Step 3: Configure static output, MDX, and sitemap**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/404'),
    }),
  ],
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Create `src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

Create the initial `src/pages/index.astro`:

```astro
---
const title = 'Memorying';
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body><main><h1>{title}</h1></main></body>
</html>
```

- [ ] **Step 4: Configure Vitest and Playwright**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: { reporter: ['text', 'html'] },
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    env: {
      PUBLIC_BUTTONDOWN_USERNAME: 'memorying-test',
    },
  },
});
```

- [ ] **Step 5: Preserve user files and ignore generated artifacts**

Create `.gitignore` with these exact entries:

```gitignore
.astro/
dist/
node_modules/
playwright-report/
test-results/
coverage/
.env
.env.*
!.env.example
.superpowers/
```

Do not add `image.png` to `.gitignore`, move it, or stage it.

- [ ] **Step 6: Verify the clean scaffold**

Run:

```bash
npm run check
npm run build
```

Expected: both commands exit 0; Astro generates `dist/index.html`.

- [ ] **Step 7: Commit the scaffold**

```bash
git add .gitignore package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts src
git commit -m "chore: scaffold Astro application"
```

## Task 2: Define and validate content collections

**Files:**
- Create: `src/lib/content-schema.ts`
- Create: `src/content.config.ts`
- Create: `src/content/writing/memorying-start/index.mdx`
- Create: `src/content/writing/small-beginning/index.mdx`
- Create: `src/content/work/memorying.yaml`
- Create: `tests/unit/content-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `tests/unit/content-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { createWorkSchema, createWritingSchema } from '../../src/lib/content-schema';

const schema = createWritingSchema(z.string());
const workSchema = createWorkSchema(z.string());
const base = {
  title: '기억은 어떻게 장소가 되는가',
  description: '개인 아카이브와 기억에 관한 글',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay' as const,
  language: 'ko' as const,
  draft: false,
};

describe('writing schema', () => {
  it('accepts valid bilingual writing metadata', () => {
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, language: 'en', type: 'note' }).success).toBe(true);
  });

  it('rejects unsupported type and language values', () => {
    expect(schema.safeParse({ ...base, type: 'article' }).success).toBe(false);
    expect(schema.safeParse({ ...base, language: 'kr' }).success).toBe(false);
  });

  it('rejects featured notes', () => {
    const result = schema.safeParse({ ...base, type: 'note', featured: true });
    expect(result.success).toBe(false);
  });

  it('requires meaningful alternative text when a cover image exists', () => {
    expect(schema.safeParse({ ...base, coverImage: 'cover.jpg' }).success).toBe(false);
    expect(schema.safeParse({
      ...base,
      coverImage: 'cover.jpg',
      coverImageAlt: 'Sunlight falling across an open notebook',
    }).success).toBe(true);
  });

  it('rejects future-dated public writing but permits future drafts', () => {
    const future = new Date('2100-01-01T00:00:00Z');
    expect(schema.safeParse({ ...base, publishedAt: future }).success).toBe(false);
    expect(schema.safeParse({ ...base, publishedAt: future, draft: true }).success).toBe(true);
  });
});

describe('work schema', () => {
  it('requires explicit display order and core project fields', () => {
    expect(workSchema.safeParse({
      title: 'Memorying',
      period: '2026',
      role: 'Designer and Developer',
      description: 'A personal writing and archival space.',
      order: 1,
    }).success).toBe(true);

    expect(workSchema.safeParse({ title: 'Memorying' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/content-schema.test.ts
```

Expected: FAIL because `src/lib/content-schema.ts` does not exist.

- [ ] **Step 3: Implement the reusable schemas**

Create `src/lib/content-schema.ts`:

```ts
import { z } from 'astro/zod';

const writingCoreSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  type: z.enum(['essay', 'note']),
  language: z.enum(['ko', 'en']),
  draft: z.boolean(),
  featured: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  coverImageAlt: z.string().min(1).optional(),
});

export function createWritingSchema<T extends z.ZodType>(imageSchema: T) {
  return writingCoreSchema
    .extend({ coverImage: imageSchema.optional() })
    .superRefine((value, context) => {
      if (value.type === 'note' && value.featured) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['featured'],
          message: 'Only essays may be featured.',
        });
      }

      if (!value.draft && value.publishedAt.getTime() > Date.now()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['publishedAt'],
          message: 'Published writing cannot use a future date.',
        });
      }

      if (value.coverImage && !value.coverImageAlt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['coverImageAlt'],
          message: 'Cover images require meaningful alternative text.',
        });
      }
    });
}

const workCoreSchema = z.object({
  title: z.string().min(1),
  period: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  status: z.string().min(1).optional(),
  url: z.string().url().optional(),
  order: z.number().int().nonnegative(),
});

export function createWorkSchema<T extends z.ZodType>(imageSchema: T) {
  return workCoreSchema.extend({ image: imageSchema.optional() });
}
```

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { createWorkSchema, createWritingSchema } from './lib/content-schema';

const writing = defineCollection({
  loader: glob({
    pattern: '**/*.(md|mdx)',
    base: './src/content/writing',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(/\/index$/, ''),
  }),
  schema: ({ image }) => createWritingSchema(image()),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.(yaml|yml)', base: './src/content/work' }),
  schema: ({ image }) => createWorkSchema(image()),
});

export const collections = { writing, work };
```

- [ ] **Step 4: Add safe draft content and one real Work entry**

Create `src/content/writing/memorying-start/index.mdx`:

```mdx
---
title: Memorying을 시작하며
description: 시간이 지나도 잊고 싶지 않은 것들을 기록하기 위한 첫 글입니다.
publishedAt: 2026-07-24
type: essay
language: ko
draft: true
featured: false
---

시간이 지나도 잊고 싶지 않은 것들을 기록합니다.

안녕하세요, 최선우입니다. 이 공간에 도착한 당신을 환영합니다.
일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.
```

Create `src/content/writing/small-beginning/index.mdx`:

```mdx
---
title: A small beginning
description: A short note marking the beginning of this personal archive.
publishedAt: 2026-07-23
type: note
language: en
draft: true
featured: false
---

This is a small beginning for an archive of things worth remembering.
```

Create `src/content/work/memorying.yaml`:

```yaml
title: Memorying
period: "2026"
role: Designer and Developer
description: A person-first personal writing and archival space.
status: Active
order: 1
```

Both writing entries remain drafts until Sunwoo explicitly approves them for publication.

- [ ] **Step 5: Run schema tests and Astro validation**

Run:

```bash
npm test -- tests/unit/content-schema.test.ts
npm run check
```

Expected: all schema tests PASS and Astro check exits 0.

- [ ] **Step 6: Commit the content model**

```bash
git add src/content.config.ts src/lib/content-schema.ts src/content tests/unit/content-schema.test.ts
git commit -m "feat: define validated content collections"
```

## Task 3: Implement writing-domain rules test-first

**Files:**
- Create: `src/lib/writing.ts`
- Create: `src/lib/content.ts`
- Create: `tests/unit/writing.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `tests/unit/writing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  assertWritingInvariants,
  buildWritingSearch,
  filterWriting,
  normalizeWritingSlug,
  parseWritingFilters,
  selectFeatured,
  sortWriting,
  type WritingItem,
} from '../../src/lib/writing';

const item = (overrides: Partial<WritingItem>): WritingItem => ({
  slug: 'base',
  title: 'Base',
  description: 'Base description',
  publishedAt: new Date('2026-07-01T00:00:00Z'),
  type: 'essay',
  language: 'ko',
  draft: false,
  featured: false,
  ...overrides,
});

describe('writing domain', () => {
  it('normalizes folder index IDs into stable slugs', () => {
    expect(normalizeWritingSlug('memory-as-a-place/index')).toBe('memory-as-a-place');
    expect(normalizeWritingSlug('small-beginning')).toBe('small-beginning');
  });

  it('sorts newest first and uses slug as a deterministic tie-breaker', () => {
    const entries = [
      item({ slug: 'z', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'a', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'new', publishedAt: new Date('2026-07-02') }),
    ];
    expect(sortWriting(entries).map(({ slug }) => slug)).toEqual(['new', 'a', 'z']);
  });

  it('selects an explicit featured essay, then falls back to the latest essay', () => {
    const entries = sortWriting([
      item({ slug: 'old-featured', featured: true, publishedAt: new Date('2026-06-01') }),
      item({ slug: 'new', publishedAt: new Date('2026-07-01') }),
      item({ slug: 'note', type: 'note', publishedAt: new Date('2026-07-02') }),
    ]);
    expect(selectFeatured(entries)?.slug).toBe('old-featured');
    expect(selectFeatured(entries.map((entry) => ({ ...entry, featured: false })))?.slug).toBe('new');
  });

  it('returns no featured item when only notes exist', () => {
    expect(selectFeatured([item({ type: 'note' })])).toBeUndefined();
  });

  it('filters by type and language independently or together', () => {
    const entries = [
      item({ slug: 'ko-essay' }),
      item({ slug: 'en-essay', language: 'en' }),
      item({ slug: 'ko-note', type: 'note' }),
    ];
    expect(filterWriting(entries, { type: 'essay', language: 'all' })).toHaveLength(2);
    expect(filterWriting(entries, { type: 'all', language: 'ko' })).toHaveLength(2);
    expect(filterWriting(entries, { type: 'note', language: 'ko' }).map(({ slug }) => slug)).toEqual(['ko-note']);
  });

  it('parses supported queries, ignores unsupported values, and serializes non-all values', () => {
    expect(parseWritingFilters('?type=essay&lang=en')).toEqual({ type: 'essay', language: 'en' });
    expect(parseWritingFilters('?type=article&lang=jp')).toEqual({ type: 'all', language: 'all' });
    expect(buildWritingSearch({ type: 'note', language: 'all' })).toBe('?type=note');
    expect(buildWritingSearch({ type: 'all', language: 'all' })).toBe('');
  });

  it('rejects duplicate normalized slugs and multiple published featured essays', () => {
    expect(() => assertWritingInvariants([
      item({ slug: 'same' }),
      item({ slug: 'same' }),
    ])).toThrow('Duplicate writing slug: same');

    expect(() => assertWritingInvariants([
      item({ slug: 'one', featured: true }),
      item({ slug: 'two', featured: true }),
    ])).toThrow('Only one published essay may be featured.');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- tests/unit/writing.test.ts
```

Expected: FAIL because `src/lib/writing.ts` does not exist.

- [ ] **Step 3: Implement pure writing rules**

Create `src/lib/writing.ts`:

```ts
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
```

- [ ] **Step 4: Implement Astro collection loaders**

Create `src/lib/content.ts`:

```ts
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
```

- [ ] **Step 5: Run focused and full unit tests**

Run:

```bash
npm test -- tests/unit/writing.test.ts
npm test
```

Expected: all unit tests PASS.

- [ ] **Step 6: Commit the writing domain**

```bash
git add src/lib/writing.ts src/lib/content.ts tests/unit/writing.test.ts
git commit -m "feat: add writing archive domain rules"
```

## Task 4: Build the accessible application shell and design system

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `public/og-default.svg`
- Modify: `src/pages/index.astro`
- Create: `tests/e2e/shell.spec.ts`

- [ ] **Step 1: Write the failing shell browser test**

Create `tests/e2e/shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('renders global identity, navigation, metadata, and footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Sunwoo Choi' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page).toHaveTitle('Sunwoo Choi');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost:4321/');
  await expect(page.getByRole('contentinfo')).toContainText('Sunwoo Choi');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:e2e -- tests/e2e/shell.spec.ts
```

Expected: FAIL because the accessible application shell is not implemented.

- [ ] **Step 3: Add the complete global design system**

Create `src/styles/global.css`:

```css
:root {
  color-scheme: light;
  --ink: #28251f;
  --muted: #665f55;
  --faint: #81796d;
  --paper: #fbfaf7;
  --paper-deep: #f1ede4;
  --line: #d8d1c5;
  --accent: #8e6140;
  --feature: #30342f;
  --feature-ink: #f7f1e7;
  --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --serif: Georgia, "Times New Roman", "Apple SD Gothic Neo", serif;
  --content: 73.75rem;
  --prose: 44rem;
  --radius: 0.25rem;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--serif);
  line-height: 1.65;
  text-rendering: optimizeLegibility;
}
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-underline-offset: 0.2em; }
button, input { font: inherit; }
button { cursor: pointer; }
[hidden] { display: none !important; }
:focus-visible { outline: 0.1875rem solid var(--accent); outline-offset: 0.1875rem; }

.skip-link {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  background: var(--ink);
  color: var(--paper);
  transform: translateY(-120%);
}
.skip-link:focus { transform: translateY(0); }
.container { width: min(calc(100% - 2rem), var(--content)); margin-inline: auto; }
.section { padding-block: clamp(3.5rem, 8vw, 7rem); }
.eyebrow {
  margin: 0 0 1.25rem;
  color: var(--accent);
  font: 700 0.72rem/1 var(--sans);
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.site-header { border-bottom: 1px solid var(--line); }
.site-header__inner {
  min-height: 4.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.site-brand { font: 700 0.85rem/1 var(--sans); text-decoration: none; }
.site-nav { display: flex; flex-wrap: wrap; gap: clamp(1rem, 3vw, 2rem); }
.site-nav a {
  color: var(--muted);
  font: 500 0.78rem/1 var(--sans);
  text-decoration: none;
}
.site-nav a[aria-current="page"] { color: var(--ink); text-decoration: underline; }
.hero { padding-block: clamp(5rem, 12vw, 10rem); }
.hero__title {
  max-width: 13ch;
  margin: 0;
  font-size: clamp(3rem, 8vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 0.95;
}
.hero__statement {
  max-width: 27ch;
  margin: clamp(2rem, 5vw, 3.5rem) 0 0;
  font-size: clamp(1.35rem, 3vw, 2.1rem);
  line-height: 1.45;
  word-break: keep-all;
}
.hero__copy {
  max-width: 38rem;
  margin: 1.75rem 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  line-height: 1.9;
  word-break: keep-all;
}
.section--tinted { background: var(--paper-deep); border-block: 1px solid var(--line); }
.section-head { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; margin-bottom: 2rem; }
.section-title { margin: 0; font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; letter-spacing: -0.035em; }
.text-link { color: var(--muted); font: 700 0.72rem/1 var(--sans); letter-spacing: 0.08em; text-transform: uppercase; }
.featured-card {
  min-height: 19rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: var(--feature);
  color: var(--feature-ink);
  text-decoration: none;
}
.featured-card h3 { max-width: 18ch; margin: 3rem 0 0.75rem; font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 400; line-height: 1.05; }
.featured-card p { max-width: 42rem; margin: 0; color: #cfcbc1; }
.writing-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 0; padding: 0; list-style: none; }
.writing-card { height: 100%; padding: 1.5rem; border: 1px solid var(--line); background: var(--paper); }
.writing-card a { text-decoration: none; }
.writing-card h2, .writing-card h3 { margin: 0.8rem 0 0.6rem; font-size: clamp(1.25rem, 2.5vw, 1.75rem); font-weight: 400; line-height: 1.25; }
.writing-card p { margin: 0; color: var(--muted); }
.meta { color: var(--faint); font: 600 0.7rem/1.4 var(--sans); letter-spacing: 0.05em; text-transform: uppercase; }
.filters { display: grid; gap: 1rem; margin-block: 2rem; }
.filter-group { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; border: 0; }
.filter-group legend { width: 100%; margin-bottom: 0.4rem; font: 700 0.72rem/1 var(--sans); }
.filter-button { padding: 0.55rem 0.8rem; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--muted); font: 600 0.76rem/1 var(--sans); }
.filter-button[aria-pressed="true"] { border-color: var(--ink); background: var(--ink); color: var(--paper); }
.empty-state { padding: 2rem; border: 1px dashed var(--line); color: var(--muted); }
.newsletter { padding: clamp(1.5rem, 4vw, 2.5rem); border: 1px solid var(--line); background: var(--paper-deep); }
.newsletter h2 { margin-top: 0; font-weight: 400; }
.newsletter-form { display: flex; gap: 0.65rem; align-items: end; }
.field { flex: 1; }
.field label { display: block; margin-bottom: 0.4rem; font: 700 0.72rem/1 var(--sans); }
.field input { width: 100%; min-height: 2.8rem; border: 1px solid var(--line); background: white; padding: 0.7rem 0.8rem; }
.button { min-height: 2.8rem; border: 1px solid var(--ink); background: var(--ink); color: white; padding: 0.7rem 1rem; font: 700 0.76rem/1 var(--sans); }
.button:disabled { cursor: not-allowed; opacity: 0.55; }
.work-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.work-item { display: grid; grid-template-columns: minmax(10rem, 0.45fr) 1fr; gap: 2rem; padding-block: 2rem; border-bottom: 1px solid var(--line); }
.work-item h2 { margin: 0; font-size: 1.6rem; font-weight: 400; }
.work-item p { margin: 0.5rem 0 0; color: var(--muted); }
.article-header { width: min(calc(100% - 2rem), var(--prose)); margin-inline: auto; padding-block: clamp(4rem, 10vw, 8rem) 2rem; }
.article-header h1 { margin: 0.75rem 0 1rem; font-size: clamp(2.6rem, 7vw, 5rem); font-weight: 400; letter-spacing: -0.045em; line-height: 1; }
.article-header__description { color: var(--muted); font-size: 1.15rem; }
.prose { width: min(calc(100% - 2rem), var(--prose)); margin-inline: auto; padding-bottom: clamp(4rem, 9vw, 8rem); font-size: 1.05rem; }
.prose :is(h2, h3) { margin-top: 2.5em; line-height: 1.25; }
.prose p { margin-block: 1.4em; }
.prose blockquote { margin-inline: 0; padding-left: 1.25rem; border-left: 0.2rem solid var(--accent); color: var(--muted); }
.prose pre { overflow-x: auto; padding: 1rem; background: var(--feature); color: var(--feature-ink); }
.site-footer { padding-block: 1.5rem; border-top: 1px solid var(--line); color: var(--faint); font: 500 0.72rem/1.5 var(--sans); }
.site-footer__inner { display: flex; justify-content: space-between; gap: 1rem; }

@media (max-width: 45rem) {
  .site-header__inner { align-items: flex-start; flex-direction: column; padding-block: 1rem; }
  .writing-grid, .work-item { grid-template-columns: 1fr; }
  .section-head, .newsletter-form, .site-footer__inner { align-items: stretch; flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Implement the document shell and navigation**

Create `src/components/SiteHeader.astro`:

```astro
---
const pathname = Astro.url.pathname;
const links = [
  { href: '/about/', label: 'About' },
  { href: '/writing/', label: 'Writing' },
  { href: '/work/', label: 'Work' },
];

const isCurrent = (href: string) => pathname === href || pathname.startsWith(href);
---

<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-brand" href="/">Sunwoo Choi</a>
    <nav class="site-nav" aria-label="Primary">
      {links.map((link) => (
        <a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
      ))}
    </nav>
  </div>
</header>
```

Create `src/components/SiteFooter.astro`:

```astro
<footer class="site-footer">
  <div class="container site-footer__inner">
    <span>© {new Date().getFullYear()} Sunwoo Choi</span>
    <span>
      <a href="https://github.com/sunwoochoi2002" rel="me noreferrer">GitHub</a>
      · <a href="mailto:choisunwoo020501@gmail.com">Email</a>
    </span>
  </div>
</footer>
```

Create `src/layouts/BaseLayout.astro`:

```astro
---
import SiteFooter from '../components/SiteFooter.astro';
import SiteHeader from '../components/SiteHeader.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  lang?: 'ko' | 'en';
  canonicalUrl?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const {
  title,
  description,
  lang = 'ko',
  canonicalUrl,
  type = 'website',
  noindex = false,
} = Astro.props;
const pageTitle = title === 'Home' ? 'Sunwoo Choi' : `${title} — Sunwoo Choi`;
const site = Astro.site ?? new URL('http://localhost:4321');
const canonical = canonicalUrl ?? new URL(Astro.url.pathname, site).toString();
const socialImage = new URL('/og-default.svg', site).toString();
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="generator" content={Astro.generator} />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex" />}
    <meta property="og:type" content={type} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={socialImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={socialImage} />
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <SiteHeader />
    <main id="main-content" tabindex="-1"><slot /></main>
    <SiteFooter />
  </body>
</html>
```

Replace `src/pages/index.astro` with this temporary shell page:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Home" description="Sunwoo Choi's personal writing and archive.">
  <section class="container section"><h1>Memorying</h1></section>
</BaseLayout>
```

- [ ] **Step 5: Add the default social image**

Create `public/og-default.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f1ede4"/>
  <text x="90" y="285" fill="#28251f" font-family="Georgia, serif" font-size="78">Sunwoo Choi</text>
  <text x="92" y="355" fill="#8e6140" font-family="Arial, sans-serif" font-size="28" letter-spacing="4">PERSONAL ARCHIVE</text>
</svg>
```

- [ ] **Step 6: Run the shell test and static checks**

Run:

```bash
npm run test:e2e -- tests/e2e/shell.spec.ts
npm run check
```

Expected: the shell test PASSes and Astro check exits 0.

- [ ] **Step 7: Commit the shell**

```bash
git add src/styles src/layouts src/components/SiteHeader.astro src/components/SiteFooter.astro src/pages/index.astro public/og-default.svg tests/e2e/shell.spec.ts
git commit -m "feat: add accessible application shell"
```

## Task 5: Implement the person-first Home, About, and Work pages

**Files:**
- Create: `src/components/PersonalIntroduction.astro`
- Create: `src/components/FeaturedWriting.astro`
- Create: `src/components/WritingCard.astro`
- Create: `src/components/WorkList.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/work.astro`
- Create: `tests/e2e/home-and-work.spec.ts`

- [ ] **Step 1: Write the failing page tests**

Create `tests/e2e/home-and-work.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home is person-first and keeps the introduction in one column', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: "Hello, I’m Sunwoo." })).toBeVisible();
  await expect(page.getByText('시간이 지나도 잊고 싶지 않은 것들을 기록합니다.')).toBeVisible();
  await expect(page.getByText('이 공간에 도착한 당신을 환영합니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Memorying을 시작하며/ })).toBeVisible();
});

test('about and work explain the person without becoming a full résumé', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page.getByText('안녕하세요, 최선우입니다.')).toBeVisible();

  await page.goto('/work/');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Memorying' })).toBeVisible();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test:e2e -- tests/e2e/home-and-work.spec.ts
```

Expected: FAIL because the final pages and components do not exist.

- [ ] **Step 3: Implement Home writing components**

Create `src/components/PersonalIntroduction.astro`:

```astro
<section class="container hero" aria-labelledby="personal-heading">
  <p class="eyebrow">Personal archive · 개인 아카이브</p>
  <h1 id="personal-heading" class="hero__title">Hello, I’m Sunwoo.</h1>
  <p class="hero__statement">시간이 지나도 잊고 싶지 않은 것들을 기록합니다.</p>
  <p class="hero__copy">
    안녕하세요, 최선우입니다.<br />
    이 공간에 도착한 당신을 환영합니다.<br />
    일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.
  </p>
</section>
```

Create `src/components/FeaturedWriting.astro`:

```astro
---
import type { WritingItem } from '../lib/writing';
interface Props { item: WritingItem; }
const { item } = Astro.props;
---

<a class="featured-card" href={`/writing/${item.slug}/`}>
  <span class="meta">Essay · {item.language === 'ko' ? '한국어' : 'English'}</span>
  <span>
    <h3>{item.title}</h3>
    <p>{item.description}</p>
  </span>
</a>
```

Create `src/components/WritingCard.astro`:

```astro
---
import type { WritingItem } from '../lib/writing';
interface Props { item: WritingItem; headingLevel?: 2 | 3; }
const { item, headingLevel = 2 } = Astro.props;
const Heading = headingLevel === 2 ? 'h2' : 'h3';
const locale = item.language === 'ko' ? 'ko-KR' : 'en-US';
---

<article class="writing-card">
  <span class="meta">{item.type === 'essay' ? 'Essay' : 'Note'} · {item.language === 'ko' ? '한국어' : 'English'}</span>
  <Heading><a href={`/writing/${item.slug}/`}>{item.title}</a></Heading>
  <p>{item.description}</p>
  <time class="meta" datetime={item.publishedAt.toISOString()}>
    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(item.publishedAt)}
  </time>
</article>
```

- [ ] **Step 4: Implement Work rendering**

Create `src/components/WorkList.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { WorkEntry } from '../lib/content';
interface Props { entries: WorkEntry[]; }
const { entries } = Astro.props;
---

<ul class="work-list">
  {entries.map((entry) => (
    <li class="work-item">
      <div>
        <h2>{entry.data.title}</h2>
        <p class="meta">{entry.data.period} · {entry.data.role}</p>
      </div>
      <div>
        {entry.data.image && <Image src={entry.data.image} alt={entry.data.title} widths={[480, 800]} sizes="(max-width: 720px) 100vw, 50vw" />}
        <p>{entry.data.description}</p>
        {entry.data.status && <p class="meta">{entry.data.status}</p>}
        {entry.data.url && <p><a href={entry.data.url} target="_blank" rel="noreferrer">Visit project ↗</a></p>}
      </div>
    </li>
  ))}
</ul>
```

- [ ] **Step 5: Implement Home, About, and Work routes**

Replace `src/pages/index.astro`:

```astro
---
import FeaturedWriting from '../components/FeaturedWriting.astro';
import PersonalIntroduction from '../components/PersonalIntroduction.astro';
import WritingCard from '../components/WritingCard.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { loadWriting } from '../lib/content';
import { selectFeatured } from '../lib/writing';

const writing = await loadWriting();
const featured = selectFeatured(writing);
const recent = writing.filter((item) => item.slug !== featured?.slug).slice(0, 3);
---

<BaseLayout title="Home" description="Sunwoo Choi's personal writing and archive.">
  <PersonalIntroduction />
  <section class="section section--tinted" aria-labelledby="latest-writing">
    <div class="container">
      <div class="section-head">
        <h2 id="latest-writing" class="section-title">Latest writing</h2>
        <a class="text-link" href="/writing/">Browse the archive →</a>
      </div>
      {featured ? <FeaturedWriting item={featured} /> : <p class="empty-state">첫 번째 Essay를 준비하고 있습니다.</p>}
      {recent.length > 0 && (
        <ul class="writing-grid" style="margin-top: 1rem">
          {recent.map((item) => <li><WritingCard item={item} headingLevel={3} /></li>)}
        </ul>
      )}
    </div>
  </section>
</BaseLayout>
```

Create `src/pages/about.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="About" description="About Sunwoo Choi and the ideas behind Memorying.">
  <section class="container section">
    <p class="eyebrow">Person behind the archive</p>
    <h1 class="section-title">About</h1>
    <div class="prose" style="margin: 2rem 0 0; padding: 0">
      <p>안녕하세요, 최선우입니다.</p>
      <p>시간이 지나도 잊고 싶지 않은 것들을 기록하고, 일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.</p>
      <p>Memorying은 작업과 생각을 천천히 쌓아가는 개인적인 공간입니다.</p>
    </div>
  </section>
</BaseLayout>
```

Create `src/pages/work.astro`:

```astro
---
import WorkList from '../components/WorkList.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { loadWork } from '../lib/content';
const work = await loadWork();
---

<BaseLayout title="Work" description="Selected work by Sunwoo Choi.">
  <section class="container section">
    <p class="eyebrow">Projects and practice</p>
    <h1 class="section-title">Selected work</h1>
    <div style="margin-top: 2rem">
      {work.length ? <WorkList entries={work} /> : <p class="empty-state">Selected work will appear here.</p>}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Run the page tests and build**

Run:

```bash
npm run test:e2e -- tests/e2e/home-and-work.spec.ts
npm run build
```

Expected: both browser tests PASS and the static build exits 0.

- [ ] **Step 7: Commit person-first pages**

```bash
git add src/components src/pages/index.astro src/pages/about.astro src/pages/work.astro tests/e2e/home-and-work.spec.ts
git commit -m "feat: add person-first home and work pages"
```

## Task 6: Implement the Writing archive and bookmarkable filters

**Files:**
- Create: `src/components/WritingFilters.astro`
- Create: `src/pages/writing/index.astro`
- Create: `tests/e2e/writing.spec.ts`

- [ ] **Step 1: Write failing archive tests**

Create `tests/e2e/writing.spec.ts` with the archive cases first:

```ts
import { expect, test } from '@playwright/test';

test('shows all writing and combines type and language filters', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.getByRole('button', { name: '한국어' }).click();
  await expect(page).toHaveURL('/writing/?type=note&lang=ko');
  await expect(page.getByText('이 조건에 해당하는 글이 아직 없습니다.')).toBeVisible();

  await page.getByRole('button', { name: '모든 글 보기' }).click();
  await expect(page).toHaveURL('/writing/');
});

test('restores valid query state and ignores unsupported query values', async ({ page }) => {
  await page.goto('/writing/?type=essay&lang=ko');
  await expect(page.getByRole('button', { name: 'Essay' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '한국어' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/writing/?type=article&lang=jp');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
});

test('server-renders the full archive when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await context.close();
});
```

- [ ] **Step 2: Run the archive tests to verify they fail**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
```

Expected: FAIL because `/writing/` and its filter controls do not exist.

- [ ] **Step 3: Implement accessible filter controls and URL state**

Create `src/components/WritingFilters.astro`:

```astro
<div class="filters" data-writing-filters>
  <fieldset class="filter-group" data-filter-group="type">
    <legend>Type</legend>
    <button class="filter-button" type="button" data-value="all" aria-pressed="true">All</button>
    <button class="filter-button" type="button" data-value="essay" aria-pressed="false">Essay</button>
    <button class="filter-button" type="button" data-value="note" aria-pressed="false">Note</button>
  </fieldset>
  <fieldset class="filter-group" data-filter-group="language">
    <legend>Language</legend>
    <button class="filter-button" type="button" data-value="all" aria-pressed="true">All</button>
    <button class="filter-button" type="button" data-value="ko" aria-pressed="false">한국어</button>
    <button class="filter-button" type="button" data-value="en" aria-pressed="false">English</button>
  </fieldset>
  <p aria-live="polite" data-filter-status></p>
  <p class="empty-state" data-filter-empty hidden>
    이 조건에 해당하는 글이 아직 없습니다.
    <button class="filter-button" type="button" data-reset-filters>모든 글 보기</button>
  </p>
</div>

<script>
  import { buildWritingSearch, parseWritingFilters, type WritingFilters } from '../lib/writing';

  const root = document.querySelector<HTMLElement>('[data-writing-filters]');
  const cards = [...document.querySelectorAll<HTMLElement>('[data-writing-card]')];

  if (root) {
    const status = root.querySelector<HTMLElement>('[data-filter-status]');
    const empty = root.querySelector<HTMLElement>('[data-filter-empty]');

    const apply = (filters: WritingFilters) => {
      let visible = 0;
      for (const card of cards) {
        const matchesType = filters.type === 'all' || card.dataset.type === filters.type;
        const matchesLanguage = filters.language === 'all' || card.dataset.language === filters.language;
        card.hidden = !(matchesType && matchesLanguage);
        if (!card.hidden) visible += 1;
      }

      for (const group of root.querySelectorAll<HTMLElement>('[data-filter-group]')) {
        const key = group.dataset.filterGroup as keyof WritingFilters;
        for (const button of group.querySelectorAll<HTMLButtonElement>('[data-value]')) {
          button.setAttribute('aria-pressed', String(button.dataset.value === filters[key]));
        }
      }

      if (status) status.textContent = `${visible} writing item${visible === 1 ? '' : 's'}`;
      if (empty) empty.hidden = visible !== 0;
    };

    const read = () => parseWritingFilters(window.location.search);
    apply(read());

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const reset = target.closest<HTMLButtonElement>('[data-reset-filters]');
      if (reset) {
        history.pushState({}, '', window.location.pathname);
        apply({ type: 'all', language: 'all' });
        return;
      }

      const button = target.closest<HTMLButtonElement>('[data-value]');
      const group = button?.closest<HTMLElement>('[data-filter-group]');
      if (!button || !group) return;
      const current = read();
      const key = group.dataset.filterGroup as keyof WritingFilters;
      const next = { ...current, [key]: button.dataset.value } as WritingFilters;
      history.pushState({}, '', `${window.location.pathname}${buildWritingSearch(next)}`);
      apply(next);
    });

    window.addEventListener('popstate', () => apply(read()));
  }
</script>
```

- [ ] **Step 4: Implement the archive route**

Create `src/pages/writing/index.astro`:

```astro
---
import WritingCard from '../../components/WritingCard.astro';
import WritingFilters from '../../components/WritingFilters.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { loadWriting } from '../../lib/content';
const writing = await loadWriting();
---

<BaseLayout title="Writing" description="Essays and notes by Sunwoo Choi.">
  <section class="container section">
    <p class="eyebrow">Essays and notes</p>
    <h1 class="section-title">Writing</h1>
    <p>한국어와 영어로 기록한 Essay와 Note를 최신순으로 모았습니다.</p>
    <WritingFilters />
    {writing.length ? (
      <ul class="writing-grid" data-writing-list>
        {writing.map((item) => (
          <li data-writing-card data-type={item.type} data-language={item.language}>
            <WritingCard item={item} />
          </li>
        ))}
      </ul>
    ) : (
      <p class="empty-state">아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.</p>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 5: Run archive, unit, and no-JavaScript checks**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
npm test -- tests/unit/writing.test.ts
```

Expected: browser and unit tests PASS, including the browser context with JavaScript disabled.

- [ ] **Step 6: Commit the archive**

```bash
git add src/components/WritingFilters.astro src/pages/writing/index.astro tests/e2e/writing.spec.ts
git commit -m "feat: add bookmarkable writing filters"
```

## Task 7: Generate individual writing pages, metadata, and 404 behavior

**Files:**
- Create: `src/components/ContentMetadata.astro`
- Create: `src/layouts/WritingLayout.astro`
- Create: `src/pages/writing/[...slug].astro`
- Create: `src/pages/404.astro`
- Modify: `tests/e2e/writing.spec.ts`

- [ ] **Step 1: Add failing article and 404 tests**

Append to `tests/e2e/writing.spec.ts`:

```ts
test('renders a bilingual article route with stable metadata', async ({ page }) => {
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4321/writing/memorying-start/',
  );
  await expect(page.getByRole('link', { name: 'Back to Writing' })).toBeVisible();
});

test('keeps navigation available on the noindex 404 page', async ({ page }) => {
  const response = await page.goto('/missing-memory/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('기억 속에 남아 있지 않습니다');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Writing 둘러보기' })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
```

Expected: the archive tests PASS; the new article and 404 tests FAIL because their routes do not exist.

- [ ] **Step 3: Implement article metadata and layout**

Create `src/components/ContentMetadata.astro`:

```astro
---
import type { WritingItem } from '../lib/writing';
interface Props { item: WritingItem; }
const { item } = Astro.props;
const locale = item.language === 'ko' ? 'ko-KR' : 'en-US';
const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
---

<p class="meta">
  <span>{item.type === 'essay' ? 'Essay' : 'Note'}</span>
  <span> · {item.language === 'ko' ? '한국어' : 'English'}</span>
  <span> · <time datetime={item.publishedAt.toISOString()}>{formatter.format(item.publishedAt)}</time></span>
  {item.updatedAt && (
    <span> · Updated <time datetime={item.updatedAt.toISOString()}>{formatter.format(item.updatedAt)}</time></span>
  )}
</p>
```

Create `src/layouts/WritingLayout.astro`:

```astro
---
import { Image } from 'astro:assets';
import ContentMetadata from '../components/ContentMetadata.astro';
import BaseLayout from './BaseLayout.astro';
import type { WritingItem } from '../lib/writing';
interface Props { item: WritingItem; }
const { item } = Astro.props;
---

<BaseLayout
  title={item.title}
  description={item.description}
  lang={item.language}
  canonicalUrl={item.canonicalUrl}
  type="article"
>
  <article>
    <header class="article-header">
      <ContentMetadata item={item} />
      <h1>{item.title}</h1>
      <p class="article-header__description">{item.description}</p>
      {item.coverImage && (
        <Image
          src={item.coverImage}
          alt={item.coverImageAlt ?? ''}
          widths={[640, 960, 1280]}
          sizes="(max-width: 720px) 100vw, 704px"
          style="margin-top: 2rem"
        />
      )}
    </header>
    <div class="prose"><slot /></div>
    <div class="container" style="padding-bottom: 3rem">
      <a class="text-link" href="/writing/">← Back to Writing</a>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Generate writing routes from entries**

Create `src/pages/writing/[...slug].astro`:

```astro
---
import { render, type CollectionEntry } from 'astro:content';
import WritingLayout from '../../layouts/WritingLayout.astro';
import { loadWritingEntries } from '../../lib/content';
import type { WritingItem } from '../../lib/writing';

export async function getStaticPaths() {
  const pairs = await loadWritingEntries();
  return pairs.map(({ entry, item }) => ({
    params: { slug: item.slug },
    props: { entry, item },
  }));
}

interface Props {
  entry: CollectionEntry<'writing'>;
  item: WritingItem;
}

const { entry, item } = Astro.props;
const { Content } = await render(entry);
---

<WritingLayout item={item}><Content /></WritingLayout>
```

- [ ] **Step 5: Implement the designed 404 page**

Create `src/pages/404.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
Astro.response.status = 404;
---

<BaseLayout
  title="Page not found"
  description="The requested page could not be found."
  noindex={true}
>
  <section class="container section">
    <p class="eyebrow">404</p>
    <h1 class="section-title">이 페이지는 기억 속에 남아 있지 않습니다.</h1>
    <p><a href="/">Home으로 돌아가기</a> · <a href="/writing/">Writing 둘러보기</a></p>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Run article tests, static checks, and build**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
npm run check
npm run build
```

Expected: all Writing tests PASS, static checks pass, and `dist/404.html` exists.

- [ ] **Step 7: Commit generated writing pages**

```bash
git add src/components/ContentMetadata.astro src/layouts/WritingLayout.astro 'src/pages/writing/[...slug].astro' src/pages/404.astro tests/e2e/writing.spec.ts
git commit -m "feat: add generated writing pages"
```

## Task 8: Integrate Buttondown and add the Privacy route

**Files:**
- Create: `src/components/NewsletterSignup.astro`
- Modify: `src/pages/writing/index.astro`
- Modify: `src/layouts/WritingLayout.astro`
- Create: `src/pages/privacy.astro`
- Modify: `src/env.d.ts`
- Create: `tests/e2e/newsletter.spec.ts`

- [ ] **Step 1: Write failing newsletter tests**

Create `tests/e2e/newsletter.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('collects only an email and links to the privacy notice', async ({ page }) => {
  await page.goto('/writing/');
  const form = page.getByRole('form', { name: 'Newsletter subscription' });
  await expect(form.getByLabel('Email')).toBeVisible();
  await expect(form.locator('input')).toHaveCount(2);
  await expect(form.locator('input[type="email"]')).toHaveAttribute('name', 'email');
  await expect(form.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
});

test('uses browser validation and posts valid email directly to Buttondown', async ({ page }) => {
  await page.goto('/writing/');
  const email = page.getByRole('form', { name: 'Newsletter subscription' }).getByLabel('Email');
  await email.fill('invalid');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);

  let posted = '';
  await page.route('https://buttondown.com/api/emails/embed-subscribe/memorying-test', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<h1>Check your inbox</h1>',
    });
  });
  await email.fill('reader@example.com');
  await Promise.all([
    page.waitForURL('https://buttondown.com/api/emails/embed-subscribe/memorying-test'),
    page.getByRole('button', { name: 'Subscribe' }).click(),
  ]);
  expect(posted).toContain('email=reader%40example.com');
  expect(posted).toContain('embed=1');
});

test('shows the secondary subscription form after an Essay but not a Note', async ({ page }) => {
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toBeVisible();
  await page.goto('/writing/small-beginning/');
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test:e2e -- tests/e2e/newsletter.spec.ts
```

Expected: FAIL because the form and Privacy route do not exist.

- [ ] **Step 3: Declare the public build-time provider setting**

Append to `src/env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly PUBLIC_BUTTONDOWN_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: Implement the direct provider form**

Create `src/components/NewsletterSignup.astro`:

```astro
---
interface Props { id: string; compact?: boolean; }
const { id, compact = false } = Astro.props;
const username = import.meta.env.PUBLIC_BUTTONDOWN_USERNAME?.trim();
const action = username
  ? `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`
  : undefined;
---

<aside class="newsletter" aria-labelledby={`${id}-newsletter-heading`}>
  <h2 id={`${id}-newsletter-heading`}>{compact ? '새 Essay를 이메일로 받아보세요.' : 'Subscribe to new Essays'}</h2>
  <p>선택한 Essay의 전문을 이메일로 보냅니다. Note는 기본 발송 대상이 아닙니다.</p>
  <form
    class="newsletter-form"
    aria-label="Newsletter subscription"
    action={action}
    method="post"
    data-newsletter-form
  >
    <div class="field">
      <label for={`${id}-email`}>Email</label>
      <input id={`${id}-email`} name="email" type="email" autocomplete="email" required />
      <input type="hidden" name="embed" value="1" />
    </div>
    <button class="button" type="submit" disabled={!action}>Subscribe</button>
  </form>
  <p><small>구독은 언제든 취소할 수 있습니다. <a href="/privacy/">Privacy</a></small></p>
  {!action && import.meta.env.DEV && <p role="status">Set PUBLIC_BUTTONDOWN_USERNAME to test subscriptions.</p>}
</aside>

<script>
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-newsletter-form]')) {
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    form.addEventListener('submit', () => {
      if (!form.checkValidity() || !button) return;
      button.disabled = true;
      button.textContent = 'Subscribing…';
    });
    window.addEventListener('pageshow', () => {
      if (!button || !form.hasAttribute('action')) return;
      button.disabled = false;
      button.textContent = 'Subscribe';
    });
  }
</script>
```

- [ ] **Step 5: Place the form only in approved locations**

In `src/pages/writing/index.astro`, import the component:

```astro
import NewsletterSignup from '../../components/NewsletterSignup.astro';
```

Then add this after the archive list inside the section:

```astro
<div style="margin-top: 4rem"><NewsletterSignup id="writing-archive" /></div>
```

In `src/layouts/WritingLayout.astro`, import the component:

```astro
import NewsletterSignup from '../components/NewsletterSignup.astro';
```

Then add this after the prose slot and before the Back to Writing link:

```astro
{item.type === 'essay' && (
  <div class="container" style="padding-bottom: 3rem">
    <NewsletterSignup id="essay-end" compact={true} />
  </div>
)}
```

- [ ] **Step 6: Implement the Privacy route**

Create `src/pages/privacy.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Privacy" description="How Memorying handles newsletter subscription data.">
  <section class="container section">
    <p class="eyebrow">Newsletter data</p>
    <h1 class="section-title">Privacy</h1>
    <div class="prose" style="margin: 2rem 0 0; padding: 0">
      <p>Memorying의 뉴스레터 구독 폼은 이메일 주소만 수집합니다.</p>
      <p>이메일 주소는 뉴스레터 발송과 구독 관리를 위해 Buttondown으로 직접 전달되며, Memorying이 별도의 데이터베이스에 저장하지 않습니다.</p>
      <p>모든 뉴스레터에는 구독 취소 방법이 포함됩니다. 데이터 처리에 관한 문의는 <a href="mailto:choisunwoo020501@gmail.com">이메일</a>로 보낼 수 있습니다.</p>
      <p>서비스 제공자의 처리 방식은 <a href="https://buttondown.com/legal/privacy" rel="noreferrer">Buttondown Privacy Policy</a>에서 확인할 수 있습니다.</p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 7: Run newsletter tests and full build**

Run:

```bash
npm run test:e2e -- tests/e2e/newsletter.spec.ts
PUBLIC_BUTTONDOWN_USERNAME=memorying-test npm run build
```

Expected: all newsletter tests PASS and the build contains a form action ending in `/memorying-test`.

- [ ] **Step 8: Commit the provider integration**

```bash
git add src/components/NewsletterSignup.astro src/pages/writing/index.astro src/layouts/WritingLayout.astro src/pages/privacy.astro src/env.d.ts tests/e2e/newsletter.spec.ts
git commit -m "feat: integrate Buttondown subscriptions"
```

## Task 9: Add accessibility, responsive, and generated-link gates

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `scripts/check-built-links.mjs`
- Create: `scripts/check-source-assets.mjs`

- [ ] **Step 1: Add accessibility and keyboard tests**

Create `tests/e2e/accessibility.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/about/', '/writing/', '/writing/memorying-start/', '/work/', '/privacy/', '/404/']) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
    expect(blocking).toEqual([]);
  });
}

test('skip link and primary navigation work by keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
```

- [ ] **Step 2: Add representative responsive smoke tests**

Create `tests/e2e/responsive.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];
const paths = ['/', '/writing/', '/writing/memorying-start/', '/work/', '/privacy/', '/404/'];

for (const width of widths) {
  for (const path of paths) {
    test(`${path} fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
}
```

- [ ] **Step 3: Implement generated internal-link verification**

Create `scripts/check-built-links.mjs`:

```js
import { access, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { parseHTML } from 'linkedom';

const root = resolve('dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return files.flat();
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function resolvesFromBuild(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  const direct = join(root, clean);
  const candidates = extname(clean)
    ? [direct]
    : [join(direct, 'index.html'), `${direct}.html`];
  for (const candidate of candidates) if (await exists(candidate)) return true;
  return false;
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll('[href], [src]')) {
    const value = element.getAttribute('href') ?? element.getAttribute('src');
    if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('data:')) continue;
    const url = new URL(value, 'https://memorying.local');
    if (url.origin !== 'https://memorying.local') continue;
    if (!(await resolvesFromBuild(url.pathname))) {
      failures.push(`${relative(root, file)} -> ${value}`);
    }
  }
}

if (failures.length) {
  console.error(`Broken generated links:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} generated HTML files: no broken internal links.`);
```

Create `scripts/check-source-assets.mjs`:

```js
import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const roots = ['src/content', 'public'].map(resolve);
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const maximumBytes = 25 * 1024 * 1024;
const oversized = [];

async function inspect(path) {
  const metadata = await stat(path);
  if (metadata.isDirectory()) {
    for (const entry of await readdir(path)) await inspect(join(path, entry));
    return;
  }
  if (imageExtensions.has(extname(path).toLowerCase()) && metadata.size > maximumBytes) {
    oversized.push(`${relative(process.cwd(), path)} (${metadata.size} bytes)`);
  }
}

for (const root of roots) await inspect(root);

if (oversized.length) {
  console.error(`Images above the 25 MiB limit:\n${oversized.join('\n')}`);
  process.exit(1);
}

console.log('Source image check passed: no image exceeds 25 MiB.');
```

- [ ] **Step 4: Run the new gates and fix only concrete failures**

Run:

```bash
npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts tests/e2e/writing.spec.ts
npm run check:assets
npm run build
npm run check:links
```

Expected: no serious or critical axe violations, every viewport test PASSes, the no-JavaScript archive test PASSes, no image exceeds 25 MiB, and the link checker reports zero broken internal links. If an assertion fails, make the smallest change in the responsible component or `src/styles/global.css`, rerun the failing file, then rerun all four commands.

- [ ] **Step 5: Commit quality gates**

```bash
git add tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts scripts/check-built-links.mjs scripts/check-source-assets.mjs src/styles/global.css src/components src/pages src/layouts
git commit -m "test: add accessibility and responsive gates"
```

## Task 10: Add Cloudflare configuration and publishing operations

**Files:**
- Create: `public/_headers`
- Create: `docs/publishing.md`
- Modify: `README.md`

- [ ] **Step 1: Add static security and asset-cache headers**

Create `public/_headers`:

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://buttondown.com; form-action 'self' https://buttondown.com; frame-src https://open.spotify.com https://www.youtube-nocookie.com; base-uri 'self'; frame-ancestors 'none'

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 2: Write the complete publishing and launch runbook**

Create `docs/publishing.md`:

```markdown
# Publishing Memorying

## Write and preview

1. Copy one of the existing folders under `src/content/writing/`.
2. Give the folder a stable lowercase English slug with hyphens.
3. Keep `draft: true` while writing.
4. Run `npm run dev` and open the local article route.
5. Run `npm run check`, `npm test`, and `npm run build`.
6. Set `draft: false` only after the title, description, language, type, dates, links, and images are final.
7. Commit and push, then inspect the Cloudflare preview before promoting the change.

Published slugs are permanent. Add an explicit Cloudflare redirect before renaming one.

## Send a full Essay through Buttondown

1. Publish the Essay on Memorying and verify its canonical URL.
2. Open the Buttondown dashboard and create a new email in Markdown mode.
3. Transfer the complete standard-Markdown content.
4. Replace site-only MDX components or media embeds with email-safe text, images, or links.
5. Add the canonical Memorying URL.
6. Send a test email and inspect desktop and mobile rendering.
7. Manually approve the send.

Publishing a site change never sends email automatically. Notes are not newsletter content by default.

## Configure Cloudflare Pages

1. Import this GitHub repository into Cloudflare Pages.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Set `SITE_URL` to the final `https://` production origin, without a trailing path.
5. Set `PUBLIC_BUTTONDOWN_USERNAME` to the actual Buttondown username.
6. Deploy and confirm that `_headers`, `sitemap-index.xml` or `sitemap-0.xml`, canonical URLs, and the Buttondown form action are present.

## Launch checklist

- [ ] Replace or explicitly approve the two draft starter posts.
- [ ] Publish at least one Essay and one Note.
- [ ] Confirm Home, About, Writing, Work, Privacy, individual posts, and 404.
- [ ] Check 320, 390, 768, 1024, and 1440 pixel layouts.
- [ ] Run `npm run verify` locally.
- [ ] Confirm Cloudflare preview and production builds.
- [ ] Subscribe using a real test email.
- [ ] Complete Buttondown confirmation if enabled.
- [ ] Send and receive a full-Essay test newsletter.
- [ ] Verify the canonical link and unsubscribe flow.
- [ ] Confirm Privacy wording matches the live Buttondown configuration.
- [ ] Run Lighthouse on Home, Writing, and one Essay; target at least 90 in Performance, Accessibility, Best Practices, and SEO.
```

- [ ] **Step 3: Replace the minimal README with exact project guidance**

Replace `README.md`:

````markdown
# Memorying

Sunwoo Choi's person-first personal writing and archival site.

## Commands

```bash
npm install
npm run dev
npm run check
npm test
npm run test:e2e
npm run build
npm run check:assets
npm run check:links
npm run verify
```

## Content

- Writing: `src/content/writing/`
- Selected Work: `src/content/work/`
- Product design: `docs/superpowers/specs/2026-07-24-memorying-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-24-memorying-mvp.md`
- Publishing and launch: `docs/publishing.md`

Production builds require the correct `SITE_URL` and `PUBLIC_BUTTONDOWN_USERNAME` values in Cloudflare Pages.
````

- [ ] **Step 4: Run the complete local verification gate**

Run:

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 npm run verify
git diff --check
git status --short
```

Expected:

- Astro check exits 0.
- All Vitest tests PASS.
- Production build exits 0.
- Generated-link checker reports zero broken internal links.
- All Playwright tests PASS with no serious or critical axe violations.
- `git diff --check` prints nothing.
- `git status --short` lists only the intentional Task 10 files; the user's `image.png` remains untracked and unchanged.

- [ ] **Step 5: Commit deployment operations**

```bash
git add public/_headers docs/publishing.md README.md
git commit -m "docs: add publishing and deployment runbook"
```

- [ ] **Step 6: Perform final repository verification**

Run:

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 npm run verify
git log --oneline -10
git status --short
```

Expected: the full verification suite exits 0; the task commits appear in order; only user-owned, deliberately uncommitted files such as `image.png` remain outside Git.
