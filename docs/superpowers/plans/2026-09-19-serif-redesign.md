# Serif Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved serif-led minimal design (see the design spec) to the whole site without changing content, routes, or bilingual behavior.

**Architecture:** Fontsource CSS is imported once in `BaseLayout.astro`. `src/styles/global.css` is rewritten around new tokens. Markup changes are limited to removing summaries and eyebrows, restructuring the home heading row, the newsletter block, and the article column wrapper. The list row keeps its DOM order and is rearranged visually with CSS grid.

**Tech Stack:** Astro 7, plain CSS, Fontsource, Vitest, Playwright

## Global Constraints

- Keep `YYYY-MM-DD` dates, original-first titles, and the accessible names of the language toggle.
- Fonts are self-hosted and never inlined as `data:` URIs.
- Strict TDD; run `env -u CLAUDECODE npm run verify` before committing.
- Do not touch `public/_headers`, deployment settings, or content files.

---

### Task 1: Encode the design in tests (RED)

- [ ] Update `tests/e2e/home-and-work.spec.ts`, `responsive.spec.ts`, `writing.spec.ts`, `newsletter.spec.ts`, and `tests/unit/production-writing.test.ts` for the new home, list, article, subscribe copy, type sizes, font loading, and no-`data:`-font build rule.
- [ ] Run them and confirm they fail for the expected reasons.

### Task 2: Fonts and build config

- [ ] `npm install @fontsource/instrument-serif @fontsource-variable/noto-serif-kr`.
- [ ] Import their CSS in `BaseLayout.astro`; set `vite.build.assetsInlineLimit` to `0` in `astro.config.mjs`.

### Task 3: Markup

- [ ] `PersonalIntroduction.astro`, `index.astro`, `WritingListItem.astro`, `WritingLayout.astro`, `NewsletterSignup.astro`, `writing/index.astro`, `about.astro`, `work.astro`, `privacy.astro`, `404.astro`, `SiteFooter.astro`.

### Task 4: Styles

- [ ] Rewrite `src/styles/global.css` with the new tokens, layout, list rows, filters, article, subscribe block, and responsive rules.

### Task 5: Verify and integrate

- [ ] Green tests, screenshots at 1280px and 390px for every page, `env -u CLAUDECODE npm run verify`, update `docs/CURRENT_WORK.md` and `PROJECT_STRUCTURE.md` if needed, commit, push, pull request, GitHub `Verify` green, then ask the user before merging.
