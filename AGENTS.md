# Memorying repository guidance

## Purpose

Memorying is Sunwoo Choi's person-first bilingual writing archive. Preserve the person-first priority; publication and product presentation are secondary.

## Writing invariants

Each writing article has `meta.yaml`, `ko.md`, and `en.md`. Keep both translations complete, preserve the declared original language, and display the original-language title first in archive and home views. Writing has no `description` field; do not add one. Do not regress draft exclusion, stable slugs, or original-first detail behavior.

## Grammar review skill

Whenever the user asks to check grammar, spelling, spacing, typos, or proofread writing (including “문법 확인”, “맞춤법 검사”, “띄어쓰기 검토”, “오타 확인”), read and follow [`skills/review-grammar/SKILL.md`](skills/review-grammar/SKILL.md) before reviewing. This is a required project skill even when it is absent from the session's skill catalog. Review is read-only: report suspected errors and minimal suggestions in chat; never edit the writing or produce a complete rewritten version. The author makes the corrections. Do not infer editing permission from a review request.

Markdown writing reference: [`docs/MARKDOWN_GUIDE.md`](docs/MARKDOWN_GUIDE.md).

## Approved work and continuity

For unfinished work, first read [`docs/CURRENT_WORK.md`](docs/CURRENT_WORK.md). The approved compact-home UI design is [`docs/superpowers/specs/2026-07-25-compact-home-bilingual-writing-design.md`](docs/superpowers/specs/2026-07-25-compact-home-bilingual-writing-design.md); its implementation plan is [`docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md`](docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md). The completed foundation plan is [`docs/superpowers/plans/2026-07-25-bilingual-writing-foundation.md`](docs/superpowers/plans/2026-07-25-bilingual-writing-foundation.md).

## Delivery workflow

Use strict TDD: write and observe the focused failing test before implementation, then make the smallest change green. Use Superpowers Subagent-Driven Development for approved implementation plans. Have one implementer at a time, following implementation → tests → review → fixes. Before completion, run the relevant focused tests and `npm run verify`. Work directly on `main` without feature branches or pull requests; pushing to `main` deploys production, so push only after `npm run verify` passes and the user approves the deploy (see `docs/MAINTENANCE.md` section 4).

Run `npm ci` for a lockfile-exact environment. Preview with `npm run dev -- --host 0.0.0.0`. Check `git status --short` before and after work, and preserve unrelated user changes.

## Security and scope

Never commit secrets, `.env` files, Codex authentication files, API keys, or tokens. Do not change deployment, Cloudflare, DNS, a custom domain, final production `SITE_URL`, Buttondown delivery, or Notion integration without explicit authorization. Keep development previews private.
