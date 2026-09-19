# Content-Driven Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-coded writing expectations with checks that read the repository's writing, then apply the user's Essay-to-Note conversion without touching a test.

**Architecture:** A reader helper and a rules module under `tests/support/`, used by Vitest and Playwright alike. No production code changes.

**Tech Stack:** Vitest, Playwright, `yaml`, the site's zod schemas

---

### Task 1: Reader helper (TDD)

- [x] `tests/unit/writing-content.test.ts` first: sorting, covers and alt files, fixtures, drafts, readable errors, plain sentence picking, representative picks.
- [x] Implement `tests/support/writing-content.ts`.

### Task 2: Rules (TDD)

- [x] `tests/unit/writing-rules.test.ts` first, with deliberately bad articles for every rule and one test that approves the repository itself.
- [x] Implement `tests/support/writing-rules.ts`.

### Task 3: Rewrite the checks

- [x] `tests/unit/production-writing.test.ts`, `tests/e2e/writing.spec.ts`, `home-and-work.spec.ts`, `newsletter.spec.ts`, `accessibility.spec.ts`, `responsive.spec.ts`, `layout.spec.ts`.
- [x] Full verification on the old content.

### Task 4: Apply the user's content edits

- [x] Restore the saved edits (four essays become Notes, trailing comment lines removed) and run the untouched suite.
- [x] Prove flexibility with a temporary extra article and a deliberately broken one.

### Task 5: Docs and delivery

- [x] Update `MAINTENANCE.md`, `PROJECT_STRUCTURE.md`, `docs/CURRENT_WORK.md`.
- [ ] Full verification, commits, pull request, preview, then merge as the user authorized, and confirm production.
