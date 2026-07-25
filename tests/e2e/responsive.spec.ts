import { expect, test } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];
const paths = ['/', '/writing/', '/writing/memorying-start/', '/work/', '/privacy/', '/404/'];

for (const width of widths) {
  for (const path of paths) {
    test(`${path} fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
}
