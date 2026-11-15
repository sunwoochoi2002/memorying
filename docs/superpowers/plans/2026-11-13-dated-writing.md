# Date-based Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browse all writing by publishedAt with a separate dated draft area and one organizing command.

**Architecture:** Keep leaf folder names as slugs. Read nested content and locate scripts' inputs recursively; organize whole article folders using metadata after preflight validation.

**Tech Stack:** Astro, TypeScript, Node ESM, yaml, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-dated-writing-design.md`

## Global Constraints

- Work directly on main; no push, branches, or deployment.
- Preserve article bytes, stable URLs, bilingual completeness, draft exclusion, and original-language display.
- Preserve both initially untracked articles as untracked files.
- Run npm ci and strict TDD, focused checks and npm run verify.

## Review Focus

- Duplicate slugs across dates or draft areas must be rejected, including scaffold attempts.
- An existing unrelated destination folder must never be overwritten or merged.
- Invalid calendar dates fail before movement or draft creation.
- Publication and date metadata edits must be repairable by a repeatable organizer; metadata controls visibility before organizing too.
- Images, extra attachments, untracked articles, and flat test fixtures survive migration intact.

### Task 1: Implement and migrate the complete storage contract

This is one cohesive task because loading, script lookup, test discovery and physical migration must agree before the site can build.

**Files:**
- Modify `src/lib/writing.ts`, `src/lib/content.ts`, `tests/support/writing-content.ts`, `scripts/new-writing.mjs`, `scripts/newsletter.mjs`, `package.json`.
- Create `scripts/organize-writing.mjs` and, if useful, a shared `scripts/writing-directories.mjs` for filesystem discovery and validation.
- Tests: `tests/unit/writing.test.ts`, `tests/unit/new-writing.test.ts`, `tests/unit/newsletter.test.ts`, `tests/unit/writing-content.test.ts`, new `tests/unit/organize-writing.test.ts`, and other tests affected by path assumptions.
- Move all real article folders; update `docs/MAINTENANCE.md`, `docs/PROJECT_STRUCTURE.md`, `docs/MARKDOWN_GUIDE.md`, `docs/CURRENT_WORK.md` and active README examples as needed. Historical plans need no rewrite.

**Interfaces:**
- Existing `getWritingSourceId(entry)` returns `<slug>/<language>` for flat and nested source paths; `getWritingMetaSourceId(entry)` returns the leaf slug.
- Existing `createWritingDraft({root,slug,originalLanguage,publishedAt})` returns the draft's dated path and refuses duplicate global slugs or occupied targets.
- Existing `buildNewsletter({root,slug,...})` finds a unique article recursively and continues refusing drafts.
- Export `organizeWriting({root})` from organizer for tests; CLI prints moved paths and rejects unsafe plans before any rename. Discovery must ignore hidden directories and symlinks.

- [ ] Record hashes of every writing file keyed by article slug and relative file path; run npm ci.
- [ ] Add focused tests asserting nested IDs, recursive content discovery, dated draft creation and global duplicate refusal, nested newsletter lookup, organizing flat/misdated/draft-state-edited folders, repeated no-op runs, invalid dates, duplicate slugs and occupied-target preflight without partial movement.
- [ ] Run the tests and record expected RED evidence.
- [ ] Implement the smallest compatible loader, discovery, script and cover glob changes, with shared filesystem logic only where it reduces repetition.
- [ ] Run focused tests and confirm GREEN.
- [ ] Run organizer on real writing; compare every file hash and article count with the saved snapshot.
- [ ] Update author instructions for creating, publishing, changing dates and organizing; update checkpoint.
- [ ] Run `npm run verify` with agent-shell background behavior disabled as needed; record results.
- [ ] Self-review the diff and report for independent review. Do not commit or stage the user's previously untracked articles. Leave the complete change uncommitted for inspection.
