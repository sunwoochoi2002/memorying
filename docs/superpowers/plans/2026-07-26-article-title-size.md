# Article Title Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Korean and English writing-detail titles by 20% without changing their responsive behavior or word-boundary wrapping.

**Architecture:** Keep the existing shared `.article-header h1` rule because both language fragments use it. Protect the user-visible size through Playwright at the mobile clamp boundary, then change only the three `clamp()` font-size values.

**Tech Stack:** Astro 7, CSS, Playwright 1.61

## Global Constraints

- Change only the `h1` elements inside `.article-header`.
- Use `font-size: clamp(2.08rem, 5.6vw, 4rem)`.
- Preserve `word-break: keep-all`, `overflow-wrap: normal`, and `hyphens: none`.
- Apply the same computed size to Korean and English title fragments.
- Do not change homepage, Writing archive, or Work page headings.

---

### Task 1: Reduce bilingual article-detail titles

**Files:**
- Modify: `tests/e2e/writing.spec.ts`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: article-detail headings selected by `h1[data-language-fragment="ko"]` and `h1[data-language-fragment="en"]`
- Produces: a shared responsive article-title font size of `clamp(2.08rem, 5.6vw, 4rem)`

- [ ] **Step 1: Write the failing browser assertion**

Extend `wraps Korean and English detail titles only at word boundaries` at the existing 320 px viewport:

```ts
await expect(koreanTitle).toHaveCSS('font-size', '33.28px');
// After selecting English:
await expect(englishTitle).toHaveCSS('font-size', '33.28px');
```

The literal is hand-derived from `2.08rem × 16px = 33.28px`; at 320 px, the preferred `5.6vw` value is below the clamp minimum.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts --grep "wraps Korean and English detail titles"
```

Expected: FAIL because the existing minimum computes to `41.6px`, not `33.28px`.

- [ ] **Step 3: Implement the minimal CSS change**

In `src/styles/global.css`, change only the font size in `.article-header h1`:

```css
.article-header h1 {
  font-size: clamp(2.08rem, 5.6vw, 4rem);
}
```

Leave all other declarations in the rule unchanged.

- [ ] **Step 4: Verify GREEN and the unchanged wrapping contract**

Run:

```bash
npm run test:e2e -- tests/e2e/writing.spec.ts --grep "wraps Korean and English detail titles"
```

Expected: PASS for both language sizes, existing word-boundary properties, and horizontal overflow protection.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm run verify
```

Expected: Astro check, unit tests, asset check, build, link check, and all Playwright tests pass without errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add tests/e2e/writing.spec.ts src/styles/global.css
git commit -m "style: reduce article title size"
```
