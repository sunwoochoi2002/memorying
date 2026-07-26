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

test('site writing actions provide 44px touch targets at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/writing/');

  const controls = [
    page.getByRole('link', { name: 'Sunwoo Choi' }),
    ...await page.getByRole('navigation', { name: 'Primary' }).getByRole('link').all(),
    ...await page.locator('[data-writing-filters]').getByRole('button').all(),
    ...await page.locator('[data-writing-item]').getByRole('link').all(),
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

  await page.goto('/');
  for (const control of [
    page.getByRole('link', { name: 'View all →' }),
    ...await page.locator('.home-writing .writing-list-item').getByRole('link').all(),
  ]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.goto('/writing/memorying-start/');
  for (const control of [
    ...await page.getByRole('group', { name: 'Language' }).getByRole('button').all(),
    page.getByRole('link', { name: 'Back to Writing' }),
  ]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('home keeps intentional heading and statement geometry across compact viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const desktopLines = page.locator('[data-home-heading-line]');
  await expect(desktopLines).toHaveCount(2);
  const firstDesktopLine = await desktopLines.nth(0).boundingBox();
  const secondDesktopLine = await desktopLines.nth(1).boundingBox();
  expect(firstDesktopLine).not.toBeNull();
  expect(secondDesktopLine).not.toBeNull();
  expect(Math.abs(
    (firstDesktopLine!.y + firstDesktopLine!.height / 2)
      - (secondDesktopLine!.y + secondDesktopLine!.height / 2),
  )).toBeLessThanOrEqual(1);

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const statement = page.locator('.hero__statement');
    const metrics = await statement.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(style.lineHeight),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    });
    expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 1.2);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mobileLines = page.locator('[data-home-heading-line]');
  const firstMobileLine = await mobileLines.nth(0).boundingBox();
  const secondMobileLine = await mobileLines.nth(1).boundingBox();
  expect(firstMobileLine).not.toBeNull();
  expect(secondMobileLine).not.toBeNull();
  expect(secondMobileLine!.y).toBeGreaterThan(firstMobileLine!.y + firstMobileLine!.height);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(844);
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
