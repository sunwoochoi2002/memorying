import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

async function renderHead() {
  const container = await AstroContainer.create();
  const html = await container.renderToString(BaseLayout, { props: { title: 'Home' } });
  return parseHTML(html).document;
}

const meta = (document: Document, key: string) =>
  document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content') ?? '';

/** Reads the pixel size from a PNG file's IHDR chunk. */
function pngSize(path: string) {
  const buffer = readFileSync(path);
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('social preview image', () => {
  it('points Open Graph and Twitter at the same PNG in public/', async () => {
    const document = await renderHead();
    const image = meta(document, 'og:image');

    expect(image).not.toBe('');
    expect(meta(document, 'twitter:image')).toBe(image);
    const { pathname } = new URL(image);
    expect(pathname).toMatch(/\.png$/);
    pngSize(`public${pathname}`);
  });

  it('declares the real pixel size and alt text of the image', async () => {
    const document = await renderHead();
    const { pathname } = new URL(meta(document, 'og:image'));
    const size = pngSize(`public${pathname}`);

    expect(meta(document, 'og:image:width')).toBe(String(size.width));
    expect(meta(document, 'og:image:height')).toBe(String(size.height));
    expect(meta(document, 'og:image:alt').trim()).not.toBe('');
    expect(meta(document, 'twitter:image:alt')).toBe(meta(document, 'og:image:alt'));
  });
});
