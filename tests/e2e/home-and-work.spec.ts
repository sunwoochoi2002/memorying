import { expect, test } from '@playwright/test';
import { articlePath, isoDatetime, loadWritingCases, originalTitle } from '../support/writing-content';

// The dev server shows drafts and loads the test fixtures, so the home list is the newest few of all of them.
const HOME_LIST_LENGTH = 3;
const recent = loadWritingCases({ fixtures: true }).slice(0, HOME_LIST_LENGTH);

test('home is a compact person-first introduction with recent original-language writing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1, name: 'Sunwoo’s Archive' });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute('lang', 'en');
  const introduction = page.getByRole('region', { name: 'Sunwoo’s Archive' });
  await expect(introduction.locator('p')).toHaveText([
    '안녕하세요, 최선우입니다.',
    '시간이 지나도 잊고 싶지 않은 것들을 기록하고, 일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.',
  ]);
  await expect(introduction).toBeVisible();
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

test('home places the same subscription form below its recent writing', async ({ page }) => {
  await page.goto('/writing/');
  const archiveCopy = await page.locator('.newsletter').innerText();
  const archiveAction = await page.getByRole('form', { name: 'Newsletter subscription' }).getAttribute('action');
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const newsletter = page.locator('.newsletter');
    await expect(newsletter).toHaveCount(1);
    expect(await newsletter.innerText()).toBe(archiveCopy);
    const form = newsletter.getByRole('form', { name: 'Newsletter subscription' });
    await expect(form).toHaveAttribute('action', archiveAction!);
    await expect(form.getByLabel('Email')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
    const writingBox = await page.locator('.home-writing').boundingBox();
    const newsletterBox = await newsletter.boundingBox();
    expect(newsletterBox!.y).toBeGreaterThanOrEqual(writingBox!.y + writingBox!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
