import { expect, test } from '@playwright/test';

test('home is a compact person-first introduction with recent original-language writing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1, name: "Hello, I’m Sunwoo." });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-home-heading-line]')).toHaveCount(2);
  await expect(page.getByText('시간이 지나도 잊고 싶지 않은 것들을 기록합니다.')).toBeVisible();
  await expect(page.getByText('이 공간에 도착한 당신을 환영합니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  const englishWriting = page.locator('.home-writing .writing-list-item').filter({ hasText: 'A small beginning' });
  await expect(englishWriting.locator('h3')).toHaveAttribute('lang', 'en');
  await expect(englishWriting.locator('.writing-list-item__copy > p')).toHaveAttribute('lang', 'en');
  await expect(englishWriting.locator('time')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('.home-writing .writing-list-item').filter({ hasText: 'Memorying을 시작하며' }).locator('time'),
  ).toHaveText('2026-07-24');
  await expect(
    page.locator('.home-writing .writing-list-item').filter({ hasText: 'A small beginning' }).locator('time'),
  ).toHaveText('2026-07-23');
  await expect(page.locator('.home-writing img')).toHaveCount(0);

  const footer = await page.getByRole('contentinfo').boundingBox();
  expect(footer).not.toBeNull();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(720);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(720);
});

test('about and work explain the person without becoming a full résumé', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page.getByText('안녕하세요, 최선우입니다.')).toBeVisible();

  await page.goto('/work/');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Memorying' })).toBeVisible();
});
