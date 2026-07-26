# Secure Codespaces Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `feature/memorying-mvp` reproducible and safely resumable from a shared computer through an ephemeral GitHub Codespace, with durable agent context and a Korean operator runbook.

**Architecture:** A tracked dev-container definition restores Node, project packages, Playwright Chromium, and the private Astro preview port. Durable rules live in `AGENTS.md`, volatile progress lives in `docs/CURRENT_WORK.md`, and the shared-computer lifecycle lives in `docs/codespaces-guide.md`; a filesystem contract test prevents these recovery surfaces from silently drifting.

**Tech Stack:** GitHub Codespaces/dev containers, Node.js 22, npm, Playwright, Vitest, Markdown, Codex CLI.

## Global Constraints

- The active branch is `feature/memorying-mvp`; do not merge it into `main` or create a pull request.
- The last product-code checkpoint before continuity work is `9aed7a98020878c7ff8881a051e398efe6c30c7c`.
- Use an ephemeral browser-based Codespace and push every desired commit before deleting it.
- Keep Astro port `4321` private by default because development builds expose draft content.
- Do not commit `.env`, API keys, tokens, `auth.json`, production `SITE_URL`, or Buttondown credentials.
- Do not create Codespaces secrets for this initial MVP handoff.
- Do not perform Cloudflare, DNS, custom-domain, deployment, Notion integration, or compact-home Task 2 work in this plan.
- Preserve the existing Superpowers Subagent-Driven Development, strict TDD, per-task review, and verification workflow.
- After implementation and review, push `feature/memorying-mvp` to `origin` with upstream tracking and prove remote/local head equality.

---

## File Structure

### Create

- `.devcontainer/devcontainer.json` — reproducible Codespaces runtime and setup command.
- `AGENTS.md` — durable repository instructions automatically available to future Codex sessions.
- `docs/CURRENT_WORK.md` — mutable checkpoint and copyable resume prompt.
- `docs/codespaces-guide.md` — Korean shared-computer setup, work, and logout runbook.
- `tests/unit/codespaces-continuity.test.ts` — tracked contract for recovery files and security boundaries.

### Modify

- `README.md` — short link to the continuity checkpoint and runbook.

---

### Task 1: Add and verify the secure Codespaces handoff

**Files:**

- Create: `.devcontainer/devcontainer.json`
- Create: `AGENTS.md`
- Create: `docs/CURRENT_WORK.md`
- Create: `docs/codespaces-guide.md`
- Create: `tests/unit/codespaces-continuity.test.ts`
- Modify: `README.md`

**Interfaces:**

- Produces dev-container contract: Node.js 22 image, `npm ci && npx playwright install --with-deps chromium`, forwarded private port `4321`.
- Produces agent entrypoint: root `AGENTS.md` points to `docs/CURRENT_WORK.md` and the active approved design/plan.
- Produces human entrypoint: `README.md` points to `docs/CURRENT_WORK.md` and `docs/codespaces-guide.md`.
- Produces resumable prompt: `docs/CURRENT_WORK.md` tells a fresh Codex session to verify branch/status, read the active UI plan, and resume UI Task 2 with Subagent-Driven Development.

- [ ] **Step 1: Write the continuity contract test**

Create `tests/unit/codespaces-continuity.test.ts` using Node built-ins and Vitest. Resolve files from `process.cwd()` and test real repository contents, not mocks.

The test must assert:

```ts
const config = JSON.parse(await readFile('.devcontainer/devcontainer.json', 'utf8'));
expect(config.image).toMatch(/javascript-node:1-22-bookworm$/);
expect(config.postCreateCommand).toBe(
  'npm ci && npx playwright install --with-deps chromium',
);
expect(config.forwardPorts).toContain(4321);
expect(config.portsAttributes['4321'].visibility).toBe('private');
```

Read `AGENTS.md`, `docs/CURRENT_WORK.md`, `docs/codespaces-guide.md`, and `README.md`. Assert that:

- `AGENTS.md` names `docs/CURRENT_WORK.md`, the active compact-home UI plan, strict TDD, Subagent-Driven Development, `npm run verify`, and the Cloudflare/domain prohibition;
- `docs/CURRENT_WORK.md` names `feature/memorying-mvp`, checkpoint `9aed7a9`, completed UI Task 1, pending UI Task 2, the deferred visible-Note-row assertion, and a `Resume prompt` heading;
- `docs/codespaces-guide.md` names private/incognito browsing, branch selection, `codex login`, `codex login --device-auth`, `codex logout`, `git push`, `git status --short`, private port `4321`, and Codespace deletion only after pushing;
- `README.md` links both continuity documents;
- none of the four documents or dev-container JSON contains an OpenAI or GitHub secret-shaped assignment matching `/\b(?:OPENAI_API_KEY|CODEX_ACCESS_TOKEN|GITHUB_TOKEN)\s*=\s*\S+/`.

- [ ] **Step 2: Run the test and observe the required RED**

Run:

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
```

Expected: FAIL because the dev-container, agent instructions, checkpoint, and guide do not exist and README has no continuity links.

- [ ] **Step 3: Add the dev-container configuration**

Create strict JSON at `.devcontainer/devcontainer.json`:

```json
{
  "name": "Memorying",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",
  "postCreateCommand": "npm ci && npx playwright install --with-deps chromium",
  "forwardPorts": [4321],
  "portsAttributes": {
    "4321": {
      "label": "Memorying Astro preview",
      "onAutoForward": "notify",
      "visibility": "private"
    }
  }
}
```

Do not add secrets, environment values, public port visibility, extensions, or unrelated tools.

- [ ] **Step 4: Add durable Codex instructions**

Create root `AGENTS.md` with concise sections for:

- project purpose and person-first priority;
- bilingual writing invariants and original-first display;
- current approved spec/plan paths;
- `docs/CURRENT_WORK.md` as the first read for unfinished work;
- strict TDD, one implementer at a time, implementation → tests → review → fixes;
- required commands (`npm ci`, `npm run dev -- --host 0.0.0.0`, focused tests, `npm run verify` before completion);
- security/scope boundaries, including no secrets and no deployment/domain changes without authorization;
- preserving unrelated user changes and checking `git status --short` before/after work.

Do not put a volatile HEAD hash in `AGENTS.md`.

- [ ] **Step 5: Write the versioned current-work checkpoint**

Create `docs/CURRENT_WORK.md` in English so any agent can consume it consistently. Record:

- active branch `feature/memorying-mvp`;
- last product-code checkpoint `9aed7a9` and continuity design checkpoint `f6673f8`;
- Foundation plan complete, UI Task 1 complete, UI Task 2 pending;
- Task 1 deferred minor: directly assert one visible `[data-writing-item]` after selecting Note;
- last fresh evidence: Writing unit 21/21, Writing+accessibility E2E 16/16, Astro 0 diagnostics;
- exact approved spec and both implementation-plan paths;
- Cloudflare/domain work still not started;
- a `## Resume prompt` fenced block instructing a fresh Codex session to read `AGENTS.md`, this file, the approved compact UI plan, verify branch/status, use Superpowers Subagent-Driven Development, finish the deferred minor together with UI Task 2 when appropriate, and continue without redoing completed tasks.

State that future handoffs must update the checkpoint before pushing.

- [ ] **Step 6: Write the Korean shared-computer runbook**

Create `docs/codespaces-guide.md` with these exact lifecycle sections:

1. `작업 시작 전` — use a private/incognito window, confirm MFA, do not save passwords.
2. `Codespace 만들기` — select `feature/memorying-mvp`, create Codespace, verify `git branch --show-current` and `git status --short`.
3. `Codex 시작` — if absent, use the official `curl -fsSL https://chatgpt.com/codex/install.sh | sh`; run `codex login`, with `codex login --device-auth` fallback; never use a repository file or shell history for an API key.
4. `작업 재개` — copy the resume prompt, run focused checks, preview using `npm run dev -- --host 0.0.0.0`, keep port `4321` private.
5. `작업 종료` — run verification, inspect changes, commit, `git push`, confirm clean/tracked branch, then `codex logout`, sign out of ChatGPT and GitHub, close the private window.
6. `Codespace 삭제` — delete only after all desired work is pushed; otherwise stop it and resume later.
7. `문제 복구` — inspect creation logs, use recovery container, rebuild after fixing tracked configuration, and use GitHub's export-to-branch path if normal launch fails.

Link the official Codex CLI/auth pages and GitHub Codespaces creation, lifecycle, source-control, and security pages used in the approved design.

- [ ] **Step 7: Add the README entrypoint**

Add a compact `## Resume in Codespaces` section after Commands:

```markdown
## Resume in Codespaces

- Current implementation checkpoint: [`docs/CURRENT_WORK.md`](docs/CURRENT_WORK.md)
- Shared-computer and Codespaces runbook: [`docs/codespaces-guide.md`](docs/codespaces-guide.md)
```

Do not duplicate the full runbook in README.

- [ ] **Step 8: Run GREEN and repository checks**

Run:

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
npm run check
git diff --check
```

Expected: the continuity test passes, Astro reports zero diagnostics, and the diff has no whitespace errors.

Then parse the config independently:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('.devcontainer/devcontainer.json', 'utf8')); console.log('devcontainer JSON valid')"
```

Expected: `devcontainer JSON valid`.

- [ ] **Step 9: Review and commit the handoff**

Confirm every file matches `docs/superpowers/specs/2026-07-25-secure-codespaces-continuity-design.md`. Verify no secret-shaped assignment is present and `git status --short` contains only the six planned paths.

Commit:

```bash
git add .devcontainer/devcontainer.json AGENTS.md docs/CURRENT_WORK.md docs/codespaces-guide.md README.md tests/unit/codespaces-continuity.test.ts
git commit -m "docs: add secure Codespaces handoff"
```

---

## Remote Continuity Gate

After Task 1 passes task review and any required fix round:

1. Run `git status --short` and require empty output.
2. Run the focused continuity test and `npm run check` again from committed HEAD.
3. Push with upstream tracking:

```bash
git push -u origin feature/memorying-mvp
```

4. Compare `git rev-parse HEAD` with the SHA returned by:

```bash
git ls-remote --heads origin feature/memorying-mvp
```

5. Require exact equality before reporting that another computer can recover the work.
6. Do not push or rewrite `main`, open a pull request, create a Codespace, or change external deployment state.
