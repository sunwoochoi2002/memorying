# Current work checkpoint

This file is the durable handoff for a fresh human or agent. Read it with `AGENTS.md` before changing the repository.

## Stable state

- Stable branch: `main`.
- The person-first bilingual Memorying MVP is merged.
- Local verification passed after the merge.
- CI-continuity local implementation and review are complete. GitHub workflow acceptance, artifact execution, merge, and a successful main run remain pending platform validation.

## CI-continuity delivery gates

1. Open and accept the CI-continuity pull request, then confirm the `Verify` workflow accepts and runs on it.
2. Confirm the Playwright diagnostics artifact executes with the expected report and result paths.
3. Merge the accepted pull request into `main`.
4. Confirm the `Verify` workflow succeeds on the resulting `main` commit.
5. Make the post-main-success documentation update an explicit delivery step: record completed platform validation in this checkpoint only after the successful main run.

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

1. Run `git status --short`. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before switching or pulling.
2. Finish the pending CI-continuity delivery gates before treating it as complete.
3. Resume from updated `main`.
4. Create a purpose-specific feature branch before editing.
5. Follow strict TDD and the approved Superpowers plan for implementation.
6. Run focused tests and `npm run verify` before pushing.

## Resume prompt

```text
Read AGENTS.md and docs/CURRENT_WORK.md. Run git status --short. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running git switch main and git pull --ff-only origin main. Finish the pending CI-continuity delivery gates—workflow acceptance, artifact execution, merge, and a successful main run—and make the post-main-success documentation update before treating CI-continuity as complete. Before editing unrelated work, create a purpose-specific feature branch. Preserve the person-first bilingual writing invariants and unrelated user changes. Treat real content, Buttondown, Cloudflare Pages, the production domain, and final SITE_URL as separate projects requiring explicit scope.
```
