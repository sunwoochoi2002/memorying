# Serif Redesign Design

## Goal

Give Memorying a quiet, serif-led minimal look that no longer reads as a template: a neutral paper ground, one blue text accent, a left-aligned single reading column, and self-hosted typefaces that render the same on every device. The approved reference is the Claude design canvas "Memorying 디자인 확정안 v1" (Korean and English boards for Home, Writing, and Article).

## Decisions taken from the approved demo

- **Ground and ink:** paper `#fcfcfa`, ink `#1b1b1b`, muted `#6a6a6a`, one accent `#2438d1` used only for text points (dates, section labels, current navigation item, selected filter, subscribe button, link hover). No cards, gradients, shadows, or radii.
- **Type:** Instrument Serif for Latin display and UI text; Noto Serif KR (variable) for Hangul and Korean reading text. Korean prose is set at 19px/2; English prose in Instrument Serif at 24px/1.7 because the face is compact.
- **Layout:** header spans the container; content is one left-aligned column of 40rem starting at the header's left edge (gutter 96px at 1280px, shrinking on small screens).
- **Home:** name `Sunwoo Choi`, the existing tagline, then a `Writing` heading with `전체 글 보기` on the same line at the right edge of the list. No eyebrow, no greeting paragraph (the About page keeps the greeting).
- **Writing:** title, plain text filters, list rows of date, title, and type. The sentence "시간이 지나도 잊고 싶지 않은 Essay와 Note를 최신순으로 모았습니다." is removed.
- **Summaries:** article descriptions are no longer shown in lists or on article pages. They stay in `<meta name="description">` and social tags.
- **Subscribe block:** no box; hairline above, heading `새 에세이를 이메일로 받아 보세요.`, copy `새 에세이가 올라오면 남겨 주신 이메일 주소로 보내 드립니다. 구독은 언제든 취소할 수 있습니다.` plus the Privacy link, and an underlined email field with a text `Subscribe` button.

## Deliberate differences from the demo

- Dates stay `YYYY-MM-DD` (a product invariant); the demo showed dots.
- The language toggle keeps its accessible names `한국어 Original` and `English` so behavior and tests are unchanged; only styling changes.
- `← Back to Writing` stays at the end of an article as a quiet text link.
- No English UI mode is added: the site still has one UI language plus the per-article language toggle. The English boards in the demo were a typography check.
- Pages the demo did not cover (About, Work, Privacy, 404) inherit the new tokens and drop their small uppercase eyebrow labels.

## Constraints

- `public/_headers` sets `default-src 'self'`, so fonts must be same-origin and must not be inlined as `data:` URIs. Vite is configured with `assetsInlineLimit: 0` and a build test asserts no `data:` font URLs.
- Fonts come from the OFL-1.1 Fontsource npm packages (`@fontsource/instrument-serif`, `@fontsource-variable/noto-serif-kr`), pinned by the lockfile, so builds need no runtime font service. Korean text uses the package's 124 unicode-range slices; browsers download only the slices a page needs.
- Person-first bilingual invariants stay: original-language titles first, stable URLs, draft exclusion, one URL per article, working language toggle, no-JavaScript fallback.
- Touch targets stay at least 44px and keyboard focus keeps the visible ring.

## Non-goals

Dark mode, an English UI mode, content edits, routing changes, and the newsletter delivery flow.

## Verification

Browser and unit tests are updated first to encode the new design and observed failing. Then `env -u CLAUDECODE npm run verify` passes, screenshots of every page at 1280px and 390px are reviewed against the demo, and the GitHub `Verify` run passes before the user decides on merge. Merging deploys to `https://sunwoochoi.com`.
