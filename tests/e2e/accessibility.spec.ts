import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/about/', '/writing/', '/writing/memorying-start/', '/work/', '/privacy/', '/404/']) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === '/404/' ? 404 : 200);
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
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();
  await expect(page.getByRole('button', { name: /한국어.*Original/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
});
