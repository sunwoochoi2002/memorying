# Current work checkpoint

This file is the durable handoff for a fresh human or agent. Read it with `AGENTS.md` before changing the repository.

## Stable state

- Stable branch: `main`.
- The person-first bilingual Memorying MVP is merged.
- Local verification passed after the merge.
- CI and main-branch continuity are complete: `.github/workflows/verify.yml` runs the full verification gate for `main` and pull requests.

## Product invariants

- Each article keeps `meta.yaml`, `ko.mdx`, and `en.mdx` together under `src/content/writing/<slug>/`.
- Archive and home views show the declared original language first.
- Article detail pages switch language at one stable URL and identify the original.
- Published dates use `YYYY-MM-DD`, and bilingual titles preserve word boundaries.
- Deployment and publication remain secondary to the person-first archive.

## Next independent work

Proceed one project at a time:

1. replace starter copy with reviewed real content and migrate the one-time Notion archive;
2. configure and test the real Buttondown account;
3. connect Cloudflare Pages with test deployment settings;
4. choose the production domain, configure DNS, and set the final `SITE_URL`; and
5. complete post-deployment checks from `docs/publishing.md`.

Cloudflare, DNS, a custom domain, final production `SITE_URL`, Buttondown delivery, and Notion automation are not part of the CI-continuity project.

## Resume checklist

1. Confirm `git status --short` is understood before changing files.
2. Resume from updated `main`.
3. Create a purpose-specific feature branch before editing.
4. Follow strict TDD and the approved Superpowers plan for implementation.
5. Run focused tests and `npm run verify` before pushing.

## Resume prompt

```text
Read AGENTS.md and docs/CURRENT_WORK.md. Run git status --short, then run git switch main and git pull --ff-only origin main. Confirm the Memorying MVP and CI-continuity work are already complete; do not redo them. Before editing, create a purpose-specific feature branch. Preserve the person-first bilingual writing invariants and unrelated user changes. Treat real content, Buttondown, Cloudflare Pages, the production domain, and final SITE_URL as separate projects requiring explicit scope.
```
