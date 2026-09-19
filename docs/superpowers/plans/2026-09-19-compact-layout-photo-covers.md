# Compact Layout and Photo Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved compact centered layout, the consistent square photo frame, and optional alt files, then publish the user's four photos as covers.

**Architecture:** `global.css` gets a 39rem centered `.container` and a smaller type scale. `collectAutomaticWritingCovers` no longer requires alt files. `.writing-cover` becomes an `aspect-ratio: 1 / 1` frame with an absolutely positioned `object-fit: contain` image. No markup changes beyond the cover sizes hint.

**Tech Stack:** Astro 7, plain CSS, Vitest, Playwright

## Global Constraints

- Keep `YYYY-MM-DD` dates, the accessible names of the language toggle, and every bilingual invariant.
- Never crop or stretch photos.
- Stage only intended files; the originals of the four photos are included on purpose.
- Strict TDD; run `env -u CLAUDECODE npm run verify` before committing.

---

### Task 1: Tests first (RED)

- [ ] `tests/unit/writing-covers.test.ts`: optional alt files, partial alt, empty alt.
- [ ] `tests/e2e/layout.spec.ts`: centered column geometry and type scale.
- [ ] `tests/e2e/writing.spec.ts`: update sizes and cover counts; add the same-size square frame test for the four real covers.
- [ ] `tests/e2e/home-and-work.spec.ts`, `responsive.spec.ts`: update heading sizes.

### Task 2: Cover logic

- [ ] Make alt files optional in `src/lib/writing-covers.ts`; update the cover `sizes` hint in `WritingLayout.astro`.

### Task 3: Styles

- [ ] Rewrite `src/styles/global.css` for the compact column, the type scale, and the square frame.

### Task 4: Photos and docs

- [ ] Rename the four photos to `cover.*`; update `PROJECT_STRUCTURE.md`, `docs/CURRENT_WORK.md`.

### Task 5: Verify and integrate

- [ ] Full verification, screenshots at 1280px and 390px, pull request, GitHub `Verify` and Cloudflare preview, then ask the user before merging.
