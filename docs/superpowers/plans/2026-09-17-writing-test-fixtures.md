# Writing Test Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the sample draft articles as test-only fixtures under `tests/fixtures/writing/` that load only when `WRITING_FIXTURES=1`, so the real archive holds only real writing while every existing invariant stays verified.

**Architecture:** A pure helper resolves the list of writing source directories from the environment. `src/content.config.ts` globs from the repository root with a brace pattern over those directories and strips the directory prefix before generating IDs, so entry IDs and slugs are unchanged. Cover discovery adds the fixture directory to its `import.meta.glob` patterns; covers attach by slug, so fixture covers are inert when fixtures are not loaded.

**Tech Stack:** Astro 7 content layer (`glob` loader), Vitest, Playwright

## Global Constraints

- Fixture files are byte-identical copies of the former sample articles.
- Default builds and dev servers must not read `tests/fixtures/`.
- IDs (`memorying-start/ko`), slugs, and URLs are unchanged.
- Strict TDD; run `env -u CLAUDECODE npm run verify` before committing.

---

### Task 1: Move the samples to fixtures

- [x] `git restore` both deleted folders from `HEAD`, then `git mv` them to `tests/fixtures/writing/`.

### Task 2: Source-directory helper (TDD)

**Files:** Create `src/lib/writing-sources.ts`, `tests/unit/writing-sources.test.ts`

- [x] Failing tests: `resolveWritingSourceDirectories({})` → `['src/content/writing']`; with `WRITING_FIXTURES: '1'` → both directories; `createWritingGlobPattern(dirs, 'meta.(yaml|yml)')` → single-dir and brace forms; `stripWritingSourceDirectory('tests/fixtures/writing/x/ko.mdx', dirs)` → `x/ko.mdx`, unknown prefix throws.
- [x] Implement the minimal helper.

### Task 3: Wire the content collections

**Files:** Modify `src/content.config.ts`, `src/lib/content.ts`, `playwright.config.ts`

- [x] Use `base: '.'` with the brace pattern for `writing` and `writingMeta`; strip the prefix in `generateId`.
- [x] Add the fixture cover patterns to both `import.meta.glob` calls.
- [x] Set `WRITING_FIXTURES: '1'` in the Playwright web server env.
- [x] Run the newsletter and writing browser specs and verify GREEN.

### Task 4: Production build proof (TDD)

**Files:** Modify `tests/unit/production-writing.test.ts`

- [x] Build without the flag: real essays present, fixture titles and routes absent.
- [x] Build with `WRITING_FIXTURES=1` and `NODE_ENV=production`: drafts still absent from home, archive, routes, and sitemap.

### Task 5: Documentation

**Files:** Modify `PROJECT_STRUCTURE.md`, `docs/CURRENT_WORK.md`

- [x] Explain `tests/fixtures/writing/` and the flag in the folder guide.
- [x] Record the completed cleanup in the checkpoint.

### Task 6: Verify and integrate

- [x] `env -u CLAUDECODE npm run verify`, commit, push, pull request, GitHub `Verify` green, merge.
