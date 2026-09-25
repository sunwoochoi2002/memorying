import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

describe('Korean maintenance guide', () => {
  it('explains every routine task with the real commands and fields', async () => {
    const guide = await read('docs/MAINTENANCE.md');

    for (const command of ['npm run new:writing', 'npm run dev', 'npm run verify']) {
      expect(guide).toContain(command);
    }
    for (const field of ['publishedAt', 'updatedAt', 'type: note', 'type: essay', 'originalLanguage', 'draft: true', 'draft: false']) {
      expect(guide).toContain(field);
    }
    for (const heading of ['새 글 추가', '글 내용 고치기', 'Essay와 Note 바꾸기', '글 숨기기와 삭제', '사진 넣기', '뉴스레터', '되돌리기', '문제가 생겼을 때']) {
      expect(guide).toContain(heading);
    }
    for (const path of ['src/content/writing/', 'src/content/about/profile.yaml', 'src/content/projects/', 'src/content/experience/', 'src/components/PersonalIntroduction.astro']) {
      expect(guide).toContain(path);
    }
    expect(guide).toContain('https://sunwoochoi.com');
    expect(guide).toContain('자동 검사가 확인하는 것');
    expect(guide).toContain('tests/support/writing-rules.ts');
    expect(guide).not.toContain('검사가 옛 목록을 기준으로 하기 때문입니다');
  });

  it('never asks the reader to store secrets and stays linked from the README', async () => {
    const [guide, readme] = await Promise.all([read('docs/MAINTENANCE.md'), read('README.md')]);

    expect(guide).not.toMatch(/\b(?:API_KEY|TOKEN|PASSWORD)\s*=\s*\S+/i);
    expect(readme).toContain('docs/MAINTENANCE.md');
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
