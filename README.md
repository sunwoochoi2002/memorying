# Memorying

[![Verify](https://github.com/sunwoochoi2002/memorying/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/sunwoochoi2002/memorying/actions/workflows/verify.yml)

Sunwoo Choi's person-first personal writing and archival site.

## Commands

```bash
npm ci
npm run dev
npm run check
npm test
npm run test:e2e
npm run build
npm run check:assets
npm run check:links
npm run verify
```

GitHub Actions runs `npm run verify` for `main` pushes and pull requests.

## Resume in Codespaces

- Current implementation checkpoint: [`docs/CURRENT_WORK.md`](docs/CURRENT_WORK.md)
- Shared-computer and Codespaces runbook: [`docs/codespaces-guide.md`](docs/codespaces-guide.md)
- Publishing and launch checklist: [`docs/publishing.md`](docs/publishing.md)

## Content

- Writing: `src/content/writing/`
- Selected Work: `src/content/work/`
- Product design: `docs/superpowers/specs/2026-07-24-memorying-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-24-memorying-mvp.md`
- Publishing and launch: `docs/publishing.md`

Production builds require the correct `SITE_URL` and `PUBLIC_BUTTONDOWN_USERNAME` values in Cloudflare Pages.
