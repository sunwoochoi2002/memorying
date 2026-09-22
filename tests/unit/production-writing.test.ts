import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  articlePath,
  loadWritingCases,
  originalTitle,
  visibleCases,
} from '../support/writing-content';

/**
 * These checks build the site and compare the output with whatever writing
 * exists in the repository. Nothing here names a particular article.
 */

const HOME_LIST_LENGTH = 3;
const SITE = 'https://example.com';

const escapeHtml = (text: string) => text
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const writing = loadWritingCases();
const fixtures = loadWritingCases({ fixtures: true }).filter((item) => item.source === 'fixture');
const published = visibleCases(writing, { includeDrafts: false });
const realDrafts = writing.filter((item) => item.draft);
const onHome = published.slice(0, HOME_LIST_LENGTH);

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
      SITE_URL: SITE,
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

function expectPublishedWriting(site: BuiltSite) {
  if (published.length === 0) {
    expect(site.archive).toContain('아직 공개된 글이 없습니다');
  } else {
    expect(site.archive).not.toContain('아직 공개된 글이 없습니다');
    expect(site.archive).toContain('data-writing-filters');
  }

  for (const item of published) {
    expect(site.archive, `${item.slug} in the archive`).toContain(escapeHtml(originalTitle(item)));
    expect(existsSync(`dist/writing/${item.slug}/index.html`), `${item.slug} page`).toBe(true);
    expect(site.sitemap, `${item.slug} in the sitemap`).toContain(`${SITE}${articlePath(item)}`);
  }

  const archiveLinks = new Set(site.archive.match(/href="\/writing\/[a-z0-9-]+\/"/g) ?? []);
  expect(archiveLinks.size).toBe(published.length);

  const homeLinks = new Set(site.homepage.match(/href="\/writing\/[a-z0-9-]+\/"/g) ?? []);
  expect(homeLinks.size).toBe(onHome.length);
  for (const item of onHome) {
    expect(site.homepage, `${item.slug} on the home page`).toContain(escapeHtml(originalTitle(item)));
  }
  for (const item of published.slice(HOME_LIST_LENGTH)) {
    expect(site.homepage, `${item.slug} is older than the home list`).not.toContain(`href="${articlePath(item)}"`);
  }
}

function expectHiddenWriting(site: BuiltSite, hidden: typeof writing) {
  for (const item of hidden) {
    expect(site.archive, `${item.slug} draft in the archive`).not.toContain(escapeHtml(originalTitle(item)));
    expect(site.homepage, `${item.slug} draft on the home page`).not.toContain(escapeHtml(originalTitle(item)));
    expect(existsSync(`dist/writing/${item.slug}/index.html`), `${item.slug} draft page`).toBe(false);
    expect(site.sitemap, `${item.slug} draft in the sitemap`).not.toContain(articlePath(item));
  }
}

describe('test fixtures stay separate from real writing', () => {
  it('never reuses a fixture slug for real writing', () => {
    const fixtureSlugs = new Set(fixtures.map((item) => item.slug));
    for (const item of writing) expect(fixtureSlugs.has(item.slug), item.slug).toBe(false);
  });
});

describe('default production build', () => {
  let site: BuiltSite;

  beforeAll(() => {
    site = buildSite({});
  }, 60_000);

  it('publishes exactly the published writing and keeps the home list to the newest few', () => {
    expectPublishedWriting(site);
  });

  it('leaves out every draft', () => {
    expectHiddenWriting(site, realDrafts);
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
    expectHiddenWriting(site, fixtures);
    expect(site.loadedEntries).not.toContain('tests/fixtures/');
    for (const item of writing) expect(site.loadedEntries, item.slug).toContain(`src/content/writing/${item.slug}/`);
  });
});

describe('production build with test fixtures loaded', () => {
  let site: BuiltSite;

  beforeAll(() => {
    site = buildSite({ WRITING_FIXTURES: '1' });
  }, 60_000);

  it('still publishes exactly the real published writing', () => {
    expectPublishedWriting(site);
  });

  it('loads the fixtures but keeps every fixture draft and real draft out of the output', () => {
    for (const item of fixtures) expect(site.loadedEntries, item.slug).toContain(`tests/fixtures/writing/${item.slug}/`);
    expectHiddenWriting(site, [...realDrafts, ...fixtures.filter((item) => item.draft)]);
  });
});
