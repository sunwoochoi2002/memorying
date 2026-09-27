import { existsSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

async function renderHead() {
  const container = await AstroContainer.create();
  const html = await container.renderToString(BaseLayout, { props: { title: 'Home' } });
  return parseHTML(html).document;
}

describe('site icons', () => {
  it('declares an SVG favicon, an ICO fallback, and an Apple touch icon', async () => {
    const document = await renderHead();

    expect(document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute('href')).toBe('/favicon.svg');
    expect(document.querySelector('link[rel="icon"][sizes="32x32"]')?.getAttribute('href')).toBe('/favicon.ico');
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe('/apple-touch-icon.png');
  });

  it('serves every declared icon from public/', async () => {
    const document = await renderHead();
    const hrefs = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')]
      .map((link) => link.getAttribute('href') ?? '');

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(existsSync(`public${href}`), href).toBe(true);
  });
});
