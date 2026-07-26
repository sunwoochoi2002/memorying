# Consistent Writing Dates and Title Wrapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display every writing date as UTC `YYYY-MM-DD` and keep Korean and English article-detail titles from breaking inside words.

**Architecture:** Add one pure `formatWritingDate(date: Date): string` function to the writing domain and make both list-row and detail metadata components consume it. Scope word-preserving CSS to `.article-header h1`, protect the behavior with Vitest and Playwright regressions, then update the durable continuity checkpoint.

**Tech Stack:** Astro 7, TypeScript 6, Vitest 4, Playwright 1.61, CSS.

## Global Constraints

- Every reader-facing published and updated writing date uses exact zero-padded UTC `YYYY-MM-DD`.
- Preserve full ISO timestamps in semantic `<time datetime="...">` attributes.
- Korean and English writing-detail titles wrap only at authored spaces.
- Apply `word-break: keep-all`, `overflow-wrap: normal`, and `hyphens: none` only to writing-detail `<h1>` elements.
- Preserve original-first bilingual rendering, the stable article URL, the language toggle, 44 px targets, and the 320 px no-overflow gate.
- Do not modify writing content, publication dates, archive filtering, deployment, Cloudflare, DNS, Buttondown, Notion, or final production `SITE_URL` work.
- Use strict TDD and complete spec-compliance plus code-quality review after each task.

---

## File Structure

### Modify

- `src/lib/writing.ts` — owns the deterministic UTC date formatter.
- `src/components/WritingListItem.astro` — uses the formatter for home and archive rows.
- `src/components/ContentMetadata.astro` — uses it for published and optional updated dates.
- `src/styles/global.css` — gives writing-detail titles word-preserving wrapping.
- `tests/unit/writing.test.ts` — verifies exact UTC formatting.
- `tests/e2e/home-and-work.spec.ts` — verifies home-row dates.
- `tests/e2e/writing.spec.ts` — verifies archive/detail dates and bilingual title wrapping.
- `tests/e2e/responsive.spec.ts` — retains the narrow-screen overflow contract.
- `docs/CURRENT_WORK.md` and `tests/unit/codespaces-continuity.test.ts` — record and enforce the reviewed checkpoint.

---

### Task 1: Unify all visible writing dates

**Files:**

- Modify: `src/lib/writing.ts`
- Modify: `src/components/WritingListItem.astro`
- Modify: `src/components/ContentMetadata.astro`
- Modify: `tests/unit/writing.test.ts`
- Modify: `tests/e2e/home-and-work.spec.ts`
- Modify: `tests/e2e/writing.spec.ts`

**Interfaces:**

- Produces: `formatWritingDate(date: Date): string` from `src/lib/writing.ts`.
- Consumes: `Date` values already normalized by the writing content layer.
- Preserves: existing `<time datetime={date.toISOString()}>` values and language annotations.

- [ ] **Step 1: Write the pure formatter expectation first**

Add `formatWritingDate` to the import list in `tests/unit/writing.test.ts`, then add:

```ts
it('formats visible writing dates as zero-padded UTC calendar dates', () => {
  expect(formatWritingDate(new Date('2026-07-24T00:30:00Z'))).toBe('2026-07-24');
  expect(formatWritingDate(new Date('2026-01-02T23:30:00-11:00'))).toBe('2026-01-03');
});
```

- [ ] **Step 2: Run the unit test and verify RED**

```bash
TZ=America/Los_Angeles npm test -- tests/unit/writing.test.ts
```

Expected: FAIL because `formatWritingDate` is not exported.

- [ ] **Step 3: Implement the minimal deterministic formatter**

Add to `src/lib/writing.ts`:

```ts
export function formatWritingDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

Do not add locale options, validation, or a second formatter.

- [ ] **Step 4: Run the unit test and verify GREEN**

```bash
TZ=America/Los_Angeles npm test -- tests/unit/writing.test.ts
```

Expected: the file passes and both assertions retain their UTC calendar dates under a negative local offset.

- [ ] **Step 5: Write visible date E2E expectations before changing components**

In `tests/e2e/home-and-work.spec.ts`, add:

```ts
await expect(
  page.locator('.home-writing .writing-list-item').filter({ hasText: 'Memorying을 시작하며' }).locator('time'),
).toHaveText('2026-07-24');
await expect(
  page.locator('.home-writing .writing-list-item').filter({ hasText: 'A small beginning' }).locator('time'),
).toHaveText('2026-07-23');
```

In the main archive test in `tests/e2e/writing.spec.ts`, add the same exact row-date assertions. In the bilingual detail test, assert the visible published metadata time is `2026-07-24`, its `datetime` remains exactly `2026-07-24T00:00:00.000Z`, and the visible date remains unchanged after switching to English.

- [ ] **Step 6: Run focused E2E and verify RED**

```bash
npm run test:e2e -- tests/e2e/home-and-work.spec.ts tests/e2e/writing.spec.ts
```

Expected: FAIL because list rows and detail metadata still use localized date strings.

- [ ] **Step 7: Make both components consume the formatter**

In `WritingListItem.astro`, import `formatWritingDate`, delete the locale constant, and render:

```astro
<time lang={item.originalLanguage} datetime={item.publishedAt.toISOString()}>
  {formatWritingDate(item.publishedAt)}
</time>
```

In `ContentMetadata.astro`, import `formatWritingDate`, remove `locale` and `formatter`, and use `formatWritingDate(item.publishedAt)` plus `formatWritingDate(item.updatedAt)` for visible text. Keep both ISO `datetime` attributes unchanged.

- [ ] **Step 8: Run Task 1 coverage and checks**

```bash
TZ=America/Los_Angeles npm test -- tests/unit/writing.test.ts
npm run test:e2e -- tests/e2e/home-and-work.spec.ts tests/e2e/writing.spec.ts
npm run check
git diff --check
```

Expected: every command exits zero and all three surfaces use `YYYY-MM-DD`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/writing.ts src/components/WritingListItem.astro src/components/ContentMetadata.astro tests/unit/writing.test.ts tests/e2e/home-and-work.spec.ts tests/e2e/writing.spec.ts
git commit -m "fix: unify visible writing dates"
```

---

### Task 2: Preserve article-detail title words

**Files:**

- Modify: `src/styles/global.css`
- Modify: `tests/e2e/writing.spec.ts`
- Verify: `tests/e2e/responsive.spec.ts`

**Interfaces:**

- Consumes: `.article-header h1` and bilingual `[data-language-fragment]` headings.
- Produces: computed `word-break: keep-all`, `overflow-wrap: normal`, and `hyphens: none` for both title languages.
- Preserves: article width, font sizing, and language-toggle DOM.

- [ ] **Step 1: Add the bilingual regression first**

Add to `tests/e2e/writing.spec.ts`:

```ts
test('wraps Korean and English detail titles only at word boundaries', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/writing/memorying-start/');

  const koreanTitle = page.locator('h1[data-language-fragment="ko"]');
  await expect(koreanTitle).toBeVisible();
  await expect(koreanTitle).toHaveCSS('word-break', 'keep-all');
  await expect(koreanTitle).toHaveCSS('overflow-wrap', 'normal');
  await expect(koreanTitle).toHaveCSS('hyphens', 'none');

  await page.getByRole('button', { name: 'English' }).click();
  const englishTitle = page.locator('h1[data-language-fragment="en"]');
  await expect(englishTitle).toBeVisible();
  await expect(englishTitle).toHaveCSS('word-break', 'keep-all');
  await expect(englishTitle).toHaveCSS('overflow-wrap', 'normal');
  await expect(englishTitle).toHaveCSS('hyphens', 'none');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts --grep "word boundaries"
```

Expected: FAIL because the current heading computes `word-break: normal` and does not explicitly disable hyphenation.

- [ ] **Step 3: Add the minimal scoped CSS**

Extend `.article-header h1` in `src/styles/global.css` with:

```css
word-break: keep-all;
overflow-wrap: normal;
hyphens: none;
```

Do not apply it to prose, archive-row headings, or the home heading.

- [ ] **Step 4: Run focused wrapping and responsive checks**

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts --grep "word boundaries"
npm run test:e2e -- tests/e2e/responsive.spec.ts tests/e2e/writing.spec.ts
npm run check
git diff --check
```

Expected: every command exits zero and 320 px pages retain at most 1 px horizontal overflow.

- [ ] **Step 5: Run the repository completion gate**

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 npm run verify
```

Expected: diagnostics, units, assets, build, links, and Playwright all pass.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css tests/e2e/writing.spec.ts
git commit -m "fix: preserve article title words"
```

---

### Task 3: Record the resumable checkpoint

**Files:**

- Modify: `tests/unit/codespaces-continuity.test.ts`
- Modify: `docs/CURRENT_WORK.md`

**Interfaces:**

- Consumes: the full Task 2 SHA printed by `git rev-parse HEAD` after Task 2.
- Produces: a handoff that records both fixes as complete and preserves final verification evidence.

- [ ] **Step 1: Capture the immutable product SHA**

```bash
git rev-parse HEAD
```

Use the returned 40-character Task 2 SHA verbatim in both modified files.

- [ ] **Step 2: Update the continuity contract first**

Replace the previous product checkpoint expectation in `tests/unit/codespaces-continuity.test.ts` with the captured SHA and add:

```ts
expect(currentWork).toMatch(/writing dates.*YYYY-MM-DD/i);
expect(currentWork).toMatch(/title.*word boundar|word.*title/i);
expect(currentWork).not.toMatch(/date.*pending|title.*pending/i);
```

Retain branch, security, full-gate, Cloudflare/domain, and resume-prompt expectations.

- [ ] **Step 3: Run the continuity test and verify RED**

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
```

Expected: FAIL because `CURRENT_WORK.md` still names the previous product checkpoint and omits these fixes.

- [ ] **Step 4: Update `docs/CURRENT_WORK.md`**

- Set `Last product-code checkpoint` to the captured Task 2 SHA.
- Record writing dates standardized to `YYYY-MM-DD` and bilingual detail-title word-boundary wrapping as complete.
- Record exact final gate counts from Task 2.
- Keep Cloudflare and domain work explicitly unstarted.
- Revise the resume prompt so a new agent does not redo these fixes and proceeds to the integration choice.

- [ ] **Step 5: Run continuity and quality checks**

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
npm run check
git diff --check
```

Expected: every command exits zero and the handoff points at the actual product SHA.

- [ ] **Step 6: Commit**

```bash
git add docs/CURRENT_WORK.md tests/unit/codespaces-continuity.test.ts
git commit -m "docs: checkpoint writing presentation fixes"
```

---

## Final Completion Gate

After every task review and fix is clean:

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 npm run verify
git status --short
git push origin feature/memorying-mvp
git ls-remote origin refs/heads/feature/memorying-mvp
```

The full gate must exit zero, the worktree must be clean, and remote SHA must equal local `HEAD`. Do not merge into `main` or create a PR without a separate user choice.
