import { expect, test } from '@playwright/test';

test('renders global identity, navigation, metadata, and footer', async ({ page }) => {
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:4321';
  const canonicalUrl = `${siteUrl.replace(/\/+$/, '')}/`;

  await page.goto('/');
  await page.locator('body').press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Sunwoo Choi' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page).toHaveTitle('Sunwoo Choi');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalUrl);
  await expect(page.getByRole('contentinfo')).toContainText('Sunwoo Choi');
});
