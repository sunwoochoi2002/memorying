# CI and Main-Branch Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically run Memorying's complete verification gate for changes to `main` and make every human or agent resume from accurate `main`-based documentation.

**Architecture:** One read-only GitHub Actions job installs the lockfile-exact Node 22 environment, installs Chromium, and invokes the repository's existing `npm run verify` boundary. Parsed workflow tests protect the CI contract, while focused continuity tests protect durable operational guidance without pinning obsolete commit SHAs.

**Tech Stack:** GitHub Actions, Node.js 22, npm, Astro 7, Vitest 4, Playwright 1.61, YAML 2.9

## Global Constraints

- Run CI on pushes to `main`, pull requests targeting `main`, and manual `workflow_dispatch` runs.
- Use one `ubuntu-latest` job with a 20-minute timeout and `contents: read` permissions only.
- Use `actions/checkout@v6`, `actions/setup-node@v6`, Node.js 22, npm caching, `npm ci`, and `npx playwright install --with-deps chromium`.
- Invoke `npm run verify` as the only project verification command in CI.
- Set only non-secret test values: `CI=true`, `SITE_URL=http://localhost:4321`, `PUBLIC_BUTTONDOWN_USERNAME=memorying-test`, and `TZ=America/Los_Angeles`.
- Cancel superseded runs for the same pull request or Git ref.
- Upload `playwright-report/` and `test-results/` with `actions/upload-artifact@v5`, ignore missing paths, and retain artifacts for seven days.
- Use one Playwright worker in CI and emit GitHub annotations plus an HTML report; retain local list reporting and normal worker selection.
- Resume shared-computer work from `main`, run `npm ci`, and create a purpose-specific feature branch before editing.
- Do not add branch protection, deployment, Cloudflare, DNS, production `SITE_URL`, Buttondown delivery, production secrets, scheduled automation, or dependency-update automation.

---

### Task 1: Add the parsed CI contract and verification workflow

**Files:**
- Create: `.github/workflows/verify.yml`
- Create: `tests/unit/ci-workflow.test.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the existing `npm run verify` command and Playwright's `CI` environment behavior.
- Produces: a parsed `verify.yml` contract and a CI Playwright configuration with `workers: 1` and GitHub plus HTML reporters.

- [ ] **Step 1: Add the direct YAML test dependency**

Run:

```bash
npm install --save-dev yaml@2.9.0
```

Expected: `yaml` appears in `devDependencies`, and the lockfile records version 2.9.0.

- [ ] **Step 2: Write the failing workflow and Playwright configuration tests**

Create `tests/unit/ci-workflow.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

const readRepositoryFile = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

describe('GitHub Actions verification workflow', () => {
  it('runs the complete read-only verification contract for main and pull requests', async () => {
    const workflow = parse(await readRepositoryFile('.github/workflows/verify.yml'));
    const job = workflow.jobs.verify;
    const steps = job.steps as Array<Record<string, any>>;
    const setupNode = steps.find((step) => step.uses === 'actions/setup-node@v6');
    const artifact = steps.find((step) => step.uses === 'actions/upload-artifact@v5');

    expect(workflow.on.push.branches).toEqual(['main']);
    expect(workflow.on.pull_request.branches).toEqual(['main']);
    expect(workflow.on).toHaveProperty('workflow_dispatch');
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    expect(workflow.concurrency.group).toContain('github.event.pull_request.number || github.ref');

    expect(job['runs-on']).toBe('ubuntu-latest');
    expect(job['timeout-minutes']).toBe(20);
    expect(job.env).toMatchObject({
      CI: 'true',
      SITE_URL: 'http://localhost:4321',
      PUBLIC_BUTTONDOWN_USERNAME: 'memorying-test',
      TZ: 'America/Los_Angeles',
    });

    expect(steps).toContainEqual({ uses: 'actions/checkout@v6' });
    expect(setupNode?.with).toMatchObject({
      'node-version': '22',
      cache: 'npm',
      'cache-dependency-path': 'package-lock.json',
    });
    expect(steps).toContainEqual({ name: 'Install dependencies', run: 'npm ci' });
    expect(steps).toContainEqual({
      name: 'Install Chromium',
      run: 'npx playwright install --with-deps chromium',
    });
    expect(steps).toContainEqual({ name: 'Run verification', run: 'npm run verify' });

    expect(artifact?.if).toContain('!cancelled()');
    expect(artifact?.with.path).toContain('playwright-report/');
    expect(artifact?.with.path).toContain('test-results/');
    expect(artifact?.with['if-no-files-found']).toBe('ignore');
    expect(artifact?.with['retention-days']).toBe(7);
  });
});

describe('Playwright CI diagnostics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses one worker and emits GitHub plus HTML reports in CI', async () => {
    vi.stubEnv('CI', 'true');
    vi.resetModules();
    const { default: config } = await import('../../playwright.config');

    expect(config.workers).toBe(1);
    expect(config.reporter).toEqual([
      ['github'],
      ['html', { open: 'never' }],
    ]);
  });
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/unit/ci-workflow.test.ts
```

Expected: FAIL because `.github/workflows/verify.yml` does not exist. If Vitest continues to the configuration test, it also reports that `workers` is not 1 or that the reporter is still `github` only.

- [ ] **Step 4: Create the minimal GitHub Actions workflow**

Create `.github/workflows/verify.yml`:

```yaml
name: Verify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      CI: 'true'
      SITE_URL: http://localhost:4321
      PUBLIC_BUTTONDOWN_USERNAME: memorying-test
      TZ: America/Los_Angeles
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
          cache: npm
          cache-dependency-path: package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Install Chromium
        run: npx playwright install --with-deps chromium
      - name: Run verification
        run: npm run verify
      - name: Upload Playwright diagnostics
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v5
        with:
          name: playwright-diagnostics-${{ github.run_attempt }}
          path: |
            playwright-report/
            test-results/
          if-no-files-found: ignore
          retention-days: 7
```

- [ ] **Step 5: Enable stable CI Playwright diagnostics**

Change the relevant top-level fields in `playwright.config.ts` to:

```ts
fullyParallel: true,
workers: process.env.CI ? 1 : undefined,
retries: process.env.CI ? 2 : 0,
reporter: process.env.CI
  ? [
      ['github'],
      ['html', { open: 'never' }],
    ]
  : 'list',
```

Do not change projects, base URL, trace behavior, web server behavior, or Buttondown's test username.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
npm test -- tests/unit/ci-workflow.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 7: Verify the test dependency and diff**

Run:

```bash
npm ls yaml --depth=0
git diff --check
```

Expected: `yaml@2.9.0` is direct and no whitespace errors are reported.

- [ ] **Step 8: Commit Task 1**

```bash
git add .github/workflows/verify.yml tests/unit/ci-workflow.test.ts playwright.config.ts package.json package-lock.json
git commit -m "ci: verify main and pull requests"
```

### Task 2: Replace stale feature-branch handoff guidance

**Files:**
- Modify: `tests/unit/codespaces-continuity.test.ts`
- Modify: `docs/CURRENT_WORK.md`
- Modify: `docs/codespaces-guide.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the `Verify` workflow produced by Task 1 and the existing private Codespaces container contract.
- Produces: a durable `main`-based resume workflow for humans and agents, plus a visible link to the remote verification status.

- [ ] **Step 1: Replace brittle continuity expectations with the new operating contract**

Keep the existing devcontainer test unchanged. In the second test, preserve the `AGENTS.md`, credential, private-preview, logout, and recovery assertions, but replace feature-specific and historical-checkpoint assertions with:

```ts
expect(currentWork).toMatch(/stable branch.*`main`/i);
expect(currentWork).toMatch(/MVP.*merged/i);
expect(currentWork).toMatch(/CI.*continuity.*complete/i);
expect(currentWork).toMatch(/real content.*Buttondown.*Cloudflare Pages.*domain/is);
expect(currentWork).not.toContain('feature/memorying-mvp');
expect(currentWork).not.toContain('8865a80d36eeffca09252f1f4f4fc1f9a062ab6e');

const resumePrompt = currentWork.slice(currentWork.indexOf('## Resume prompt'));
expect(resumePrompt).toContain('git switch main');
expect(resumePrompt).toContain('git pull --ff-only origin main');
expect(resumePrompt).toContain('git status --short');
expect(resumePrompt).toMatch(/feature branch/i);

expect(guide).toMatch(/`main`.*Codespace|Codespace.*`main`/i);
expect(guide).toContain('npm ci');
expect(guide).toContain('git switch main');
expect(guide).toContain('git pull --ff-only origin main');
expect(guide).toContain('git switch -c feature/next-writing-update');
expect(guide).toContain('npm run verify');
expect(guide).not.toContain('feature/memorying-mvp');

expect(readme).toContain('npm ci');
expect(readme).toContain('actions/workflows/verify.yml/badge.svg?branch=main');
expect(readme).toContain('docs/CURRENT_WORK.md');
expect(readme).toContain('docs/codespaces-guide.md');
expect(readme).toContain('docs/publishing.md');
```

Remove the old exact test-count, product checkpoint SHA, finished UI-task, and final-MVP-integration assertions. They describe a historical moment rather than a durable operating contract.

- [ ] **Step 2: Run the focused continuity test and verify RED**

Run:

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
```

Expected: FAIL because `CURRENT_WORK.md` and `codespaces-guide.md` still instruct resuming `feature/memorying-mvp`, and README lacks `npm ci` plus the workflow badge.

- [ ] **Step 3: Replace `docs/CURRENT_WORK.md` with the post-MVP checkpoint**

Use this content:

````markdown
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
````

- [ ] **Step 4: Update `docs/codespaces-guide.md` for `main`-based work**

Keep the existing security, Codex login/device-auth, private port 4321, logout, deletion, and recovery sections. Replace the Codespace creation and resume instructions with this sequence:

````markdown
## Codespace 만들기

GitHub에서 이 저장소의 기본 `main` 브랜치로 Codespace를 만드세요. 컨테이너 생성 명령은 `npm ci`와 Chromium 설치를 자동 실행합니다. 완료 후 아래 명령으로 상태를 확인합니다.

```bash
git status --short
git switch main
git pull --ff-only origin main
npm ci
```

수정 전에는 작업 목적을 나타내는 새 브랜치를 만드세요. 예를 들어 다음 글을 준비한다면:

```bash
git switch -c feature/next-writing-update
```

## 작업 재개

`AGENTS.md`와 `docs/CURRENT_WORK.md`를 읽고 Resume prompt를 새 Codex 세션에 붙여 넣으세요. 변경 전 focused test를 정하고 strict TDD로 진행합니다. 미리보기는 아래처럼 실행하고 포트 `4321`은 private으로 유지하세요.

```bash
npm run dev -- --host 0.0.0.0
```

## 작업 종료

focused test와 전체 검증을 실행합니다.

```bash
npm run verify
git status --short
```

변경 범위를 확인하고 커밋한 뒤 feature 브랜치를 push하세요. 원격 반영을 확인한 다음 `codex logout`을 실행하세요. Codespace를 중지하거나 삭제하기 전에는 항상 `codex logout`을 실행하세요. 이어서 ChatGPT와 GitHub에서 로그아웃하고 private 창을 닫습니다.
````

- [ ] **Step 5: Update README setup and CI visibility**

Add this badge immediately below `# Memorying`:

```markdown
[![Verify](https://github.com/sunwoochoi2002/memorying/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/sunwoochoi2002/memorying/actions/workflows/verify.yml)
```

Replace `npm install` with `npm ci` in the command block. Under `Resume in Codespaces`, retain the current two links and add:

```markdown
- Publishing and launch checklist: [`docs/publishing.md`](docs/publishing.md)
```

State that GitHub Actions runs `npm run verify` for `main` pushes and pull requests. Keep the production `SITE_URL` and `PUBLIC_BUTTONDOWN_USERNAME` note unchanged.

- [ ] **Step 6: Run the focused continuity test and verify GREEN**

Run:

```bash
npm test -- tests/unit/codespaces-continuity.test.ts
```

Expected: 2 tests pass, including the unchanged private devcontainer contract.

- [ ] **Step 7: Run complete local verification**

Run:

```bash
PUBLIC_BUTTONDOWN_USERNAME=memorying-test SITE_URL=http://localhost:4321 CI=1 TZ=America/Los_Angeles npm run verify
```

Expected: Astro diagnostics, all unit tests, the source asset gate, production build, built-link check, and all Playwright tests pass. CI Playwright output also creates `playwright-report/`.

- [ ] **Step 8: Check scope and commit Task 2**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only Task 2's four files remain uncommitted.

Commit:

```bash
git add tests/unit/codespaces-continuity.test.ts docs/CURRENT_WORK.md docs/codespaces-guide.md README.md
git commit -m "docs: resume safely from main"
```

## Post-Implementation Delivery Gates

After both tasks pass task-scoped reviews and the final whole-branch review:

1. push `feature/ci-continuity` to GitHub;
2. open a pull request targeting `main`, which is the first platform-level parse and execution of the new workflow;
3. confirm the `Verify` check completes successfully;
4. merge only after user approval;
5. confirm the subsequent `main` push also completes the `Verify` workflow; and
6. keep branch protection, Cloudflare, DNS, and production secrets outside this project.
