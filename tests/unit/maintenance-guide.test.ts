import { describe, expect, it } from 'vitest';
import {
  linkResolves,
  npmRunScripts,
  packageScripts,
  readRepositoryText,
  relativeMarkdownLinks,
  SECRET_ASSIGNMENT,
} from '../support/repository-documents';

// Structure only: these checks never pin a heading or sentence, so the guides can be reworded freely.
const COMMAND_DOCUMENTS = ['docs/MAINTENANCE.md', 'README.md', 'docs/codespaces-guide.md'];
const LINKED_DOCUMENTS = [...COMMAND_DOCUMENTS, 'docs/CURRENT_WORK.md'];

describe('maintenance documents', () => {
  it.each(COMMAND_DOCUMENTS)('%s only names npm scripts that exist in package.json', (path) => {
    const scripts = packageScripts();
    const named = npmRunScripts(readRepositoryText(path));

    expect(named.length).toBeGreaterThan(0);
    expect(named.filter((script) => !scripts.includes(script))).toEqual([]);
  });

  it.each(LINKED_DOCUMENTS)('%s has relative links that point at existing files', (path) => {
    const links = relativeMarkdownLinks(path);

    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((link) => !linkResolves(link))).toEqual([]);
  });

  it('README links to the maintenance guide and the current work checkpoint', () => {
    const targets = relativeMarkdownLinks('README.md').map((link) => link.path);

    expect(targets).toContain('docs/MAINTENANCE.md');
    expect(targets).toContain('docs/CURRENT_WORK.md');
  });

  it('never stores a secret value in a document', () => {
    for (const path of [...LINKED_DOCUMENTS, 'AGENTS.md', 'docs/PROJECT_STRUCTURE.md', 'docs/publishing.md', '.devcontainer/devcontainer.json']) {
      expect(readRepositoryText(path), path).not.toMatch(SECRET_ASSIGNMENT);
    }
  });
});

describe('document structure helpers', () => {
  it('resolves relative links with anchors and ignores external, anchor-only and fenced links', async () => {
    const { mkdtemp, mkdir, rm, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const directory = await mkdtemp(join(tmpdir(), 'doc-links-'));
    try {
      await mkdir(join(directory, 'docs'));
      await writeFile(join(directory, 'docs/guide.md'), 'x');
      await writeFile(
        join(directory, 'README.md'),
        [
          '[guide](docs/guide.md#section)',
          '[missing](docs/missing.md)',
          '[web](https://example.com/a.md) [mail](mailto:a@example.com) [top](#top) [site](/writing/a/)',
          '```md',
          '[fenced](docs/fenced.md)',
          '```',
        ].join('\n'),
      );
      const links = relativeMarkdownLinks(join(directory, 'README.md'));

      expect(links.map((link) => [link.target, linkResolves(link)])).toEqual([
        ['docs/guide.md#section', true],
        ['docs/missing.md', false],
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('finds npm run scripts and secret assignments', () => {
    expect(npmRunScripts('`npm run organize:writing -- --dry-run` and npm run verify; npm test')).toEqual(['organize:writing', 'verify']);
    expect('OPENAI_API_KEY=sk-123').toMatch(SECRET_ASSIGNMENT);
    expect('GITHUB_TOKEN = abc').toMatch(SECRET_ASSIGNMENT);
    expect('SITE_URL=https://sunwoochoi.com and PUBLIC_BUTTONDOWN_USERNAME=sunwoochoi').not.toMatch(SECRET_ASSIGNMENT);
  });
});

describe('repository root', () => {
  it('keeps only tool-required files and entry points at the top level', async () => {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(process.cwd(), { withFileTypes: true });
    const rootMarkdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name).sort();

    expect(rootMarkdown).toEqual(['AGENTS.md', 'README.md']);
  });
});
