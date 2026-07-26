# Memorying repository guidance

## Purpose

Memorying is Sunwoo Choi's person-first bilingual writing archive. Preserve the person-first priority; publication and product presentation are secondary.

## Writing invariants

Each writing article has `meta.yaml`, `ko.mdx`, and `en.mdx`. Keep both translations complete, preserve the declared original language, and display original-language title and description first in archive and home views. Do not regress draft exclusion, stable slugs, or original-first detail behavior.

## Approved work and continuity

For unfinished work, first read [`docs/CURRENT_WORK.md`](docs/CURRENT_WORK.md). The approved compact-home UI design is [`docs/superpowers/specs/2026-07-25-compact-home-bilingual-writing-design.md`](docs/superpowers/specs/2026-07-25-compact-home-bilingual-writing-design.md); its implementation plan is [`docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md`](docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md). The completed foundation plan is [`docs/superpowers/plans/2026-07-25-bilingual-writing-foundation.md`](docs/superpowers/plans/2026-07-25-bilingual-writing-foundation.md).

## Delivery workflow

Use strict TDD: write and observe the focused failing test before implementation, then make the smallest change green. Use Superpowers Subagent-Driven Development for approved implementation plans. Have one implementer at a time, following implementation → tests → review → fixes. Before completion, run the relevant focused tests and `npm run verify`.

Run `npm ci` for a lockfile-exact environment. Preview with `npm run dev -- --host 0.0.0.0`. Check `git status --short` before and after work, and preserve unrelated user changes.

## Security and scope

Never commit secrets, `.env` files, Codex authentication files, API keys, or tokens. Do not change deployment, Cloudflare, DNS, a custom domain, final production `SITE_URL`, Buttondown delivery, or Notion integration without explicit authorization. Keep development previews private.
