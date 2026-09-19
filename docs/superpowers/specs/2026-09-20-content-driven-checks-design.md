# Content-Driven Checks Design

## Goal

Make the automated checks flexible. The rules are defined once, the checks read only the writing that exists in the repository, and any article that follows the rules is approved. Adding, renaming, converting, or hiding an article must never require a test change.

## Problem

Several tests named the four real essays, counted six list items (four essays plus two fixtures), listed the writing folders, and asserted exact titles and dates. Publishing a new essay, renaming one, or converting essays to notes failed `verify` even though the site was fine.

## Design

- **Reader:** `tests/support/writing-content.ts` turns every article folder (real content, plus test fixtures when requested) into plain data: metadata, both translations, cover file and optional alt text, files present. It sorts newest first with a slug tie-break, the same as the site, and reports missing files as readable errors.
- **Rules:** `tests/support/writing-rules.ts` returns a list of Korean problem messages, one per broken rule, naming the article. It reuses the site's own zod schemas for metadata and translations, so it cannot drift from the build. Rules: slug shape, valid type and language, both translations present with non-empty title, description, and body, each translation in its own script, no draft markers, generated placeholder text, or future date on published writing, featured only on Essays and at most one published, at most one cover, alt files only with a cover, and photos that the site would silently ignore.
- **Browser checks:** specs loop over the articles found and compare each page with its own files. The dev server shows drafts and loads fixtures, so those are part of the expected archive. Costly checks (accessibility, responsive widths) use one article with a cover and one without, or one per kind.
- **Build checks:** the production-build test derives the published set from the files and verifies the archive, home list (newest six), routes, and sitemap, and that drafts and fixtures never leak.
- **Fixtures stay:** they guarantee at least one Essay, Note, Korean original, English original, cover, and draft exist so every behavior is exercised even when the real content lacks it.

## Not changed

Site behavior, copy, and the design tests for non-writing pages, which still assert their own fixed copy.

## Verification

Helper and rules have their own unit tests, including deliberately bad articles. The refactored suite must pass on the old content, then pass unchanged with the user's Note conversion applied, and a temporary extra article must also pass.
