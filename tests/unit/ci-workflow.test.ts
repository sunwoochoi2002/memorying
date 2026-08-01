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
