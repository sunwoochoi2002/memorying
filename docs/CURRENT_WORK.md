# Current work checkpoint

This file is the durable handoff for a fresh human or agent. Read it with `AGENTS.md` before changing the repository.

## Stable state

- Stable branch: `main`.
- The person-first bilingual Memorying MVP is merged.
- Local verification passed after the merge.
- CI-continuity is complete. Local implementation, review, GitHub platform validation, and the post-merge `main` verification all succeeded.
- The one-time Notion archive migration is complete and published on `main`.
- Convention-based optional writing covers and the root folder guide are complete.
- On 2026-09-17 the user authorized committing and pushing the Buttondown handoff checkpoint; pull request #3 then restored a green `main`.
- Sample draft articles were moved out of the real archive into `tests/fixtures/writing/` on 2026-09-17 (pull request #4); see the fixture record below.
- The site is live in production at `https://sunwoochoi.com` (Cloudflare Pages project `memorying`, `main` branch) since 2026-09-19, with `SITE_URL=https://sunwoochoi.com`. `https://www.sunwoochoi.com` redirects to it with a 301. The earlier test address `https://memorying.pages.dev` still serves the same site but declares `sunwoochoi.com` as canonical.
- That push was made without a preceding `npm run verify`, and the `main` `Verify` run [35212577168](https://github.com/sunwoochoi2002/memorying/actions/runs/35212577168) failed on `tests/unit/codespaces-continuity.test.ts` because the test still asserted the pre-handoff checkpoint wording. Branch `feature/buttondown-verification` updates the test and this checkpoint together so `main` returns to green.

## CI-continuity delivery record

1. Pull request [#1](https://github.com/sunwoochoi2002/memorying/pull/1) ran and passed the GitHub-hosted `Verify` workflow.
2. The `playwright-diagnostics-1` artifact was created from the expected report and result paths.
3. The accepted pull request was merged into `main` as `e3a11dd`.
4. The push-triggered [`main` `Verify` run](https://github.com/sunwoochoi2002/memorying/actions/runs/30691473470) succeeded for that merge commit.
5. This checkpoint is the required post-main-success documentation update.

## Product invariants

- Each article keeps `meta.yaml`, `ko.mdx`, and `en.mdx` together under `src/content/writing/<slug>/`.
- Archive and home views show the declared original language first.
- Article detail pages switch language at one stable URL and identify the original.
- Published dates use `YYYY-MM-DD`, and bilingual titles preserve word boundaries.
- Deployment and publication remain secondary to the person-first archive.

## Notion archive and cover delivery record

1. Four reviewed Korean-original essays from the September 5, 2026 Notion export are published at stable `/writing/<slug>/` URLs: `alone`, `keep-it-up`, `time-for-change`, and `teammates`.
2. Their English counterparts are stored as complete `en.mdx` files; original-language Korean remains first on the home, archive, and detail pages.
3. A writing folder may include one optional `cover.{avif,jpeg,jpg,png,svg,webp}`. It appears only on the detail page when both `cover.alt.ko.txt` and `cover.alt.en.txt` are present. Missing files leave the article text-only.
4. [`PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md) is at the repository root and explains direct-edit locations, generated folders, and the content/translation workflow.
5. Migration and cover behavior were independently reviewed. The final `main` verification passed with 68 unit tests, type checks, asset checks, build, internal-link checks, and browser tests.

## Serif redesign record

1. On 2026-09-19 the approved design canvas "Memorying 디자인 확정안 v1" (paper `#fcfcfa`, ink `#1b1b1b`, one blue text accent `#2438d1`, Instrument Serif plus Noto Serif KR, one left-aligned 40rem column) was applied site-wide and deployed to production (pull request #8). Design: [`docs/superpowers/specs/2026-09-19-serif-redesign-design.md`](superpowers/specs/2026-09-19-serif-redesign-design.md); plan: [`docs/superpowers/plans/2026-09-19-serif-redesign.md`](superpowers/plans/2026-09-19-serif-redesign.md).
2. Content changes that came with it: article and list summaries are no longer shown (descriptions stay in meta tags), the Writing page intro sentence and every small uppercase eyebrow label are gone, the home page shows only the heading `Sunwoo’s Archive` (the Buttondown newsletter name; the header brand stays `Sunwoo Choi`) and the tagline, with `전체 글 보기` on the `Writing` heading line, and the subscribe block reads `새 에세이를 이메일로 받아 보세요.` with `새 에세이가 올라오면 남겨 주신 이메일 주소로 보내 드립니다. 구독은 언제든 취소할 수 있습니다.` The greeting paragraph removed from the home page still lives on the About page, which no longer carries the sentence "Memorying은 작업과 생각을 천천히 쌓아가는 개인적인 공간입니다."
3. Fonts are self-hosted from the OFL-1.1 Fontsource npm packages. `public/_headers` allows only same-origin resources (`default-src 'self'`), so `astro.config.mjs` sets `assetsInlineLimit: 0` and `tests/unit/production-writing.test.ts` fails if any font is inlined as a `data:` URI. Korean text uses 124 unicode-range slices (about 6 MB in `dist/_astro/`); browsers fetch only the slices a page needs.
4. Dates remain `YYYY-MM-DD` (product invariant); the demo's dotted dates were not adopted. English article text is set in Instrument Serif at 24px with extra word spacing; if it reads too dense, Newsreader was the compared alternative.
5. Known content nit, not changed: `src/content/writing/alone/ko.mdx` contains `신경쓰지는`, which standard spelling writes as `신경 쓰지는`. Content edits need the author's approval.

## Compact layout and photo covers record

1. On 2026-09-19 the user asked for a compact, centered layout modeled on yoonchulyi.com and for consistent photos. Design: [`docs/superpowers/specs/2026-09-19-compact-layout-photo-covers-design.md`](superpowers/specs/2026-09-19-compact-layout-photo-covers-design.md); plan: [`docs/superpowers/plans/2026-09-19-compact-layout-photo-covers.md`](superpowers/plans/2026-09-19-compact-layout-photo-covers.md).
2. The whole site (header, content, footer) now sits in one centered `39rem` column with a smaller type scale (home heading 48px, titles 38px, Korean prose 17px on desktop; smaller again below 45rem).
3. The user's four photos are the covers of `alone`, `keep-it-up`, `time-for-change`, and `teammates` (`cover.png` / `cover.jpeg`). Every cover sits in the same square white frame with a hairline border and `object-fit: contain`, so photos are never cropped and every article shows an identical frame.
4. The user chose empty alt text: `cover.alt.*.txt` files are now optional, and a cover without them is decorative (`alt=""`). The old rule that a cover needed both alt files is retired; covers declared in `meta.yaml` still need both alt values.
5. The user accepted publishing the photos as they are, including a Slack screenshot naming a work channel and colleague, a photo of two other people, and a lyrics screenshot. The raised concerns (workplace information, consent of people shown, lyrics copyright) were recorded, not resolved; revisit if any of them changes.
6. Known trade-off: wide screenshots shrink inside the square frame, so small text is hard to read on phones. A tap-to-enlarge viewer could be added later.

## Maintenance guide record

1. `MAINTENANCE.md` (root, Korean) is the user's routine-operations guide: new writing, edits, Essay and Note switching, hiding and deleting, photos, dates, non-writing copy, newsletter sending, the deploy flow with Cloudflare preview URLs, rollback, and what needs a conversation first. `tests/unit/maintenance-guide.test.ts` keeps it from rotting (commands, metadata fields, headings, README link).
2. The trap first documented there (tests hard-coded the four essays, so publishing a new one failed `verify`) was removed by the content-driven checks below.

## Content-driven checks record

1. On 2026-09-20 the user asked for flexible checks: define the rules once, look only at the writing that exists in the repository, and approve it when it follows the rules. Design: [`docs/superpowers/specs/2026-09-20-content-driven-checks-design.md`](superpowers/specs/2026-09-20-content-driven-checks-design.md); plan: [`docs/superpowers/plans/2026-09-20-content-driven-checks.md`](superpowers/plans/2026-09-20-content-driven-checks.md).
2. `tests/support/writing-content.ts` reads every article folder (real content, plus the fixtures for browser tests) into plain data. `tests/support/writing-rules.ts` holds the rules and returns readable Korean problem messages; it reuses the site's own zod schemas so it cannot drift from the build.
3. Browser specs loop over whatever articles exist and compare each with its own files (title, date, type, original language, cover, alt text, subscription form); `tests/unit/production-writing.test.ts` compares the built site with the published set. No test names a real article any more. Fixtures still guarantee that at least one Essay, one Note, one Korean original, one English original, one cover, and one draft exist for the browser tests.
4. Proof: the refactored tests passed on the old content (97 unit, 92 browser), passed unchanged after the four essays became Notes, and passed after a temporary published English-original Essay with a cover was added and removed. A deliberately broken article (a `[Draft]` marker on published writing) failed with that article named.
5. On 2026-09-20 the user converted `alone`, `keep-it-up`, `teammates`, and `time-for-change` from Essay to Note and removed the trailing "댓글은 카톡으로…" lines from `time-for-change`. Consequences: no article page shows the subscribe block any more (it appears on Essays only) and the Writing Essay filter is empty until an Essay exists.

## Newsletter template record

1. On 2026-09-20 the user asked for one minimal, consistent email format and a sturdier way to send it. The user chose: original-language body only, no cover photo in the email, and Notes allowed like Essays.
2. `scripts/newsletter.mjs` (`npm run newsletter -- <slug> [--lang ko|en]`) builds the email from the article files: subject is the chosen-language title; body is the article Markdown unchanged; a fixed footer follows (`---`, `웹에서 읽기 · Read on the web`, the canonical `https://sunwoochoi.com/writing/<slug>/` URL from `SITE_URL`, `Sunwoo Choi`). It prints the subject and writes the body to the git-ignored `.newsletter/<slug>.<lang>.md`. It refuses drafts, unknown or unsafe slugs, unsupported languages, and MDX-only syntax.
3. `tests/unit/newsletter.test.ts` covers the template and also builds a mail for every published real article, so it needs no change when writing is added. Sending stays manual in the Buttondown dashboard; nothing calls the Buttondown API and no Buttondown setting was changed. The welcome email (sent right after subscribing) is a separate Buttondown setting and was not touched.

## Writing test fixtures record

1. The user intentionally deleted the two sample drafts (`memorying-start`, a Korean-original Essay with a cover, and `small-beginning`, an English-original Note) from `src/content/writing/` so the archive holds only real writing.
2. Those samples were the only articles exercising Note filtering, English-original ordering, convention-based covers, and production draft exclusion, so they now live unchanged under `tests/fixtures/writing/<slug>/`.
3. `src/lib/writing-sources.ts` resolves the content directories; `src/content.config.ts` reads `tests/fixtures/writing/` only when `WRITING_FIXTURES=1`. Playwright's dev server sets the flag; `tests/unit/production-writing.test.ts` builds once without it (fixtures never loaded) and once with it (drafts still excluded).
4. Known cosmetic side effect: the tiny fixture `cover.svg` is discovered by an eager `import.meta.glob` and is emitted as an unreferenced asset in `dist/_astro/` even in default builds. Nothing links to it.
5. Design: [`docs/superpowers/specs/2026-09-17-writing-test-fixtures-design.md`](superpowers/specs/2026-09-17-writing-test-fixtures-design.md); plan: [`docs/superpowers/plans/2026-09-17-writing-test-fixtures.md`](superpowers/plans/2026-09-17-writing-test-fixtures.md).

## Buttondown handoff

- A real Buttondown account has been created and email-verified by the user.
- Buttondown username: `sunwoochoi`.
- Newsletter name configured in Buttondown: `Sunwoo’s Archive`.
- Never request, store, commit, or paste the Buttondown password, authentication cookies, API keys, or subscriber email addresses.
- The existing site implementation in `src/components/NewsletterSignup.astro` is already a direct POST form. When `PUBLIC_BUTTONDOWN_USERNAME` is set, it submits to `https://buttondown.com/api/emails/embed-subscribe/<username>` and sends only `email` plus `embed=1`; Memorying does not store the address.
- No code, local environment file, or Buttondown dashboard setting beyond the account/name above has been changed. The only deployment-side change is the `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi` variable in the Cloudflare Pages project, so the deployed form at `https://sunwoochoi.com` submits to the real account.
- Essays remain manually sent from the Buttondown dashboard; publishing a site article must never trigger an email automatically. Notes are not newsletter sends by default.

### Buttondown verification record (2026-09-17, branch `feature/buttondown-verification`)

1. A one-off local build with `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi` (environment variable only; no `.env` file was created or committed) rendered `action="https://buttondown.com/api/emails/embed-subscribe/sunwoochoi"` on all five pages that carry the form, with the Subscribe button enabled. The dev server rendered the same action.
2. GET requests (never POST) confirmed that `https://buttondown.com/sunwoochoi` serves the public page titled `Sunwoo’s Archive • Buttondown` and that the `embed-subscribe/sunwoochoi` endpoint responds by redirecting to that page. Buttondown's own public page references the same `embed-subscribe/sunwoochoi` path.
3. Automated tests still use the mock username `memorying-test` in `playwright.config.ts` and CI; the newsletter browser tests intercept the request and never reach Buttondown. No real subscription has been submitted.

4. On 2026-09-17 the user ran the live test themselves from a local preview started with `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi` and confirmed the subscription, confirmation email, and unsubscribe flow with their own test email. The Buttondown form verification project is complete.

5. On 2026-09-18 the deployed `https://memorying.pages.dev/writing/` form renders `action="https://buttondown.com/api/emails/embed-subscribe/sunwoochoi"` with the Subscribe button enabled. A live subscription from the deployed site has not been repeated; the local live test above used the identical form action.

## Cloudflare Pages test deployment record

1. On 2026-09-18 the user created the Cloudflare Pages project `memorying` from the dashboard (Pages → Connect to Git, not the Workers flow with `npx wrangler deploy`), connected `sunwoochoi2002/memorying`, production branch `main`, build command `npm run build`, output directory `dist`.
2. Plain-text environment variables set in Cloudflare: `NODE_VERSION=22`, `SITE_URL=https://sunwoochoi.com` (initially `https://memorying.pages.dev`, changed on 2026-09-19), `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi`. No secrets exist or are needed; never request a Cloudflare API token.
3. Post-deployment checks passed with GET requests only: home, about, writing, work, privacy, and the four essays return 200; unknown paths and the fixture-only `/writing/memorying-start/` return 404; `sitemap-index.xml` and `sitemap-0.xml` list exactly the nine public pages under `https://memorying.pages.dev`; canonical and `og:url` use that origin; no page mentions `localhost`.
4. `public/_headers` is applied: the security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are present on HTML, and `/_astro/*` assets return `cache-control: public, max-age=31536000, immutable`.
5. The user owns `sunwoochoi.com` and made it the production domain; see the record below.

### Production domain record (2026-09-18 to 2026-09-19)

1. `sunwoochoi.com` is registered at Gabia. Because Gabia cannot serve a CNAME at the zone apex, the zone was added to Cloudflare (Full DNS) and the nameservers at Gabia were changed to the two Cloudflare nameservers assigned to the zone. Propagation completed within a day.
2. The user added `sunwoochoi.com` and `www.sunwoochoi.com` under the Pages project's Custom domains, replacing Gabia's parking A record. The user does not use email at `@sunwoochoi.com`, so no MX records exist or are needed.
3. The user created the Cloudflare Redirect Rule from the "Redirect from WWW to root" template: `https://www.sunwoochoi.com/*` to `https://sunwoochoi.com/${1}` with status 301. Paths and query strings are preserved.
4. The user changed `SITE_URL` to `https://sunwoochoi.com` and retried the deployment. On 2026-09-19 GET checks confirmed: `http://` redirects to `https://`; `www` redirects to the apex (for example `/writing/alone/` and `/writing/?type=essay` keep their path and query); home, about, writing, work, privacy, and the four essays return 200; an unknown path returns 404; canonical, `og:url`, and all nine sitemap entries use `https://sunwoochoi.com`; no page mentions `pages.dev` or `localhost`; the CSP and other security headers and the immutable `/_astro/*` cache header are present; the form action is `https://buttondown.com/api/emails/embed-subscribe/sunwoochoi` with an enabled button.
5. Not yet done: a live subscription test from the deployed `https://sunwoochoi.com` form (the local test and the identical form action are verified), and the remaining launch checklist in `docs/publishing.md`.
6. Never ask for Gabia or Cloudflare credentials; the user performs every registrar and dashboard action.

## Next independent work

Proceed one project at a time:

1. With the user's own test email, run one live subscribe, confirm, and unsubscribe test from `https://sunwoochoi.com` (the user performs it), then finish the remaining launch checklist in `docs/publishing.md`.
2. Review or replace writing copy directly in `src/content/writing/<slug>/` (now only the four real essays); after the original-language edits are ready, request one batch translation for all affected `ko.mdx`, `en.mdx`, and any `cover.alt.*.txt` files.
3. Optionally submit `https://sunwoochoi.com/sitemap-index.xml` to Google Search Console and Naver Search Advisor (the user owns those accounts).

Buttondown delivery and Notion automation remain separate projects. The Cloudflare Pages project, the `sunwoochoi.com` DNS zone, and `SITE_URL` are live production settings; changing any of them needs explicit authorization.

## Resume checklist

1. Run `git status --short`. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running `git switch main` and `git pull --ff-only origin main`.
2. Resume from updated `main` and create a purpose-specific feature branch before editing.
3. Follow strict TDD and the approved Superpowers plan for implementation.
4. Run focused tests and `npm run verify` before committing or pushing, including checkpoint-only changes; `tests/unit/codespaces-continuity.test.ts` asserts the wording of this file.
5. Astro 7 detects AI agent shells and starts `astro dev` in the background, which makes Playwright's `webServer` fail with `Process from config.webServer exited early`. From an agent shell run browser tests and `npm run verify` as `env -u CLAUDECODE npm run verify` (or the equivalent for that agent), and stop leftovers with `npx astro dev stop`.

## Resume prompt

```text
Read AGENTS.md and docs/CURRENT_WORK.md. Run git status --short. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running git switch main and git pull --ff-only origin main. Resume from updated main and create a purpose-specific feature branch before editing. Run verification as env -u CLAUDECODE npm run verify from an agent shell. Preserve the person-first bilingual writing invariants and unrelated user changes. The user has a verified Buttondown account with username sunwoochoi and newsletter name Sunwoo’s Archive; the live subscribe/confirm/unsubscribe flow is verified. The site is live in production at https://sunwoochoi.com on Cloudflare Pages (SITE_URL=https://sunwoochoi.com, PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi, www redirects to the apex; domain registered at Gabia with Cloudflare nameservers). Treat any change to the Cloudflare project, DNS, SITE_URL, or redirect rule as a production change requiring explicit scope; never ask for Cloudflare, Gabia, or Buttondown credentials.
```
