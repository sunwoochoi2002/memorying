# Current work checkpoint

This file is the durable handoff for a fresh human or agent. Read it with `AGENTS.md` before changing the repository.

## Stable state

- Stable branch: `main`.
- The person-first bilingual Memorying MVP is merged.
- Local verification passed after the merge.
- CI-continuity is complete. Local implementation, review, GitHub platform validation, and the post-merge `main` verification all succeeded.
- The one-time Notion archive migration is complete and published on `main`.
- Convention-based optional writing covers and the root folder guide are complete.
- On 2026-09-17 the user authorized committing and pushing the Buttondown handoff checkpoint; local `main` and `origin/main` are in sync at `fd647d2`.
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

## Buttondown handoff

- A real Buttondown account has been created and email-verified by the user.
- Buttondown username: `sunwoochoi`.
- Newsletter name configured in Buttondown: `Sunwoo’s Archive`.
- Never request, store, commit, or paste the Buttondown password, authentication cookies, API keys, or subscriber email addresses.
- The existing site implementation in `src/components/NewsletterSignup.astro` is already a direct POST form. When `PUBLIC_BUTTONDOWN_USERNAME` is set, it submits to `https://buttondown.com/api/emails/embed-subscribe/<username>` and sends only `email` plus `embed=1`; Memorying does not store the address.
- No code, local environment file, Cloudflare environment variable, deployment setting, real subscription submission, email delivery, or Buttondown dashboard setting beyond the account/name above has been changed yet. In particular, do not claim that the live site is connected to Buttondown.
- Essays remain manually sent from the Buttondown dashboard; publishing a site article must never trigger an email automatically. Notes are not newsletter sends by default.

### Buttondown verification record (2026-09-17, branch `feature/buttondown-verification`)

1. A one-off local build with `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi` (environment variable only; no `.env` file was created or committed) rendered `action="https://buttondown.com/api/emails/embed-subscribe/sunwoochoi"` on all five pages that carry the form, with the Subscribe button enabled. The dev server rendered the same action.
2. GET requests (never POST) confirmed that `https://buttondown.com/sunwoochoi` serves the public page titled `Sunwoo’s Archive • Buttondown` and that the `embed-subscribe/sunwoochoi` endpoint responds by redirecting to that page. Buttondown's own public page references the same `embed-subscribe/sunwoochoi` path.
3. Automated tests still use the mock username `memorying-test` in `playwright.config.ts` and CI; the newsletter browser tests intercept the request and never reach Buttondown. No real subscription has been submitted.

### Next Buttondown work (requires explicit user approval)

1. With the user's own test email and consent, verify Buttondown's subscription, confirmation, and unsubscribe experience against a local preview started with `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi`. The user performs any real dashboard or email confirmation action.
2. After a separate Cloudflare Pages project is approved and configured, set `PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi` in Cloudflare's environment settings, then repeat the live test. Cloudflare, DNS, custom domain, and final `SITE_URL` remain separate projects.

## Next independent work

Proceed one project at a time:

1. Finish the remaining Buttondown work above: the user-performed live subscription test, then the Cloudflare environment variable once that project is approved.
2. Review or replace writing copy directly in `src/content/writing/<slug>/`; after the original-language edits are ready, request one batch translation for all affected `ko.mdx`, `en.mdx`, and any `cover.alt.*.txt` files.
3. connect Cloudflare Pages with test deployment settings;
4. choose the production domain, configure DNS, and set the final `SITE_URL`; and
5. complete post-deployment checks from `docs/publishing.md`.

Cloudflare, DNS, a custom domain, final production `SITE_URL`, Buttondown delivery, and Notion automation are not part of the CI-continuity project.

## Resume checklist

1. Run `git status --short`. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running `git switch main` and `git pull --ff-only origin main`.
2. Resume from updated `main` and create a purpose-specific feature branch before editing.
3. Follow strict TDD and the approved Superpowers plan for implementation.
4. Run focused tests and `npm run verify` before committing or pushing, including checkpoint-only changes; `tests/unit/codespaces-continuity.test.ts` asserts the wording of this file.
5. Astro 7 detects AI agent shells and starts `astro dev` in the background, which makes Playwright's `webServer` fail with `Process from config.webServer exited early`. From an agent shell run browser tests and `npm run verify` as `env -u CLAUDECODE npm run verify` (or the equivalent for that agent), and stop leftovers with `npx astro dev stop`.

## Resume prompt

```text
Read AGENTS.md and docs/CURRENT_WORK.md. Run git status --short. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running git switch main and git pull --ff-only origin main. Resume from updated main and create a purpose-specific feature branch before editing. Run verification as env -u CLAUDECODE npm run verify from an agent shell. Preserve the person-first bilingual writing invariants and unrelated user changes. The user has a verified Buttondown account with username sunwoochoi and newsletter name Sunwoo’s Archive; the site form is verified against it locally, but no live subscription test, deployment, or Cloudflare setting has been authorized. Treat the live Buttondown verification, Cloudflare Pages, the production domain, and final SITE_URL as separate projects requiring explicit scope.
```
