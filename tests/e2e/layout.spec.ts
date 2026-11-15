import { expect, test } from '@playwright/test';
import { articlePath, categoryPath, loadCategories, loadWritingCases } from '../support/writing-content';

const cases = loadWritingCases({ fixtures: true });
const koreanOriginal = cases.find((item) => item.originalLanguage === 'ko')!;

// Reading pages share one 39rem column; the writing archive pages widen it to 56rem for the category sidebar.
const columns = [
  { rem: 39, pages: ['/', articlePath(cases[0]), '/about/', '/projects/', '/experience/', '/privacy/'] },
  { rem: 56, pages: ['/writing/', ...loadCategories().map((category) => categoryPath(category.slug))] },
];

for (const width of [390, 1280, 1440]) {
  for (const column of columns) {
    test(`keeps header, page and footer in one centered ${column.rem}rem column at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const expectedWidth = Math.min(width - 48, column.rem * 16);

      for (const path of column.pages) {
        await page.goto(path);
        const boxes = await page.evaluate(() => {
          const pick = (selector: string) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const { left, width: elementWidth } = element.getBoundingClientRect();
            return { left, width: elementWidth };
          };
          return {
            header: pick('.site-header__inner'),
            main: pick('#main-content > .container'),
            footer: pick('.site-footer__inner'),
            viewport: document.documentElement.clientWidth,
          };
        });

        for (const name of ['header', 'main', 'footer'] as const) {
          const box = boxes[name];
          expect(box, `${path} ${name}`).not.toBeNull();
          expect(Math.abs(box!.width - expectedWidth), `${path} ${name} width`).toBeLessThanOrEqual(1);
          expect(Math.abs(box!.left - (boxes.viewport - box!.width) / 2), `${path} ${name} centered`).toBeLessThanOrEqual(1);
        }
      }
    });
  }
}

test('puts the category sidebar beside the list on desktop and a sideways chip row above it on phones', async ({ page }) => {
  const sidebar = page.getByRole('navigation', { name: '카테고리' });
  const list = page.locator('.writing-archive__head');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/writing/');
  const desktopNav = await sidebar.boundingBox();
  const desktopList = await list.boundingBox();
  expect(desktopNav!.x + desktopNav!.width).toBeLessThan(desktopList!.x);
  await expect(sidebar).toHaveCSS('border-top-width', '1px');

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/writing/');
  const phoneNav = await sidebar.boundingBox();
  const phoneList = await list.boundingBox();
  expect(phoneNav!.y + phoneNav!.height).toBeLessThanOrEqual(phoneList!.y + 1);
  const tops = await sidebar.getByRole('link').evaluateAll((links) => links.map((element) => element.getBoundingClientRect().top));
  expect(new Set(tops).size, 'chips share one row').toBe(1);

  // Add chips until the row is wider than the screen: it must scroll on its own, never the page.
  await sidebar.locator('ul').evaluate((ul) => {
    const first = ul.firstElementChild!;
    for (let index = 0; index < 8; index += 1) ul.append(first.cloneNode(true));
  });
  const scroll = await sidebar.evaluate((nav) => {
    const before = { scrollWidth: nav.scrollWidth, clientWidth: nav.clientWidth };
    nav.scrollLeft = nav.scrollWidth;
    return { ...before, scrolled: nav.scrollLeft };
  });
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  expect(scroll.scrolled).toBeGreaterThan(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('uses the compact type scale on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' })).toHaveCSS('font-size', '48px');
  await expect(page.locator('.hero__statement')).toHaveCSS('font-size', '17px');
  await expect(page.locator('.site-brand')).toHaveCSS('font-size', '26px');
  await expect(page.locator('.home-writing .writing-list-item h3').first()).toHaveCSS('font-size', '22px');

  await page.goto('/about/');
  await expect(page.locator('.about-intro p[lang="ko"]').first()).toHaveCSS('font-size', '15px');
  await expect(page.locator('.about-intro p[lang="en"]').first()).toHaveCSS('font-size', '19px');

  await page.goto(articlePath(koreanOriginal));
  await expect(page.locator('h1[data-language-fragment="ko"]')).toHaveCSS('font-size', '38px');
  await expect(page.locator('[data-language-panel="ko"] p').first()).toHaveCSS('font-size', '16px');
});

test('uses the compact type scale on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' })).toHaveCSS('font-size', '38px');
  await expect(page.locator('.hero__statement')).toHaveCSS('font-size', '16px');
  await expect(page.locator('.home-writing .writing-list-item h3').first()).toHaveCSS('font-size', '20px');

  await page.goto('/about/');
  await expect(page.locator('.about-intro p[lang="ko"]').first()).toHaveCSS('font-size', '14px');
  await expect(page.locator('.about-intro p[lang="en"]').first()).toHaveCSS('font-size', '18px');

  await page.goto(articlePath(koreanOriginal));
  await expect(page.locator('h1[data-language-fragment="ko"]')).toHaveCSS('font-size', '32px');
  await expect(page.locator('[data-language-panel="ko"] p').first()).toHaveCSS('font-size', '15px');
});
