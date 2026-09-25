import { expect, test } from '@playwright/test';
import { articlePath, loadWritingCases } from '../support/writing-content';

const cases = loadWritingCases({ fixtures: true });
const koreanOriginal = cases.find((item) => item.originalLanguage === 'ko')!;
const pages = ['/', '/writing/', articlePath(cases[0]), '/about/', '/projects/', '/experience/', '/privacy/'];

for (const width of [390, 1280, 1440]) {
  test(`keeps every page in one centered 39rem column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const expectedWidth = Math.min(width - 48, 624);

    for (const path of pages) {
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

test('uses the compact type scale on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' })).toHaveCSS('font-size', '48px');
  await expect(page.locator('.hero__statement')).toHaveCSS('font-size', '17px');
  await expect(page.locator('.site-brand')).toHaveCSS('font-size', '26px');
  await expect(page.locator('.home-writing .writing-list-item h3').first()).toHaveCSS('font-size', '22px');

  await page.goto(articlePath(koreanOriginal));
  await expect(page.locator('h1[data-language-fragment="ko"]')).toHaveCSS('font-size', '38px');
  await expect(page.locator('[data-language-panel="ko"] p').first()).toHaveCSS('font-size', '17px');
});

test('uses the compact type scale on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' })).toHaveCSS('font-size', '38px');
  await expect(page.locator('.hero__statement')).toHaveCSS('font-size', '16px');
  await expect(page.locator('.home-writing .writing-list-item h3').first()).toHaveCSS('font-size', '20px');

  await page.goto(articlePath(koreanOriginal));
  await expect(page.locator('h1[data-language-fragment="ko"]')).toHaveCSS('font-size', '32px');
  await expect(page.locator('[data-language-panel="ko"] p').first()).toHaveCSS('font-size', '16px');
});
