# Consistent Writing Dates and Title Wrapping Design

**Date:** 2026-07-26

## Goal

Make every reader-facing writing date use one language-neutral format and ensure bilingual article titles wrap only at word boundaries.

## Scope

- Home recent-writing rows
- Writing archive rows
- Writing detail metadata, including published and optional updated dates
- Korean and English titles in the writing detail header
- Focused unit and browser regression coverage

This change does not alter content files, publication dates, language-switching behavior, archive filtering, deployment, Cloudflare, DNS, Buttondown, or the final production `SITE_URL`.

## Date presentation

All reader-facing writing dates use the exact UTC format `YYYY-MM-DD`, including zero-padded month and day. For example:

- `2026-07-24`
- `2026-07-23`

A single pure writing-date formatter owns this rule. Home/archive list rows and writing-detail metadata consume the same formatter rather than choosing a locale independently. The formatter uses UTC calendar fields so output cannot shift with the machine or browser timezone.

The existing semantic `<time datetime="...">` values remain full ISO timestamps. Only the visible text changes.

## Detail-title wrapping

Korean and English `<h1>` elements in the writing detail header share one wrapping rule:

- preserve words with `word-break: keep-all`;
- disable emergency mid-word wrapping with `overflow-wrap: normal`;
- disable automatic hyphenation with `hyphens: none`.

Titles therefore wrap at authored spaces. The rule is scoped to writing-detail titles and does not change prose, archive-row titles, or the compact home heading.

## Verification

Strict TDD applies.

1. Add a unit test for exact UTC `YYYY-MM-DD` output, including a timestamp whose local calendar date could differ from UTC.
2. Add browser assertions that home rows, archive rows, and detail metadata show the expected zero-padded format and no legacy localized date text.
3. Add browser coverage for both Korean and English detail titles at a narrow viewport. Verify the intended computed wrapping properties and retain the existing no-horizontal-overflow gate.
4. Run the focused tests, Astro diagnostics, and the repository-wide `npm run verify` gate before completion.

## Success criteria

- No reader-facing writing date varies by original language.
- All visible published and updated writing dates match `^\d{4}-\d{2}-\d{2}$`.
- Korean and English detail titles do not break inside a word.
- The bilingual stable URL and language toggle continue to work.
- The 320 px layout has no horizontal overflow.
