import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { articlePath, loadWritingCases } from '../support/writing-content';

const cases = loadWritingCases({ fixtures: true });
const koreanOriginal = cases.find((item) => item.originalLanguage === 'ko');
const englishOriginal = cases.find((item) => item.originalLanguage === 'en');
// Articles are checked by kind (Essay, Note, with a cover) rather than by name.
const articleKinds = [...new Set([
  cases.find((item) => item.type === 'essay'),
  cases.find((item) => item.type === 'note'),
  cases.find((item) => item.cover),
].filter((item) => item !== undefined))];

for (const path of ['/', '/about/', '/writing/', ...articleKinds.map(articlePath), '/work/', '/privacy/', '/404/']) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === '/404/' ? 404 : 200);
    // The dev server can reload once while it optimizes dependencies on the first request.
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
    expect(blocking).toEqual([]);
  });
}

test('skip link and primary navigation work by keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('article language controls expose their selected language', async ({ page }) => {
  expect(koreanOriginal, 'a Korean-original article (a fixture guarantees one)').toBeDefined();
  expect(englishOriginal, 'an English-original article (a fixture guarantees one)').toBeDefined();

  await page.goto(articlePath(koreanOriginal!));
  await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();
  await expect(page.getByRole('button', { name: /한국어.*Original/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');

  await page.goto(articlePath(englishOriginal!));
  await expect(page.getByRole('button', { name: /English.*Original/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '한국어' })).toHaveAttribute('aria-pressed', 'false');
});

test('article controls and static metadata retain their own language annotations after switching', async ({ page }) => {
  expect(koreanOriginal, 'a Korean-original article (a fixture guarantees one)').toBeDefined();
  await page.goto(articlePath(koreanOriginal!));
  const metadata = page.locator('.article-header .meta');

  await expect(metadata).toHaveAttribute('lang', 'ko');
  await expect(page.locator('[data-language-button="ko"] > span')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('[data-language-button="en"] > span')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-language-button="ko"] small')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(metadata).toHaveAttribute('lang', 'ko');
});
