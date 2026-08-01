import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readRepositoryFile = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

describe('Codespaces continuity handoff', () => {
  it('keeps the reproducible private preview container contract', async () => {
    const config = JSON.parse(await readRepositoryFile('.devcontainer/devcontainer.json'));

    expect(config.image).toMatch(/javascript-node:1-22-bookworm$/);
    expect(config.postCreateCommand).toBe(
      'npm ci && npx playwright install --with-deps chromium',
    );
    expect(config.forwardPorts).toContain(4321);
    expect(config.portsAttributes['4321'].visibility).toBe('private');
  });

  it('keeps the secure, resumable human and agent handoff instructions', async () => {
    const [agents, currentWork, guide, readme, devcontainer] = await Promise.all([
      readRepositoryFile('AGENTS.md'),
      readRepositoryFile('docs/CURRENT_WORK.md'),
      readRepositoryFile('docs/codespaces-guide.md'),
      readRepositoryFile('README.md'),
      readRepositoryFile('.devcontainer/devcontainer.json'),
    ]);

    expect(agents).toContain('docs/CURRENT_WORK.md');
    expect(agents).toContain('docs/superpowers/plans/2026-07-25-compact-home-writing-ui.md');
    expect(agents).toMatch(/strict TDD/i);
    expect(agents).toMatch(/Subagent-Driven Development/i);
    expect(agents).toContain('npm run verify');
    expect(agents).toMatch(/Cloudflare.*domain|domain.*Cloudflare/i);

    expect(currentWork).toMatch(/stable branch.*`main`/i);
    expect(currentWork).toMatch(/MVP.*merged/i);
    expect(currentWork).toMatch(/CI-continuity.*complete/i);
    expect(currentWork).toMatch(/pull request.*artifact.*merged.*main.*Verify.*succeeded/is);
    expect(currentWork).not.toMatch(/remain pending platform validation/i);
    expect(currentWork).toMatch(/real content.*Buttondown.*Cloudflare Pages.*domain/is);
    expect(currentWork).not.toContain('feature/memorying-mvp');
    expect(currentWork).not.toContain('8865a80d36eeffca09252f1f4f4fc1f9a062ab6e');

    const resumePrompt = currentWork.slice(currentWork.indexOf('## Resume prompt'));
    expect(resumePrompt).toContain('git switch main');
    expect(resumePrompt).toContain('git pull --ff-only origin main');
    expect(resumePrompt).toContain('git status --short');
    expect(resumePrompt).toMatch(/feature branch/i);
    expect(resumePrompt).toMatch(/non-empty.*stop.*current branch.*commit.*push.*switch.*pull/is);
    expect(resumePrompt).not.toMatch(/finish the pending CI-continuity delivery gates/i);

    expect(guide).toMatch(/private|incognito/i);
    expect(guide).toContain('codex login');
    expect(guide).toContain('codex login --device-auth');
    expect(guide).toContain('codex logout');
    expect(guide).toContain('git push');
    expect(guide).toContain('git status --short');
    expect(guide).toMatch(/private.*4321|4321.*private/i);
    expect(guide).toMatch(/git push[\s\S]*삭제|푸시[\s\S]*삭제/i);
    expect(guide).toContain('`~/.codex/auth.json`을 커밋하거나 복사하지 마세요.');
    expect(guide).toContain('Codespace를 중지하거나 삭제하기 전에는 항상 `codex logout`을 실행하세요.');
    expect(guide).toContain('푸시하지 않은 작업이 있다면 먼저 `codex logout`을 실행하고 Codespace를 중지한 뒤 나중에 다시 이어서 작업하세요.');
    expect(guide).toContain(
      'https://docs.github.com/en/codespaces/troubleshooting/exporting-changes-to-a-branch',
    );
    expect(guide).toMatch(/`main`.*Codespace|Codespace.*`main`/i);
    expect(guide).toContain('npm ci');
    expect(guide).toContain('git switch main');
    expect(guide).toContain('git pull --ff-only origin main');
    expect(guide).toMatch(/출력이 비어 있지 않으면 여기서 멈추세요/);
    expect(guide).toMatch(/현재 브랜치.*안전하게 커밋.*push.*git switch main.*git pull --ff-only origin main/is);
    expect(guide).toContain('git switch -c feature/next-writing-update');
    expect(guide).toContain('npm run verify');
    expect(guide).not.toContain('feature/memorying-mvp');

    expect(readme).toContain('npm ci');
    expect(readme).toContain('actions/workflows/verify.yml/badge.svg?branch=main');
    expect(readme).toContain('docs/CURRENT_WORK.md');
    expect(readme).toContain('docs/codespaces-guide.md');
    expect(readme).toContain('docs/publishing.md');

    const secretAssignment = /\b(?:OPENAI_API_KEY|CODEX_ACCESS_TOKEN|GITHUB_TOKEN)\s*=\s*\S+/;
    for (const document of [agents, currentWork, guide, readme, devcontainer]) {
      expect(document).not.toMatch(secretAssignment);
    }

  });
});
