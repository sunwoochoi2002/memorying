# About, Projects, and Experience

The user approved the proposed four-page navigation and requested complete local implementation and a working preview. This document records that approved design and the subsequent source-copy requirements.

## Intent and presentation

Keep the person-first bilingual writing archive. Navigation is About, Writing, Projects, Experience. Keep the 39rem centered column, serif typography, paper/ink/blue palette. On narrow screens place navigation below the name instead of crowding or shrinking it.

- About: existing bilingual intro unchanged; Selected Affiliations shows four roles/institutions and dates, with no descriptions or disclosure controls. The user asked to keep the earlier yoonchulyi.com-style timeline: entries stay newest first, joined by one vertical line with a node per entry. Preserve underlying military description even though the compact list does not show it.
- Projects: text-led bilingual list of Sunwoo’s Archive, JARVIS, BERA; project names lead, related awards remain in project descriptions. No speculative new research project pages, images, or fabricated roles/results.
- Experience: Education; Work & Research; Activities & Leadership; Awards. Add anchor navigation to these sections. Keep chronological entries within sections, bilingual descriptions, native disclosures for longer details, and English headings/titles. Education contains POSTECH (major/minors/coursework), TU Delft, LG Aimers. Move GSSC into Activities. Other research, activities and standalone awards remain represented. JARVIS/BERA award narratives belong in Projects, not duplicated in Experience.
- Existing /work/ remains a usable legacy route to /projects/. No deployment configuration changes.

## Copy contract

Source: docs/resume.md. For every overlapping public entry use the original English description as closely/verbatim as possible; translate to natural Korean preserving proper names. Strip resume-list markup, dates, and location metadata from descriptions when separately represented; do not rewrite descriptions to sound more impressive or personal. Preserve exact English coursework names, including the source's unconfirmed `Introduction to Date Analysis`; do not silently correct it.

Explicit exceptions: preserve intro exactly in both languages and military wording from the starting profile. For content genuinely absent from resume, such as CES 2026, preserve the starting profile wording. Sunwoo’s Archive is absent from resume and profile: retain its existing work English and supply a faithful Korean translation.

Dates are not being re-researched: preserve current public dates where overlapping resume dates are stale, open-ended, or contradictory (including TU Delft). Do not introduce GPA, grades, portrait, contact/private data, unpublished source PDFs, or unconfirmed ongoing employment. The scope is reorganizing the public archive, not publishing the entire private resume.

## Data and resilience

Use Astro content collections and strict bilingual schemas consistent with the repository. Keep authored copy in YAML, not in page templates. Make direct-edit locations clear in Korean README guidance. Each item has one canonical detailed home; About is a summary only. Both translations remain complete, language toggling works on all three pages, and Korean descriptions remain usable without JavaScript.

Writing content, stable URLs, draft exclusion, and original-first behavior remain unchanged. Preserve all pre-existing user edits. Do not commit, push, publish, or change live integrations. Deliver a private local preview and verification results.

## Acceptance

Tests must demonstrate compact About, four navigation destinations, all migrated content, original English fidelity for resume descriptions, source exceptions, complete translations, education, anchor navigation, project names and awards, legacy Work access, language toggling, no-JS content, mobile overflow, and accessibility. Run npm ci, focused tests, npm run verify, then inspect desktop and mobile screenshots and start a fixture-free local preview.
