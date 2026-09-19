import { expect, test } from '@playwright/test';

test('home is a compact person-first introduction with recent original-language writing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute('lang', 'en');
  await expect(page.getByText('시간이 지나도 잊고 싶지 않은 것들을 기록합니다.')).toBeVisible();
  await expect(page.getByText('이 공간에 도착한 당신을 환영합니다.')).toHaveCount(0);
  await expect(page.locator('.eyebrow')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent writing' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '전체 글 보기' })).toHaveAttribute('href', '/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  for (const title of ['홀로-', 'Keep it up!', '변화가 필요한 시점.', 'Teammates']) {
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  }
  const englishWriting = page.locator('.home-writing .writing-list-item').filter({ hasText: 'A small beginning' });
  await expect(englishWriting.locator('h3')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.home-writing .writing-list-item__copy > p')).toHaveCount(0);
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
});

test('home puts the all-writing link on the Writing heading line at the list edge', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const heading = await page.getByRole('heading', { level: 2, name: 'Writing' }).boundingBox();
  const link = await page.getByRole('link', { name: '전체 글 보기' }).boundingBox();
  const list = await page.locator('.home-writing .writing-list').boundingBox();
  expect(heading).not.toBeNull();
  expect(link).not.toBeNull();
  expect(list).not.toBeNull();

  expect(link!.y).toBeLessThan(heading!.y + heading!.height);
  expect(heading!.y).toBeLessThan(link!.y + link!.height);
  expect(link!.x).toBeGreaterThan(heading!.x + heading!.width);
  expect(Math.abs(link!.x + link!.width - (list!.x + list!.width))).toBeLessThanOrEqual(2);
});

test('about and work explain the person without becoming a full résumé', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page.getByText('안녕하세요, 최선우입니다.')).toBeVisible();
  await expect(page.getByText('시간이 지나도 잊고 싶지 않은 것들을 기록하고')).toBeVisible();
  await expect(page.getByText('Memorying은 작업과 생각을 천천히 쌓아가는 개인적인 공간입니다.')).toHaveCount(0);

  await page.goto('/work/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Memorying' })).toBeVisible();
});
