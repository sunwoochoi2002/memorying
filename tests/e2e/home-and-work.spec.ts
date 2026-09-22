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

test('about presents clearly labeled sample experience on desktop and mobile', async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/about/');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page.getByText('아래는 예시 이력입니다. 실제 이력으로 교체할 예정입니다.')).toBeVisible();
    const timeline = page.getByRole('list', { name: '이력' });
    const entries = timeline.getByRole('listitem');
    await expect(entries).toHaveCount(3);
    for (const entry of await entries.all()) {
      await expect(entry.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(entry.locator('time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}$/);
      await expect(entry.locator('p').last()).not.toBeEmpty();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('work introduces the personal archive', async ({ page }) => {
  await page.goto('/work/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sunwoo’s Archive' })).toBeVisible();
});

test('about switches its complete experience between Korean and English and resets on reload', async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/about/');
    const korean = page.getByRole('button', { name: '한국어', exact: true });
    const english = page.getByRole('button', { name: 'English', exact: true });
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(english).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(page.getByRole('list', { name: '이력', exact: true })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Experience', exact: true })).toBeHidden();

    await english.focus();
    await page.keyboard.press('Enter');
    await expect(english).toBeFocused();
    await expect(english).toHaveAttribute('aria-pressed', 'true');
    await expect(korean).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('These are sample entries and will be replaced with my actual experience.')).toBeVisible();
    const timeline = page.getByRole('list', { name: 'Experience', exact: true });
    await expect(timeline.getByRole('heading')).toHaveText([
      'Personal project @ Example project',
      'Product planning intern @ Example company',
      'Undergraduate studies @ Example university · Example major',
    ]);
    await expect(timeline.getByText('Present', { exact: true })).toBeVisible();
    const englishText = await timeline.innerText();
    expect(englishText).not.toMatch(/[가-힣]/);
    for (const entry of await timeline.getByRole('listitem').all()) {
      await expect(entry.locator('p').last()).not.toBeEmpty();
    }
    await expect(page.getByRole('list', { name: '이력', exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

    await korean.click();
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(page.getByRole('list', { name: '이력', exact: true })).toBeVisible();
    await expect(timeline).toBeHidden();
    await english.click();
    await page.reload();
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(page.getByRole('list', { name: '이력', exact: true })).toBeVisible();
  }
});

test('about keeps Korean experience readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/about/');
    await expect(page.getByRole('list', { name: '이력', exact: true })).toBeVisible();
    await expect(page.locator('[data-language-toggle]')).toBeHidden();
    await expect(page.getByRole('list', { name: 'Experience', exact: true })).toBeHidden();
  } finally {
    await context.close();
  }
});
