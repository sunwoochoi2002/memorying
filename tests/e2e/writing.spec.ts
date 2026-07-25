import { expect, test } from '@playwright/test';

const statusText = (count: number, type: string, language: string) =>
  `Showing ${count} writing item${count === 1 ? '' : 's'}: Type ${type}, Language ${language}.`;

test('filters writing with canonical URL history, restores state, and focuses reset', async ({ page }) => {
  await page.goto('/writing/');
  const typeFilters = page.locator('[data-filter-group="type"]');
  const languageFilters = page.locator('[data-filter-group="language"]');
  const status = page.locator('[data-filter-status]');
  const initialHistoryLength = await page.evaluate(() => history.length);

  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(status).toHaveText(statusText(2, 'All', 'All'));

  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(status).toHaveText(statusText(1, 'Note', 'All'));
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);
  await expect(status).toHaveText(statusText(1, 'Note', 'All'));

  await languageFilters.getByRole('button', { name: '한국어' }).click();
  await expect(page).toHaveURL('/writing/?type=note&lang=ko');
  await expect(status).toHaveText(statusText(0, 'Note', '한국어'));
  await expect(page.getByText('이 조건에 해당하는 글이 아직 없습니다.')).toBeVisible();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 2);

  await page.getByRole('button', { name: '모든 글 보기' }).click();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(2, 'All', 'All'));
  await expect(typeFilters.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 3);

  await page.goBack();
  await expect(page).toHaveURL('/writing/?type=note&lang=ko');
  await expect(typeFilters.getByRole('button', { name: 'Note' })).toHaveAttribute('aria-pressed', 'true');
  await expect(languageFilters.getByRole('button', { name: '한국어' })).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText(statusText(0, 'Note', '한국어'));
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(status).toHaveText(statusText(1, 'Note', 'All'));
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.goForward();
  await expect(status).toHaveText(statusText(0, 'Note', '한국어'));
  await page.goForward();
  await expect(status).toHaveText(statusText(2, 'All', 'All'));
});

test('restores valid and partial-invalid query state before canonical interaction', async ({ page }) => {
  await page.goto('/writing/?type=essay&lang=ko');
  const typeFilters = page.locator('[data-filter-group="type"]');
  const languageFilters = page.locator('[data-filter-group="language"]');
  await expect(typeFilters.getByRole('button', { name: 'Essay' })).toHaveAttribute('aria-pressed', 'true');
  await expect(languageFilters.getByRole('button', { name: '한국어' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-filter-status]')).toHaveText(statusText(1, 'Essay', '한국어'));

  await page.goto('/writing/?type=essay&lang=jp');
  await expect(typeFilters.getByRole('button', { name: 'Essay' })).toHaveAttribute('aria-pressed', 'true');
  await expect(languageFilters.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  await languageFilters.getByRole('button', { name: 'English' }).click();
  await expect(page).toHaveURL('/writing/?type=essay&lang=en');
  await expect(page.locator('[data-filter-status]')).toHaveText(statusText(0, 'Essay', 'English'));

  await page.goto('/writing/?type=article&lang=jp');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
});

test('synchronizes dynamically added writing archives after a filter click', async ({ page }) => {
  await page.goto('/writing/');
  await page.locator('[data-writing-archive]').evaluate((archive) => {
    const clone = archive.cloneNode(true) as HTMLElement;
    archive.insertAdjacentElement('afterend', clone);
  });

  const firstArchive = page.locator('[data-writing-archive]').nth(0);
  const secondArchive = page.locator('[data-writing-archive]').nth(1);
  await firstArchive.locator('[data-filter-group="type"]').getByRole('button', { name: 'Note' }).click();

  await expect(page).toHaveURL('/writing/?type=note');
  await expect(firstArchive.locator('[data-filter-group="type"]').getByRole('button', { name: 'Note' })).toHaveAttribute('aria-pressed', 'true');
  await expect(secondArchive.locator('[data-filter-group="type"]').getByRole('button', { name: 'Note' })).toHaveAttribute('aria-pressed', 'true');
  await expect(firstArchive.locator('[data-filter-status]')).toHaveText(statusText(1, 'Note', 'All'));
  await expect(secondArchive.locator('[data-filter-status]')).toHaveText(statusText(1, 'Note', 'All'));
  await expect(firstArchive.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(secondArchive.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(firstArchive.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(secondArchive.getByRole('link', { name: 'A small beginning' })).toBeVisible();
});

test('server-renders visible archive cards but hides inert enhancement controls without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(page.locator('[data-writing-filters]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Note' })).toHaveCount(0);
  await context.close();
});

test('renders a bilingual article route with stable metadata', async ({ page }) => {
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4321/writing/memorying-start/',
  );
  await expect(page.getByRole('link', { name: 'Back to Writing' })).toBeVisible();
});

test('keeps navigation available on the noindex 404 page', async ({ page }) => {
  const response = await page.goto('/missing-memory/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('기억 속에 남아 있지 않습니다');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Writing 둘러보기' })).toBeVisible();
});
