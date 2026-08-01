# Current work checkpoint

This file is the durable handoff for a fresh human or agent. Read it with `AGENTS.md` before changing the repository.

## Stable state

- Stable branch: `main`.
- The person-first bilingual Memorying MVP is merged.
- Local verification passed after the merge.
- CI-continuity is complete. Local implementation, review, GitHub platform validation, and the post-merge `main` verification all succeeded.

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
2. Resume from updated `main`.
3. Create a purpose-specific feature branch before editing.
4. Follow strict TDD and the approved Superpowers plan for implementation.
5. Run focused tests and `npm run verify` before pushing.

## Resume prompt

```text
Read AGENTS.md and docs/CURRENT_WORK.md. Run git status --short. If its output is non-empty, stop; understand the existing work on its current branch and safely commit and push it before running git switch main and git pull --ff-only origin main. Resume from updated main and create a purpose-specific feature branch before editing. Preserve the person-first bilingual writing invariants and unrelated user changes. Treat real content, Buttondown, Cloudflare Pages, the production domain, and final SITE_URL as separate projects requiring explicit scope.
```
