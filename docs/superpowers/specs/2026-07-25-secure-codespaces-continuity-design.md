# Secure Codespaces Continuity Design

## 1. Purpose

Sunwoo must be able to stop work on a personal MacBook and resume the same Memorying feature branch from a shared computer without relying on local chat history, an unpushed worktree, or credentials stored on that computer.

The durable source of truth is the GitHub repository. A fresh GitHub Codespace created from the active feature branch must contain enough configuration and written context for a new Codex session to reconstruct the current state and continue the approved Superpowers workflow.

## 2. Chosen approach

Use an ephemeral, browser-based GitHub Codespace created from `feature/memorying-mvp`.

This is preferable to installing the project and Codex directly on a shared computer because the development filesystem and CLI credentials stay inside the remote Codespace rather than the shared host. It is preferable to remotely accessing the MacBook because resumption does not depend on the MacBook remaining powered on or reachable.

The feature branch, not local session state, is the recovery boundary. Every work period ends with verification, a commit, and a push before the Codespace is deleted.

## 3. Repository changes

### `.devcontainer/devcontainer.json`

Provide a reproducible Codespaces environment with:

- a Node.js 22 development-container image;
- `npm ci` for lockfile-exact project dependencies;
- local Playwright Chromium plus its Linux dependencies;
- forwarded Astro port `4321`, kept private by default;
- no embedded tokens, API keys, account names, or production environment values.

The setup command must fail if dependency installation fails. It must not silently continue with a partial environment.

### `AGENTS.md`

Give every new Codex session durable repository instructions:

- Memorying is a person-first bilingual writing archive; publication is secondary;
- each article has `meta.yaml`, `ko.mdx`, and `en.mdx`, with original-first display;
- the active design and implementation plan paths;
- Subagent-Driven Development, strict TDD, task review, and verification requirements;
- no Cloudflare, DNS, custom-domain, or final production `SITE_URL` work without explicit authorization;
- read `docs/CURRENT_WORK.md` before resuming unfinished work;
- never commit `.env`, Codex authentication files, API keys, or tokens.

`AGENTS.md` contains durable rules only. Volatile commit hashes and task status belong in `docs/CURRENT_WORK.md`.

### `docs/CURRENT_WORK.md`

Act as the versioned checkpoint for a new human or agent. Record:

- the active branch and current checkpoint commit;
- completed Foundation tasks and UI Task 1;
- the pending compact-home UI Task 2;
- the deferred Task 1 minor assertion;
- the exact relevant design and plan paths;
- the last fresh verification evidence;
- a copyable first prompt for a new Codex session;
- a rule to update this file before every handoff.

The checkpoint may name the commit immediately preceding the continuity commit and explain that the continuity commit follows it. This avoids a self-referential commit hash that changes whenever the document is committed.

### `docs/codespaces-guide.md`

Provide the human runbook in Korean. It covers:

1. opening a private/incognito browser window on the shared computer;
2. enabling MFA and signing in to GitHub;
3. creating a Codespace specifically from `feature/memorying-mvp`;
4. confirming the checked-out branch and clean status;
5. installing Codex with the current official installer only when `codex` is absent;
6. signing in with `codex login`, or `codex login --device-auth` when the callback flow is unavailable;
7. pasting the resume prompt from `docs/CURRENT_WORK.md`;
8. previewing with `npm run dev -- --host 0.0.0.0` and using the forwarded private port;
9. ending each work period with verification, commit, and push;
10. running `codex logout`, signing out of GitHub, closing the private window, and deleting the Codespace only after all desired commits are pushed.

The runbook explicitly forbids entering an API key into a tracked file, committing `~/.codex/auth.json`, exposing the preview port publicly, or deleting a Codespace with unpushed work.

### `README.md`

Add a short “Resume in Codespaces” entry pointing to the two continuity documents. Keep detailed instructions out of the README.

## 4. State and data flow

```text
MacBook worktree
  -> verify
  -> commit to feature/memorying-mvp
  -> push to origin/feature/memorying-mvp
  -> create Codespace from that exact branch
  -> dev container restores tools and dependencies
  -> Codex reads AGENTS.md and docs/CURRENT_WORK.md
  -> continue Task 2
  -> verify, commit, and push before ending the session
```

Git commits preserve code and design history. `docs/CURRENT_WORK.md` preserves the current operational checkpoint. `AGENTS.md` preserves durable agent behavior. No attempt is made to serialize or commit a private Codex conversation.

## 5. Security model

- Prefer a private/incognito browser window and never allow the shared browser to save passwords.
- Use ChatGPT browser authentication for interactive Codex work; do not paste an API key into shell history or repository files.
- Codex credentials may be cached inside the remote Codespace during the session. `codex logout` clears the active CLI credentials before the Codespace is stopped or deleted.
- Sign out of both GitHub and ChatGPT in the browser before closing the private window.
- Keep forwarded port `4321` private. The site preview contains unpublished drafts in development mode.
- Do not add Codespaces secrets for the initial MVP. `SITE_URL` and Buttondown production configuration remain future deployment work.
- Delete the Codespace only after `git status --short` is clean and the current branch is confirmed pushed.

## 6. Verification and recovery

Implementation verification requires:

- parsing `.devcontainer/devcontainer.json` as JSON;
- confirming no tracked file contains credential material or a real secret value;
- running `npm run check` and the focused currently relevant unit tests;
- confirming `git status --short` is clean after the continuity commit;
- pushing `feature/memorying-mvp` with upstream tracking;
- reading the remote branch head back after the push and confirming it matches local `HEAD`.

If Codespaces setup fails, the recovery path is:

1. open the Codespace creation log and identify the failing setup command;
2. use the Codespaces recovery container if offered;
3. fix the tracked dev-container configuration on a branch;
4. rebuild the container;
5. never bypass a dependency failure by removing verification.

## 7. Scope boundaries

This continuity work does not:

- finish compact-home UI Task 2;
- deploy the application;
- create or modify Cloudflare Pages, DNS, a custom domain, or production `SITE_URL`;
- configure Buttondown delivery;
- import Notion data;
- commit private Codex session files or credentials;
- merge the feature branch into `main` or create a pull request.

After the continuity commit is pushed and verified, implementation resumes at compact-home UI Task 2 under the existing Subagent-Driven Development plan.
