import { expect, test } from '@playwright/test';
import { articlePath, loadWritingCases, representativeCases } from '../support/writing-content';

const cases = loadWritingCases({ fixtures: true });
const widths = [320, 390, 768, 1024, 1440];
// One article with a cover and one without stand in for every article.
const paths = ['/', '/writing/', ...representativeCases(cases).map(articlePath), '/work/', '/privacy/', '/404/'];

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
    page.getByRole('link', { name: '전체 글 보기' }),
    ...await page.locator('.home-writing .writing-list-item').getByRole('link').all(),
  ]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.goto(articlePath(cases[0]));
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

test('home keeps the name and tagline inside the viewport and wraps only at word boundaries', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const title = page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' });
    const titleMetrics = await title.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    }));
    expect(titleMetrics.scrollWidth).toBeLessThanOrEqual(titleMetrics.clientWidth + 1);
    expect(titleMetrics.fontSize).toBeLessThanOrEqual(48);

    const statement = page.locator('.hero__statement');
    await expect(statement).toHaveCSS('word-break', 'keep-all');
    const statementMetrics = await statement.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(statementMetrics.scrollWidth).toBeLessThanOrEqual(statementMetrics.clientWidth + 1);
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' })).toHaveCSS('font-size', '48px');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
