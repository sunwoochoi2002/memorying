import { expect, test } from '@playwright/test';

const statusText = (count: number, type: string) =>
  `Showing ${count} writing item${count === 1 ? '' : 's'}: Type ${type}.`;

test('filters writing with canonical URL history, restores state, and focuses reset', async ({ page }) => {
  await page.goto('/writing/');
  const typeFilters = page.locator('[data-filter-group="type"]');
  const status = page.locator('[data-filter-status]');
  const initialHistoryLength = await page.evaluate(() => history.length);

  await expect(page.locator('[data-filter-group="language"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '한국어' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(page.locator('[data-writing-item]')).toHaveCount(2);
  await expect(page.locator('[data-writing-archive] img')).toHaveCount(0);
  await expect(status).toHaveText(statusText(2, 'All'));

  const koreanWriting = page.locator('[data-writing-item]').filter({ hasText: 'Memorying을 시작하며' });
  await expect(koreanWriting.locator('h2')).toHaveAttribute('lang', 'ko');
  await expect(koreanWriting.locator('.writing-list-item__copy > p')).toHaveAttribute('lang', 'ko');
  await expect(koreanWriting.locator('time')).toHaveAttribute('lang', 'ko');
  await expect(koreanWriting.locator('time')).toHaveText('2026-07-24');

  const englishWriting = page.locator('[data-writing-item]').filter({ hasText: 'A small beginning' });
  await expect(englishWriting.locator('h2')).toHaveAttribute('lang', 'en');
  await expect(englishWriting.locator('.writing-list-item__copy > p')).toHaveAttribute('lang', 'en');
  await expect(englishWriting.locator('time')).toHaveAttribute('lang', 'en');
  await expect(englishWriting.locator('time')).toHaveText('2026-07-23');

  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(status).toHaveText(statusText(1, 'Note'));
  await expect(page.locator('[data-writing-item]:visible')).toHaveCount(1);
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);
  await expect(status).toHaveText(statusText(1, 'Note'));

  await typeFilters.getByRole('button', { name: 'All' }).click();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(2, 'All'));
  await expect(typeFilters.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 2);

  await page.goBack();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(typeFilters.getByRole('button', { name: 'Note' })).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText(statusText(1, 'Note'));
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(2, 'All'));

  await page.locator('[data-writing-item]').evaluateAll((items) => {
    for (const item of items) (item as HTMLElement).dataset.type = 'essay';
  });
  const historyBeforeEmptyState = await page.evaluate(() => history.length);
  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
  await expect(status).toHaveText(statusText(0, 'Note'));
  await expect(page.locator('[data-writing-item]:visible')).toHaveCount(0);
  const reset = page.locator('[data-reset-filters]');
  await expect(reset).toBeVisible();
  await expect(page.evaluate(() => history.length)).resolves.toBe(historyBeforeEmptyState + 1);

  await reset.click();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(2, 'All'));
  await expect(page.locator('[data-writing-item]:visible')).toHaveCount(2);
  await expect(typeFilters.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(page.evaluate(() => history.length)).resolves.toBe(historyBeforeEmptyState + 2);
});

test('ignores legacy language queries before canonical interaction', async ({ page }) => {
  await page.goto('/writing/?type=essay&lang=en');
  const typeFilters = page.locator('[data-filter-group="type"]');
  await expect(typeFilters.getByRole('button', { name: 'Essay' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await typeFilters.getByRole('button', { name: 'Note' }).click();
  await expect(page).toHaveURL('/writing/?type=note');
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
  await expect(firstArchive.locator('[data-filter-status]')).toHaveText(statusText(1, 'Note'));
  await expect(secondArchive.locator('[data-filter-status]')).toHaveText(statusText(1, 'Note'));
  await expect(firstArchive.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(secondArchive.getByRole('link', { name: 'Memorying을 시작하며' })).toBeHidden();
  await expect(firstArchive.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(secondArchive.getByRole('link', { name: 'A small beginning' })).toBeVisible();
});

test('server-renders a visible archive list but hides inert enhancement controls without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/writing/');
  await expect(page.getByRole('link', { name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A small beginning' })).toBeVisible();
  await expect(page.locator('[data-writing-item]')).toHaveCount(2);
  await expect(page.locator('[data-writing-filters]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Note' })).toHaveCount(0);
  await context.close();
});

test('renders original-first bilingual articles at one stable URL', async ({ page, browser }) => {
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('button', { name: /한국어.*Original/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-language-panel="ko"]')).toBeVisible();
  await expect(page.locator('[data-language-panel="en"]')).toBeHidden();
  await expect(page.locator('[data-writing-cover] img')).toHaveCount(1);
  await expect(page.locator('[data-writing-cover] img')).toHaveAttribute('alt', '저녁빛 아래 겹쳐진 기억의 풍경');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4321/writing/memorying-start/',
  );
  await expect(page.getByRole('link', { name: 'Back to Writing' })).toBeVisible();
  const publishedDate = page.locator('.meta time').first();
  await expect(publishedDate).toHaveText('2026-07-24');
  await expect(publishedDate).toHaveAttribute('datetime', '2026-07-24T00:00:00.000Z');

  const initialUrl = page.url();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Beginning Memorying' })).toBeVisible();
  await expect(page.locator('[data-language-panel="en"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-writing-cover] img')).toHaveAttribute('alt', 'Layered memory landscapes in evening light');
  await expect(publishedDate).toHaveText('2026-07-24');
  expect(page.url()).toBe(initialUrl);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');

  await page.goto('/writing/small-beginning/');
  await expect(page.getByRole('heading', { level: 1, name: 'A small beginning' })).toBeVisible();
  await expect(page.getByRole('button', { name: /English.*Original/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-writing-cover]')).toHaveCount(0);

  const noJavaScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noJavaScriptPage = await noJavaScriptContext.newPage();
  await noJavaScriptPage.goto('/writing/memorying-start/');
  await expect(noJavaScriptPage.getByRole('heading', { level: 1, name: 'Memorying을 시작하며' })).toBeVisible();
  await expect(noJavaScriptPage.locator('[data-language-panel="ko"]')).toBeVisible();
  await expect(noJavaScriptPage.locator('[data-language-panel="ko"]')).toContainText('시간이 지나도 잊고 싶지 않은 것들을 기록합니다.');
  await expect(noJavaScriptPage.locator('[data-language-panel="en"]')).toBeHidden();
  await noJavaScriptContext.close();
});

test('wraps Korean and English detail titles only at word boundaries', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/writing/memorying-start/');

  const koreanTitle = page.locator('h1[data-language-fragment="ko"]');
  await expect(koreanTitle).toBeVisible();
  await expect(koreanTitle).toHaveCSS('font-size', '33.28px');
  await expect(koreanTitle).toHaveCSS('word-break', 'keep-all');
  await expect(koreanTitle).toHaveCSS('overflow-wrap', 'normal');
  await expect(koreanTitle).toHaveCSS('hyphens', 'none');

  await page.getByRole('button', { name: 'English' }).click();
  const englishTitle = page.locator('h1[data-language-fragment="en"]');
  await expect(englishTitle).toBeVisible();
  await expect(englishTitle).toHaveCSS('font-size', '33.28px');
  await expect(englishTitle).toHaveCSS('word-break', 'keep-all');
  await expect(englishTitle).toHaveCSS('overflow-wrap', 'normal');
  await expect(englishTitle).toHaveCSS('hyphens', 'none');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('keeps navigation available on the noindex 404 page', async ({ page }) => {
  const response = await page.goto('/missing-memory/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('기억 속에 남아 있지 않습니다');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Writing 둘러보기' })).toBeVisible();
});
