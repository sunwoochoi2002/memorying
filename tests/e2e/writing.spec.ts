import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

test('production archive omits filters when all writing is draft-only', () => {
  execFileSync('npm', ['run', 'build'], { cwd: process.cwd(), stdio: 'pipe' });
  const archive = readFileSync('dist/writing/index.html', 'utf8');

  expect(archive).toContain('아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.');
  expect(archive).not.toContain('data-writing-filters');
  expect(archive).not.toContain('이 조건에 해당하는 글이 아직 없습니다.');
});
