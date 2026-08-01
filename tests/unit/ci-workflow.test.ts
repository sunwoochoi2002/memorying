import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

const readRepositoryFile = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

describe('GitHub Actions verification workflow', () => {
  it('runs the complete read-only verification contract for main and pull requests', async () => {
    const workflow = parse(await readRepositoryFile('.github/workflows/verify.yml'));
    const job = workflow.jobs.verify as Record<string, unknown>;

    expect(workflow.on).toEqual({
      push: { branches: ['main'] },
      pull_request: { branches: ['main'] },
      workflow_dispatch: null,
    });
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    expect(workflow.concurrency.group).toContain('github.event.pull_request.number || github.ref');

    expect(Object.keys(workflow.jobs)).toEqual(['verify']);
    expect(job['runs-on']).toBe('ubuntu-latest');
    expect(job['timeout-minutes']).toBe(20);
    expect(job.env).toEqual({
      CI: 'true',
      SITE_URL: 'http://localhost:4321',
      PUBLIC_BUTTONDOWN_USERNAME: 'memorying-test',
      TZ: 'America/Los_Angeles',
    });
    expect(job.steps).toEqual([
      { uses: 'actions/checkout@v6' },
      {
        uses: 'actions/setup-node@v6',
        with: {
          'node-version': '22',
          cache: 'npm',
          'cache-dependency-path': 'package-lock.json',
        },
      },
      { name: 'Install dependencies', run: 'npm ci' },
      { name: 'Install Chromium', run: 'npx playwright install --with-deps chromium' },
      { name: 'Run verification', run: 'npm run verify' },
      {
        name: 'Upload Playwright diagnostics',
        if: '${{ !cancelled() }}',
        uses: 'actions/upload-artifact@v5',
        with: {
          name: 'playwright-diagnostics-${{ github.run_attempt }}',
          path: 'playwright-report/\ntest-results/\n',
          'if-no-files-found': 'ignore',
          'retention-days': 7,
        },
      },
    ]);
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

  it('keeps the normal local worker selection and list reporter outside CI', async () => {
    vi.stubEnv('CI', '');
    vi.resetModules();
    const { default: config } = await import('../../playwright.config');

    expect(config.workers).toBeUndefined();
    expect(config.reporter).toBe('list');
  });
});
