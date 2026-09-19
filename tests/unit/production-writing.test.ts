import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const fixtures = [
  { slug: 'memorying-start', title: 'Memorying을 시작하며' },
  { slug: 'small-beginning', title: 'A small beginning' },
];

const imported = [
  { slug: 'alone', title: '홀로-' },
  { slug: 'keep-it-up', title: 'Keep it up!' },
  { slug: 'time-for-change', title: '변화가 필요한 시점.' },
  { slug: 'teammates', title: 'Teammates' },
];

interface BuiltSite {
  homepage: string;
  archive: string;
  sitemap: string;
  /** The content-layer store Astro writes during the build; it lists every loaded entry. */
  loadedEntries: string;
}

function buildSite(extraEnv: Record<string, string>): BuiltSite {
  execFileSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
      PATH: process.env.PATH,
      SITE_URL: 'https://example.com',
      ...extraEnv,
    },
    stdio: 'pipe',
  });
  return {
    homepage: readFileSync('dist/index.html', 'utf8'),
    archive: readFileSync('dist/writing/index.html', 'utf8'),
    sitemap: readdirSync('dist')
      .filter((name) => /^sitemap.*\.xml$/.test(name))
      .map((name) => readFileSync(`dist/${name}`, 'utf8'))
      .join('\n'),
    loadedEntries: readFileSync('node_modules/.astro/data-store.json', 'utf8'),
  };
}

function expectImportedEssays(site: BuiltSite) {
  expect(site.archive).not.toContain('아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.');
  expect(site.archive).toContain('data-writing-filters');

  for (const article of imported) {
    expect(site.archive).toContain(article.title);
    expect(site.homepage).toContain(article.title);
    expect(existsSync(`dist/writing/${article.slug}/index.html`)).toBe(true);
    expect(site.sitemap).toContain(`https://example.com/writing/${article.slug}/`);
  }
}

function expectFixturesAbsent(site: BuiltSite) {
  expect(site.sitemap).toContain('https://example.com/writing/');
  for (const fixture of fixtures) {
    expect(site.archive).not.toContain(fixture.title);
    expect(site.homepage).not.toContain(fixture.title);
    expect(existsSync(`dist/writing/${fixture.slug}/index.html`)).toBe(false);
    expect(site.sitemap).not.toContain(`/writing/${fixture.slug}/`);
  }
}

describe('sample drafts live only in test fixtures', () => {
  it('keeps the real archive free of sample articles', () => {
    expect(readdirSync('src/content/writing').sort()).toEqual(imported.map(({ slug }) => slug).sort());
    expect(readdirSync('tests/fixtures/writing/small-beginning').sort()).toEqual(['en.mdx', 'ko.mdx', 'meta.yaml']);
    expect(readdirSync('tests/fixtures/writing/memorying-start').sort()).toEqual([
      'cover.alt.en.txt',
      'cover.alt.ko.txt',
      'cover.svg',
      'en.mdx',
      'ko.mdx',
      'meta.yaml',
    ]);
  });
});

describe('default production build', () => {
  let site: BuiltSite;

  beforeAll(() => {
    site = buildSite({});
  }, 30_000);

  it('builds the four imported Korean-original essays into the public prototype', () => {
    expectImportedEssays(site);
  });

  it('ships self-hosted fonts that the Content-Security-Policy allows', () => {
    const cssFiles = readdirSync('dist/_astro').filter((name) => name.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
    const css = cssFiles.map((name) => readFileSync(`dist/_astro/${name}`, 'utf8')).join('\n');

    expect(css).toContain('Instrument Serif');
    expect(css).toContain('Noto Serif KR Variable');
    expect(css).not.toMatch(/url\(\s*["']?data:/);

    const fontFiles = readdirSync('dist/_astro').filter((name) => /\.woff2?$/.test(name));
    expect(fontFiles.some((name) => name.startsWith('instrument-serif-latin-400-normal'))).toBe(true);
    expect(fontFiles.filter((name) => name.startsWith('noto-serif-kr-')).length).toBeGreaterThan(100);

    const headers = readFileSync('public/_headers', 'utf8');
    expect(headers).toMatch(/default-src 'self'/);
    expect(headers).not.toMatch(/font-src[^;\n]*(https?:|\*)/);
  });

  it('never reads the test fixtures without WRITING_FIXTURES=1', () => {
    expectFixturesAbsent(site);
    expect(site.loadedEntries).toContain('src/content/writing/alone/');
    expect(site.loadedEntries).not.toContain('tests/fixtures/');
    for (const fixture of fixtures) expect(site.loadedEntries).not.toContain(fixture.slug);
  });
});

describe('production build with test fixtures loaded', () => {
  let site: BuiltSite;

  beforeAll(() => {
    site = buildSite({ WRITING_FIXTURES: '1' });
  }, 30_000);

  it('still builds the four imported essays', () => {
    expectImportedEssays(site);
  });

  it('loads the fixtures but excludes both drafts from the homepage, archive, routes, and sitemap', () => {
    expect(site.loadedEntries).toContain('tests/fixtures/writing/memorying-start/');
    expect(site.loadedEntries).toContain('tests/fixtures/writing/small-beginning/');
    expectFixturesAbsent(site);
  });
});
