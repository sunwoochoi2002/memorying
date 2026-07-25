import { expect, test } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];
const paths = ['/', '/writing/', '/writing/memorying-start/', '/work/', '/privacy/', '/404/'];

for (const width of widths) {
  for (const path of paths) {
    test(`${path} fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(path);
      expect(response?.status()).toBe(path === '/404/' ? 404 : 200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
}

test('Writing navigation and filters provide 44px touch targets at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/writing/');

  const controls = [
    ...await page.getByRole('navigation', { name: 'Primary' }).getByRole('link').all(),
    ...await page.locator('[data-writing-filters]').getByRole('button').all(),
  ];

  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const navLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About' });
  await expect(navLink).toBeFocused();
  const navFocus = await navLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  expect(Number.parseFloat(navFocus.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(navFocus.boxShadow).not.toBe('none');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const filterButton = page.locator('[data-filter-group="type"]').getByRole('button', { name: 'All' });
  await expect(filterButton).toBeFocused();
  const filterFocus = await filterButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  expect(Number.parseFloat(filterFocus.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(filterFocus.boxShadow).not.toBe('none');
});
