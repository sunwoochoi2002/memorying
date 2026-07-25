import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';

const checker = resolve('scripts/check-built-links.mjs');

function withBuiltFiles(files: Record<string, string>, check: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'memorying-built-links-'));
  try {
    for (const [file, contents] of Object.entries(files)) {
      const path = join(directory, file);
      mkdirSync(resolve(path, '..'), { recursive: true });
      writeFileSync(path, contents);
    }
    check(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function runChecker(directory: string) {
  return spawnSync(process.execPath, [checker], {
    cwd: directory,
    encoding: 'utf8',
  });
}

it('resolves a relative generated link from its containing document', () => {
  withBuiltFiles({
    'dist/writing/index.html': '<h1>Writing</h1>',
    'dist/writing/post/index.html': '<a href="../">Writing</a>',
  }, (directory) => {
    const result = runChecker(directory);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('no broken internal links');
  });
});

it('rejects an encoded traversal link even when the escaped file exists', () => {
  withBuiltFiles({
    'package.json': '{}',
    'dist/index.html': '<a href="/%2F..%2Fpackage.json">Escaped file</a>',
  }, (directory) => {
    const result = runChecker(directory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('index.html -> /%2F..%2Fpackage.json');
  });
});

it('resolves a trailing-slash link to a flat generated HTML page', () => {
  withBuiltFiles({
    'dist/index.html': '<a href="/404/">Not found</a>',
    'dist/404.html': '<h1>Not found</h1>',
  }, (directory) => {
    const result = runChecker(directory);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('no broken internal links');
  });
});
