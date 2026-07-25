# Compact Home and Writing UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing-page presentation with a compact person-first home and reshape Writing into a type-only text archive while preserving the bilingual detail behavior from the foundation plan.

**Architecture:** The UI consumes `WritingArticle` values from the completed bilingual foundation plan and always selects localized archive copy with `originalTranslation(article)`. Writing uses one progressively enhanced Type filter over compact semantic rows. The home opts into a viewport-aware shell that fits header, introduction, two recent rows, and footer at 1280 × 720, while mobile uses explicit responsive line treatment and natural vertical flow.

**Tech Stack:** Astro 7 components, semantic HTML, modern responsive CSS, TypeScript 6, Playwright 1.61, Vitest 4.

## Global Constraints

- Start only after `docs/superpowers/plans/2026-07-25-bilingual-writing-foundation.md` passes its completion gate.
- The desktop heading `Hello, I’m Sunwoo.` remains one line.
- The mobile heading breaks after `Hello,` so `I’m Sunwoo.` begins the next line.
- `시간이 지나도 잊고 싶지 않은 것들을 기록합니다.` remains one line on desktop and supported mobile widths down to 320 px without horizontal overflow.
- At 1280 × 720, header, complete introduction, two recent-writing rows, and footer are visible in the initial viewport.
- Mobile preserves readable supporting copy and uses a short natural scroll; do not force the page into `100vh`.
- Writing exposes only `Type: All / Essay / Note`; do not render or parse a Language filter.
- Archive and home rows use the original-language title and description and never display cover thumbnails.
- Cover images remain detail-only; the archive and homepage render no `<img>` for writing content.
- Keep Subscribe at the bottom of Writing and keep it absent from global navigation and home.
- Preserve 44 px interactive targets, focus visibility, no-JS readable lists, draft exclusion, and all unrelated MVP behavior.
- Follow strict TDD and complete spec-compliance plus code-quality review after each task before proceeding.
- Do not perform Cloudflare, DNS, custom-domain, or final `SITE_URL` work.

---

## File Structure

### Create

- `src/components/WritingListItem.astro` — renders one original-language title/description/type/date row for home and archive contexts.

### Modify

- `src/components/WritingFilters.astro` — keeps only the Type fieldset and type-only history synchronization.
- `src/pages/writing/index.astro` — renders one compact row per logical article and retains the bottom subscription section.
- `src/components/PersonalIntroduction.astro` — adds semantic heading-line hooks while preserving approved copy.
- `src/pages/index.astro` — renders the compact one-column home and two recent rows without featured-card logic.
- `src/layouts/BaseLayout.astro` — accepts an optional body class for the home shell.
- `src/styles/global.css` — replaces card/hero density with compact archive, home viewport, responsive heading, and one-line statement rules.
- `tests/unit/writing.test.ts` — confirms query helpers ignore legacy `lang` input and serialize only Type.
- `tests/e2e/writing.spec.ts` — tests type-only controls, history, no-JS behavior, one row per article, and absence of archive thumbnails.
- `tests/e2e/home-and-work.spec.ts` — tests compact original-language recent rows and desktop initial-viewport completion.
- `tests/e2e/responsive.spec.ts` — tests desktop/mobile line geometry, natural mobile scroll, 320 px overflow, and touch targets.
- `tests/e2e/accessibility.spec.ts` — runs axe against the final compact pages.

### Delete if unused after import search

- `src/components/WritingCard.astro`
- `src/components/FeaturedWriting.astro`

---

### Task 1: Build the type-only chronological Writing archive

**Files:**

- Create: `src/components/WritingListItem.astro`
- Modify: `src/components/WritingFilters.astro`
- Modify: `src/pages/writing/index.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/unit/writing.test.ts`
- Modify: `tests/e2e/writing.spec.ts`

**Interfaces:**

- Consumes: foundation `WritingArticle`, `loadWritingArticles()`, `originalTranslation(article)`, and the article-specific pure helpers.
- Produces: `WritingListItem` props `{ item: WritingArticle; headingLevel?: 2 | 3; compact?: boolean }`.
- Produces DOM hooks: `[data-writing-archive]`, `[data-writing-list]`, `[data-writing-item]`, `[data-type]`, `[data-writing-filters]`, and `[data-filter-status]`.

- [ ] **Step 1: Write final type-only query unit expectations**

In `tests/unit/writing.test.ts`, require legacy language input to have no effect:

```ts
expect(parseWritingFilters('?type=essay&lang=en')).toEqual({ type: 'essay' });
expect(parseWritingFilters('?type=article&lang=ko')).toEqual({ type: 'all' });
expect(buildWritingSearch({ type: 'note' })).toBe('?type=note');
expect(buildWritingSearch({ type: 'all' })).toBe('');
```

Run:

```bash
npm test -- tests/unit/writing.test.ts
```

Expected: FAIL because the temporary compatibility filters still parse and serialize language.

- [ ] **Step 2: Rewrite archive E2E expectations before the component**

Replace the language-aware status helper with:

```ts
const statusText = (count: number, type: string) =>
  `Showing ${count} writing item${count === 1 ? '' : 's'}: Type ${type}.`;
```

The main archive test must assert:

```ts
await expect(page.locator('[data-filter-group="language"]')).toHaveCount(0);
await expect(page.getByRole('button', { name: '한국어' })).toHaveCount(0);
await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
await expect(page.locator('[data-writing-item]')).toHaveCount(2);
await expect(page.locator('[data-writing-archive] img')).toHaveCount(0);
await expect(page.locator('[data-filter-status]')).toHaveText(statusText(2, 'All'));
```

Click Note, assert `?type=note`, one visible logical row, one history entry, and idempotence on a second Note click. Reset must return to `/writing/`, focus All, and add one history entry. Back/forward must restore Note/All. Opening `?type=essay&lang=en` must select Essay, show the Korean-original Essay, and the next interaction must emit a URL without `lang`.

Retain the dynamically cloned archive synchronization test and no-JavaScript test, changing their status expectations to type-only.

- [ ] **Step 3: Run the Writing E2E file and verify old language controls fail**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts
```

Expected: FAIL because the existing archive renders a Language fieldset, language-specific card metadata, and card-grid markup.

- [ ] **Step 4: Finalize type-only helpers and create one semantic list item**

Replace the temporary `WritingFilters` shape with `{ type: WritingTypeFilter }`. Make `filterWriting()` delegate to the article-specific type filter, and make `parseWritingFilters()` and `buildWritingSearch()` ignore all parameters except `type`. Remove `WritingLanguageFilter`.

`WritingListItem.astro` derives localized copy and locale once:

```astro
---
import { originalTranslation, type WritingArticle } from '../lib/writing';
interface Props { item: WritingArticle; headingLevel?: 2 | 3; compact?: boolean }
const { item, headingLevel = 2, compact = false } = Astro.props;
const translation = originalTranslation(item);
const Heading = headingLevel === 2 ? 'h2' : 'h3';
const locale = item.originalLanguage === 'ko' ? 'ko-KR' : 'en-US';
---
<article class:list={['writing-list-item', { 'writing-list-item--compact': compact }]}>
  <div class="writing-list-item__copy">
    <Heading><a href={`/writing/${item.slug}/`}>{translation.title}</a></Heading>
    <p>{translation.description}</p>
  </div>
  <p class="writing-list-item__meta">
    <span>{item.type === 'essay' ? 'Essay' : 'Note'}</span>
    <time datetime={item.publishedAt.toISOString()}>
      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(item.publishedAt)}
    </time>
  </p>
</article>
```

Do not render language labels or images.

- [ ] **Step 5: Reduce the filter component to Type state**

Keep only one fieldset. The script must:

- call `parseWritingFilters(window.location.search)`;
- show/hide items by `item.dataset.type` only;
- update only Type buttons;
- say `Showing N writing item(s): Type X.`;
- emit only `?type=essay` or `?type=note`;
- reset to the pathname and focus Type All;
- synchronize every archive instance on click and `popstate`;
- leave enhancement markup hidden without JavaScript.

Remove every language label map, language DOM query, `data-language`, and comparison.

- [ ] **Step 6: Render the chronological text list and retain Subscribe**

In `src/pages/writing/index.astro`, update the intro to `시간이 지나도 잊고 싶지 않은 Essay와 Note를 최신순으로 모았습니다.` Render:

```astro
<ul class="writing-list" data-writing-list>
  {writing.map((item) => (
    <li data-writing-item data-type={item.type}>
      <WritingListItem item={item} />
    </li>
  ))}
</ul>
```

Keep the current public-empty state and bottom `NewsletterSignup`. Use CSS borders and a title/copy column plus right-aligned type/date column; at narrow widths, place metadata below the title. Do not introduce cards, tinted row backgrounds, thumbnails, or a featured archive item.

Load the archive with `loadWritingArticles()`. After this task and Task 2 migrate every consumer, remove the temporary `WritingItem` original-language view and compatibility `loadWriting()` from the foundation plan.

Use this list structure as the CSS baseline:

```css
.writing-list { margin: 0; padding: 0; border-top: 1px solid var(--line); list-style: none; }
.writing-list > li { border-bottom: 1px solid var(--line); }
.writing-list-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.5rem; align-items: start; padding-block: 1.25rem; }
.writing-list-item h2, .writing-list-item h3 { margin: 0; font-size: clamp(1.1rem, 2vw, 1.45rem); font-weight: 400; line-height: 1.3; }
.writing-list-item h2 a, .writing-list-item h3 a { text-decoration: none; }
.writing-list-item__copy p { margin: .35rem 0 0; color: var(--muted); }
.writing-list-item__meta { display: grid; gap: .35rem; margin: 0; color: var(--faint); text-align: right; font: 600 .68rem/1.35 var(--sans); letter-spacing: .05em; text-transform: uppercase; }
@media (max-width: 45rem) {
  .writing-list-item { grid-template-columns: 1fr; gap: .6rem; }
  .writing-list-item__meta { display: flex; gap: .75rem; text-align: left; }
}
```

- [ ] **Step 7: Run targeted unit, E2E, accessibility, and type checks**

Run:

```bash
npm test -- tests/unit/writing.test.ts
npm run test:e2e -- tests/e2e/writing.spec.ts tests/e2e/accessibility.spec.ts
npm run check
```

Expected: all commands exit zero, two logical draft articles appear once each in development, Language controls are absent, and original-first detail tests still pass.

- [ ] **Step 8: Check obsolete component consumers before deletion**

Run:

```bash
grep -R -n --exclude-dir=node_modules --exclude-dir=.git 'WritingCard' src tests || true
grep -R -n --exclude-dir=node_modules --exclude-dir=.git 'FeaturedWriting' src tests || true
```

Do not delete `WritingCard.astro` yet if Task 2 still imports it. `FeaturedWriting.astro` remains until Task 2 removes the home import.

- [ ] **Step 9: Commit the reviewed archive**

```bash
git add src/components/WritingListItem.astro src/components/WritingFilters.astro src/pages/writing/index.astro src/styles/global.css tests/unit/writing.test.ts tests/e2e/writing.spec.ts
git commit -m "feat: simplify the writing archive"
```

---

### Task 2: Build the compact responsive person-first home

**Files:**

- Modify: `src/components/PersonalIntroduction.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/home-and-work.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Delete: `src/components/FeaturedWriting.astro`
- Delete: `src/components/WritingCard.astro` if no remaining import exists.

**Interfaces:**

- Consumes: Task 1's `WritingListItem` and foundation `WritingArticle` output.
- Produces: `BaseLayout` optional prop `bodyClass?: string`.
- Produces DOM hooks: `.home-page`, `.home-shell`, `[data-home-heading-line]`, `.hero__statement`, and `.home-writing`.

- [ ] **Step 1: Write viewport and original-copy E2E expectations first**

Extend `tests/e2e/home-and-work.spec.ts`:

```ts
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto('/');
await expect(page.getByRole('heading', { level: 1, name: 'Hello, I’m Sunwoo.' })).toBeVisible();
await expect(page.locator('[data-home-heading-line]')).toHaveCount(2);
await expect(page.getByRole('heading', { name: 'Recent writing' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
await expect(page.locator('.home-writing img')).toHaveCount(0);

const footer = await page.getByRole('contentinfo').boundingBox();
expect(footer).not.toBeNull();
expect(footer!.y + footer!.height).toBeLessThanOrEqual(720);
expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(720);
```

Do not expect the old `Latest writing`, featured card, tinted section, or language labels.

- [ ] **Step 2: Write responsive line-geometry tests**

At 1280 × 720, get both `[data-home-heading-line]` boxes and assert their vertical centers differ by at most 1 px. At 390 × 844, assert the second line's top is below the first line's bottom.

For widths 320, 390, and 1280, assert the statement has one line and no overflow:

```ts
const statement = page.locator('.hero__statement');
const metrics = await statement.evaluate((element) => {
  const style = getComputedStyle(element);
  return {
    height: element.getBoundingClientRect().height,
    lineHeight: Number.parseFloat(style.lineHeight),
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  };
});
expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 1.2);
expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
```

At 390 × 844, assert the document is taller than the viewport and can scroll to a visible footer. Retain the existing width matrix and 320 px horizontal-overflow checks.

- [ ] **Step 3: Run home and responsive E2E and verify the oversized layout fails**

Run:

```bash
npm run test:e2e -- tests/e2e/home-and-work.spec.ts tests/e2e/responsive.spec.ts
```

Expected: FAIL because the old hero/card stack exceeds 720 px, the mobile heading has no explicit second line, and the statement wraps at small widths.

- [ ] **Step 4: Add semantic heading-line hooks without changing copy**

Render the heading as:

```astro
<h1 id="personal-heading" class="hero__title">
  <span data-home-heading-line>Hello,</span>
  {' '}
  <span data-home-heading-line class="hero__identity">I’m Sunwoo.</span>
</h1>
```

Keep the eyebrow, Korean statement, and all three supporting lines verbatim. Desktop CSS keeps both spans inline; the mobile media query makes `.hero__identity` block.

- [ ] **Step 5: Replace featured cards with two recent text rows**

In `src/pages/index.astro`, remove `selectFeatured`, `FeaturedWriting`, and `WritingCard`. Load `WritingArticle[]` with `loadWritingArticles()`, use `const recent = writing.slice(0, 2)`, and render a single `.home-shell` containing `PersonalIntroduction` and a compact `Recent writing` section with `WritingListItem item={item} headingLevel={3} compact={true}`.

Retain the empty state when no public or development writing exists. Keep the archive link text `View all →`. Pass `bodyClass="home-page"` to `BaseLayout`.

- [ ] **Step 6: Add the opt-in body class and compact viewport layout**

Extend `BaseLayout` props with `bodyClass?: string` and render `<body class={bodyClass}>`.

CSS responsibilities:

- `.home-page` uses `min-height: 100svh`, flex column, and a flexible `#main-content`;
- `.home-shell` uses one container, one column, and restrained responsive vertical gaps;
- desktop hero padding is reduced from the current 5–10 rem range;
- desktop title is one visual line;
- `.hero__statement` has `white-space: nowrap`, no character-based max width, and a `clamp()` size that fits 320 px;
- supporting copy retains at least the existing 1 rem mobile size and readable line height;
- recent rows use rules, no cards, no dark feature block, and no tinted section;
- mobile header keeps all navigation links visible, with 44 px targets and compact gaps, and never becomes a hamburger;
- footer remains normal flow and fits the 1280 × 720 home acceptance viewport;
- non-home pages retain their current section spacing.

Start from these concrete rules and tune only if the geometry tests demonstrate a smaller compatible value is required:

```css
.home-page { min-height: 100svh; display: flex; flex-direction: column; }
.home-page #main-content { flex: 1; display: flex; }
.home-shell { width: min(calc(100% - 2rem), var(--content)); margin-inline: auto; display: flex; flex-direction: column; justify-content: space-between; }
.home-shell .hero { padding-block: clamp(2rem, 5vh, 3.5rem) clamp(1.5rem, 3vh, 2.5rem); }
.hero__title { max-width: none; font-size: clamp(2.75rem, 6vw, 5.25rem); white-space: nowrap; }
.hero__statement { max-width: none; margin-top: clamp(1.25rem, 3vh, 2rem); font-size: clamp(.75rem, 3.7vw, 1.75rem); letter-spacing: -.025em; white-space: nowrap; }
.home-writing { padding-bottom: clamp(1.25rem, 3vh, 2rem); }

@media (max-width: 45rem) {
  .site-header__inner { min-height: 4rem; flex-direction: row; align-items: center; gap: .5rem; }
  .site-nav { flex-wrap: nowrap; gap: .25rem; }
  .site-nav a { min-width: 2.75rem; min-height: 2.75rem; padding-inline: .2rem; }
  .hero__title { white-space: normal; }
  .hero__identity { display: block; }
  .home-page #main-content { display: block; }
  .home-shell { display: block; }
}
```

Do not copy these selectors onto About, Work, Privacy, or 404 layouts. If 320 px statement fitting requires a smaller minimum, lower only `.hero__statement` and retain at least `1rem` for `.hero__copy`.

- [ ] **Step 7: Remove dead featured and card components after a repository search**

Run the two import searches from Task 1. If both return no consumers, delete `src/components/FeaturedWriting.astro` and `src/components/WritingCard.astro`. Also remove the temporary `WritingItem`, language-filter types/helpers, original-view adapter, and `loadWriting()` only after searches prove there are no consumers. Run `npm run check` immediately to prove no unresolved import remains.

- [ ] **Step 8: Run targeted UI, accessibility, and type checks**

Run:

```bash
npm run test:e2e -- tests/e2e/home-and-work.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/shell.spec.ts
npm run check
```

Expected: all E2E files PASS; the 1280 × 720 home has no vertical scroll; mobile heading and statement geometry match the spec; all width paths have no horizontal overflow; axe has no serious or critical violations; Astro reports zero diagnostics.

- [ ] **Step 9: Commit the reviewed compact home**

```bash
git add src/components/PersonalIntroduction.astro src/components/FeaturedWriting.astro src/components/WritingCard.astro src/pages/index.astro src/layouts/BaseLayout.astro src/styles/global.css tests/e2e/home-and-work.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts
git commit -m "feat: compact the person-first homepage"
```

If a component was already deleted, `git add` records that deletion. Do not recreate it solely to satisfy the command list.

---

## Final MVP Verification Gate

After both UI tasks pass their two-stage reviews, run from the committed feature worktree:

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 npm run verify
git status --short
```

Acceptance requires:

1. `astro check` reports zero diagnostics.
2. Vitest reports zero failed tests, including generator, pairing, schema, production, asset, and link tests.
3. Source assets and built links pass.
4. The production build completes and excludes both draft starter articles.
5. The entire Playwright suite reports zero failures.
6. The working tree is clean.
7. Cumulative review against all eleven sections of the approved revision finds no unresolved gap.
8. No Cloudflare project, DNS, custom-domain, or final production `SITE_URL` work has occurred.

Only after fresh evidence for every item may the branch move to the Superpowers finishing-development-branch workflow and the final MVP confirmation step.
