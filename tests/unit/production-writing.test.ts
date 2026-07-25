import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('builds a public-empty writing archive when all writing is draft-only', () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    env: { NODE_ENV: 'production', PATH: process.env.PATH },
    stdio: 'pipe',
  });
  const archive = readFileSync('dist/writing/index.html', 'utf8');

  expect(archive).toContain('아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.');
  expect(archive).not.toContain('data-writing-filters');
  expect(archive).not.toContain('이 조건에 해당하는 글이 아직 없습니다.');
});
