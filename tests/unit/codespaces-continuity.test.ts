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

    expect(currentWork).toContain('feature/memorying-mvp');
    expect(currentWork).toContain('9aed7a9');
    expect(currentWork).toMatch(/UI Task 1.*complete/i);
    expect(currentWork).toMatch(/UI Task 2.*pending/i);
    expect(currentWork).toContain('[data-writing-item]');
    expect(currentWork).toContain('Resume prompt');

    expect(guide).toMatch(/private|incognito/i);
    expect(guide).toContain('feature/memorying-mvp');
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

    expect(readme).toContain('docs/CURRENT_WORK.md');
    expect(readme).toContain('docs/codespaces-guide.md');

    const secretAssignment = /\b(?:OPENAI_API_KEY|CODEX_ACCESS_TOKEN|GITHUB_TOKEN)\s*=\s*\S+/;
    for (const document of [agents, currentWork, guide, readme, devcontainer]) {
      expect(document).not.toMatch(secretAssignment);
    }
  });
});
