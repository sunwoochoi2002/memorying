# CI and Main-Branch Continuity Design

## Purpose

Make the merged Memorying MVP safe to resume from `main` and automatically verify every change that reaches `main` or targets it through a pull request. This work corrects stale handoff guidance and adds continuous verification without starting deployment, DNS, Buttondown delivery, or production environment configuration.

## Scope

This change has two responsibilities:

1. add one GitHub Actions workflow that runs the repository's existing full verification command; and
2. update the repository's handoff and shared-computer documentation to describe the post-MVP `main`-based workflow.

The implementation remains intentionally small. It does not add branch protection, Cloudflare deployment, preview deployments, release automation, scheduled runs, dependency-update automation, or production secrets.

## CI Workflow

Create `.github/workflows/verify.yml` with a single `verify` job.

The workflow runs on:

- pushes to `main`;
- pull requests whose base branch is `main`; and
- manual `workflow_dispatch` runs.

The workflow uses `ubuntu-latest`, `actions/checkout@v6`, and `actions/setup-node@v6` with Node.js 22 and npm caching. It installs the lockfile-exact dependency tree with `npm ci`, installs only Chromium and its Linux dependencies with `npx playwright install --with-deps chromium`, and runs `npm run verify` as the single project verification entry point.

The job has a 20-minute timeout. Workflow permissions are limited to `contents: read`. A concurrency group derived from the workflow and pull-request number or Git ref cancels an older in-progress run when a newer commit supersedes it.

The CI environment uses only non-secret test values:

- `CI=true`;
- `SITE_URL=http://localhost:4321`;
- `PUBLIC_BUTTONDOWN_USERNAME=memorying-test`; and
- `TZ=America/Los_Angeles` to retain the existing cross-time-zone date regression coverage.

After verification, `actions/upload-artifact@v5` uploads `playwright-report/` and `test-results/` when the run was not cancelled. Missing paths are ignored because failures before the browser phase may legitimately produce no Playwright output. Artifacts are retained for seven days.

Update `playwright.config.ts` so CI uses one worker and emits both GitHub annotations and an HTML report with `open: 'never'`. Local development keeps the existing list reporter and normal worker selection. This makes the uploaded HTML path real while preserving readable inline failures in Actions.

## Documentation Responsibilities

### `docs/CURRENT_WORK.md`

Replace the obsolete pre-merge checkpoint with a durable post-MVP handoff:

- identify `main` as the stable resume branch;
- state that the MVP has been merged and fully verified;
- name CI and continuity as the current initiative until this work lands;
- list real content, Buttondown, Cloudflare Pages, and the production domain as subsequent independent work;
- avoid hard-coding a commit SHA that immediately becomes stale; and
- provide a resume prompt that starts from `main`, checks local/remote state, and creates a feature branch before new changes.

### `docs/codespaces-guide.md`

Update the shared-computer workflow to:

- create the Codespace from `main`;
- run `npm ci` for a lockfile-exact environment;
- verify the current branch, worktree status, and synchronization with `origin/main`;
- create a purpose-specific feature branch before editing;
- run `npm run verify` before committing and pushing; and
- retain the existing private-preview, credential, logout, and Codespace cleanup safeguards.

### `README.md`

Use `npm ci` as the recommended setup command, link to the current handoff and publishing guides, and expose the new verification workflow status. Existing product and publishing references remain intact when their targets exist.

## Verification Design

Update `tests/unit/codespaces-continuity.test.ts` so it protects durable operating behavior instead of a retired feature branch and exact historical SHA. Its assertions cover `main` as the resume base, feature-branch creation before editing, lockfile-exact setup, verification before push, status checks, private preview guidance, and credential cleanup.

Add `yaml` as a direct development dependency and create `tests/unit/ci-workflow.test.ts`. The test parses the real workflow and verifies its semantic configuration: approved triggers, read-only permissions, concurrency cancellation, Node 22, npm caching, exact install and verification commands, test-only environment values, timeout, and diagnostic artifact behavior. Parsing the artifact avoids brittle line-order checks.

Extend the configuration coverage to assert that CI selects one Playwright worker and produces both GitHub and HTML reports. The full verification run then proves that this configuration remains executable with the existing browser suite.

Use strict TDD:

1. change the continuity assertions and add the workflow-contract test;
2. observe both fail because the docs are stale and the workflow is absent;
3. make the smallest documentation and workflow changes that satisfy them;
4. run focused unit tests;
5. run `npm run verify`; and
6. review the complete diff independently.

After the feature branch is pushed, confirm that GitHub accepts the workflow and that its first real run completes. A local YAML test does not replace this platform-level validation.

## Failure Handling

- Dependency or verification failure stops the job and prevents a green result.
- A superseded run is cancelled rather than consuming unnecessary minutes.
- Browser diagnostics remain downloadable when available.
- Missing Playwright artifact paths do not mask the original earlier-stage failure.
- No workflow step writes to the repository, deploys the site, or accesses production credentials.

## Completion Criteria

The work is complete when:

- the updated continuity and workflow-contract tests pass;
- `npm run verify` passes locally;
- an independent review finds no merge-blocking issues;
- the feature branch exists on GitHub and the real Actions workflow is accepted;
- the approved changes are merged to `main`; and
- the `main` workflow run finishes successfully.

## References

- GitHub Actions workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- `actions/setup-node`: https://github.com/actions/setup-node
- Playwright continuous integration: https://playwright.dev/docs/ci
