# Notion archive migration design

## Purpose

Bring the four writing entries from the one-time Notion export into Memorying as the first visible articles in the working prototype. The archive remains person-first and bilingual: Korean is the source and original language, and English is a faithful, natural draft that preserves the original meaning and voice.

## Scope

The source export stays intact at `docs/imports/notion-archive-2026-09-05/`. It includes the Notion landing page, two database CSV exports, four Korean article Markdown files, and a landing-page image. The source materials are migration evidence only and must not be loaded by the site.

Create these article slugs under `src/content/writing/`:

- `teammates`
- `time-for-change`
- `keep-it-up`
- `alone`

Each directory contains the required `meta.yaml`, `ko.mdx`, and `en.mdx` files. Korean bodies retain the exported article text. English bodies and titles are new translation drafts that preserve the Korean voice rather than translating mechanically.

## Metadata and presentation

Each entry is an `essay`, declares `originalLanguage: ko`, uses the exported publication date normalized to `YYYY-MM-DD`, is not featured, and has `draft: false`. Therefore the entries appear in the writing archive and homepage prototype while continuing to render Korean titles and descriptions first.

Notion tags are intentionally omitted because the current content model has no tag field. The exported PNG is associated with the Notion archive landing page rather than a specific article, so no imported article receives a cover image.

## Validation

Focused tests will assert that all four new public articles form complete Korean--English pairs, have valid metadata and stable slugs, keep Korean as their original language, and appear in the public writing data in original-first order. Existing draft-exclusion behavior remains covered by the established suite.

The implementation will run the focused tests and `npm run verify` before handoff.
