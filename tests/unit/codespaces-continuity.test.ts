import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativeMarkdownLinks } from '../support/repository-documents';

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

  // Wording is not pinned; only the links that let a fresh human or agent find the handoff.
  it('links the handoff documents from the entry points', () => {
    const targets = (path: string) => relativeMarkdownLinks(path).map((link) => link.path);

    expect(targets('AGENTS.md')).toContain('docs/CURRENT_WORK.md');
    expect(targets('README.md')).toEqual(expect.arrayContaining(['docs/CURRENT_WORK.md', 'docs/codespaces-guide.md']));
    expect(targets('docs/codespaces-guide.md')).toContain('docs/MAINTENANCE.md');
  });
});
