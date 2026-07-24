import { expect, test } from '@playwright/test';

test('shows all writing and combines type and language filters', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.getByRole('button', { name: '한국어' }).click();
  await expect(page).toHaveURL('/writing/?type=note&lang=ko');
  await expect(page.getByText('이 조건에 해당하는 글이 아직 없습니다.')).toBeVisible();

  await page.getByRole('button', { name: '모든 글 보기' }).click();
  await expect(page).toHaveURL('/writing/');
});

test('restores valid query state and ignores unsupported query values', async ({ page }) => {
  await page.goto('/writing/?type=essay&lang=ko');
  await expect(page.getByRole('button', { name: 'Essay' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '한국어' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/writing/?type=article&lang=jp');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
});

test('server-renders the full archive when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await context.close();
});
