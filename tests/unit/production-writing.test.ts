import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const drafts = [
  { slug: 'memorying-start', title: 'Memorying을 시작하며' },
  { slug: 'small-beginning', title: 'A small beginning' },
];

const imported = [
  { slug: 'alone', title: '홀로-' },
  { slug: 'keep-it-up', title: 'Keep it up!' },
  { slug: 'time-for-change', title: '변화가 필요한 시점.' },
  { slug: 'teammates', title: 'Teammates' },
];

describe('production draft exclusion', () => {
  let homepage: string;
  let archive: string;
  let sitemap: string;

  beforeAll(() => {
    expect(readdirSync('src/content/writing/small-beginning').sort()).toEqual([
      'en.mdx',
      'ko.mdx',
      'meta.yaml',
    ]);
    expect(readdirSync('src/content/writing/memorying-start').sort()).toEqual([
      'cover.alt.en.txt',
      'cover.alt.ko.txt',
      'cover.svg',
      'en.mdx',
      'ko.mdx',
      'meta.yaml',
    ]);
    execFileSync('npm', ['run', 'build'], {
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PATH: process.env.PATH,
        SITE_URL: 'https://example.com',
      },
      stdio: 'pipe',
    });
    homepage = readFileSync('dist/index.html', 'utf8');
    archive = readFileSync('dist/writing/index.html', 'utf8');
    sitemap = readdirSync('dist')
      .filter((name) => /^sitemap.*\.xml$/.test(name))
      .map((name) => readFileSync(`dist/${name}`, 'utf8'))
      .join('\n');
  }, 30_000);

  it('builds the four imported Korean-original essays into the public prototype', () => {
    expect(archive).not.toContain('아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.');
    expect(archive).toContain('data-writing-filters');

    for (const article of imported) {
      expect(archive).toContain(article.title);
      expect(homepage).toContain(article.title);
      expect(existsSync(`dist/writing/${article.slug}/index.html`)).toBe(true);
      expect(sitemap).toContain(`https://example.com/writing/${article.slug}/`);
    }
    for (const draft of drafts) expect(archive).not.toContain(draft.title);
  });

  it('omits both draft starter posts from the homepage', () => {
    for (const draft of drafts) expect(homepage).not.toContain(draft.title);
  });

  it('does not generate article routes for either draft starter post', () => {
    for (const draft of drafts) {
      expect(existsSync(`dist/writing/${draft.slug}/index.html`)).toBe(false);
    }
  });

  it('omits both draft starter posts from the sitemap', () => {
    expect(sitemap).toContain('https://example.com/writing/');
    for (const draft of drafts) expect(sitemap).not.toContain(`/writing/${draft.slug}/`);
  });
});
