import { expect, test } from '@playwright/test';

test('renders global identity, navigation, metadata, and footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Sunwoo Choi' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page).toHaveTitle('Sunwoo Choi');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost:4321/');
  await expect(page.getByRole('contentinfo')).toContainText('Sunwoo Choi');
});
