# Writing Test Fixtures Design

## Goal

Remove the two sample draft articles (`memorying-start`, `small-beginning`) from the real archive under `src/content/writing/` without losing the automated coverage they provided for Note filtering, English-original ordering, convention-based covers, and production draft exclusion.

## Problem

The sample drafts were the only articles with a Note type, an English original, a cover image, and `draft: true`. The four published essays are all Korean-original Essays without covers. Deleting the samples outright would silently drop browser and build verification of four product invariants.

## Scope

- Move both sample articles, unchanged, to `tests/fixtures/writing/<slug>/`.
- Load fixture articles only when the environment variable `WRITING_FIXTURES=1` is set. The default `astro dev`, `astro build`, and `npm run preview` never read `tests/fixtures/`.
- Playwright sets `WRITING_FIXTURES=1` for its own dev server. The production draft-exclusion unit test builds once with fixtures to prove drafts stay out of production output, and once without to prove fixtures never leak into a normal build.
- Keep article IDs, slugs, and URLs identical to today (`/writing/memorying-start/`) so the existing browser tests keep their meaning.
- Keep cover discovery convention-based: a fixture folder may hold `cover.*` and `cover.alt.{ko,en}.txt` exactly like a real article.

## Non-goals

- No change to the writing schema, draft semantics, home or archive presentation, or the newsletter form.
- No change to CI environment variables; Playwright and the unit test set the flag themselves.

## Verification

- Unit tests for the pure source-resolution helper: default returns only the real content directory, `WRITING_FIXTURES=1` appends the fixture directory, and the prefix stripping keeps IDs unchanged.
- The production build test proves fixture titles are absent without the flag and drafts are absent with the flag.
- The full Playwright suite passes unchanged against a fixture-enabled dev server.
- `npm run verify` passes.

## Integration

Implement on `feature/writing-test-fixtures`, open a pull request, and merge after the GitHub `Verify` run succeeds.
