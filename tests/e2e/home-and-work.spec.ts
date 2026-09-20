import { expect, test } from '@playwright/test';
import { articlePath, isoDatetime, loadWritingCases, originalTitle } from '../support/writing-content';

// The dev server shows drafts and loads the test fixtures, so the home list is the newest few of all of them.
const HOME_LIST_LENGTH = 6;
const recent = loadWritingCases({ fixtures: true }).slice(0, HOME_LIST_LENGTH);

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

  const rows = page.locator('.home-writing .writing-list-item');
  await expect(rows).toHaveCount(recent.length);
  for (const [index, item] of recent.entries()) {
    const row = rows.nth(index);
    await expect(row.locator('h3'), item.slug).toHaveAttribute('lang', item.originalLanguage);
    await expect(row.getByRole('link'), item.slug).toHaveText(originalTitle(item));
    await expect(row.getByRole('link'), item.slug).toHaveAttribute('href', articlePath(item));
    await expect(row.locator('time'), item.slug).toHaveText(item.publishedAt);
    await expect(row.locator('time'), item.slug).toHaveAttribute('lang', item.originalLanguage);
    await expect(row.locator('time'), item.slug).toHaveAttribute('datetime', isoDatetime(item));
  }
  await expect(page.locator('.home-writing .writing-list-item__copy > p')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { name: 'Sunwoo’s Archive' })).toBeVisible();
});
