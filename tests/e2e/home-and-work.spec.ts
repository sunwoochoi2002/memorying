import { expect, test } from '@playwright/test';

test('home is person-first and keeps the introduction in one column', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: "Hello, I’m Sunwoo." })).toBeVisible();
  await expect(page.getByText('시간이 지나도 잊고 싶지 않은 것들을 기록합니다.')).toBeVisible();
  await expect(page.getByText('이 공간에 도착한 당신을 환영합니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Memorying을 시작하며/ })).toBeVisible();
});

test('about and work explain the person without becoming a full résumé', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page.getByText('안녕하세요, 최선우입니다.')).toBeVisible();

  await page.goto('/work/');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Memorying' })).toBeVisible();
});
