import { expect, test } from '@playwright/test';
import {
  articlePath,
  firstPlainLine,
  isoDatetime,
  loadWritingCases,
  originalTitle,
  otherLanguage,
  typeLabel,
  type Language,
  type WritingType,
} from '../support/writing-content';

/**
 * Every expectation about the writing itself is read from the repository, so
 * adding, renaming, or converting an article never needs a test change. The
 * dev server used here shows drafts and loads the test fixtures, so those are
 * part of the expected archive.
 */
const cases = loadWritingCases({ fixtures: true });
const SITE = 'http://localhost:4321';

const statusText = (count: number, type: string) =>
  `Showing ${count} writing item${count === 1 ? '' : 's'}: Type ${type}.`;
const withType = (type: WritingType) => cases.filter((item) => item.type === type);
const buttonName = (language: Language, original: boolean) =>
  language === 'ko' ? (original ? /한국어.*Original/ : /^한국어$/) : (original ? /English.*Original/ : /^English$/);
const link = (slug: string) => `[data-writing-item] a[href="/writing/${slug}/"]`;

// The filter scenarios use whichever type actually exists, so they work for any mix of Essays and Notes.
const filterType: WritingType = withType('note').length > 0 ? 'note' : 'essay';
const filterLabel = typeLabel(filterType);
const otherType: WritingType = filterType === 'note' ? 'essay' : 'note';

test('the repository has writing to check', () => {
  expect(cases.length).toBeGreaterThan(0);
});

test('lists every article newest first with its original-language title, date, and type', async ({ page }) => {
  await page.goto('/writing/');
  const items = page.locator('[data-writing-item]');
  await expect(items).toHaveCount(cases.length);
  await expect(page.locator('[data-filter-status]')).toHaveText(statusText(cases.length, 'All'));

  for (const [index, item] of cases.entries()) {
    const row = items.nth(index);
    const titleLink = row.locator('h2').getByRole('link');
    await expect(row.locator('h2'), item.slug).toHaveAttribute('lang', item.originalLanguage);
    await expect(titleLink, item.slug).toHaveText(originalTitle(item));
    await expect(titleLink, item.slug).toHaveAttribute('href', articlePath(item));
    await expect(row.locator('time'), item.slug).toHaveText(item.publishedAt);
    await expect(row.locator('time'), item.slug).toHaveAttribute('lang', item.originalLanguage);
    await expect(row.locator('time'), item.slug).toHaveAttribute('datetime', isoDatetime(item));
    await expect(row.locator('.writing-list-item__meta > span'), item.slug).toHaveText(typeLabel(item.type));
    await expect(row, item.slug).toHaveAttribute('data-type', item.type);
  }

  await expect(page.locator('[data-filter-group="language"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '한국어' })).toHaveCount(0);
  await expect(page.locator('[data-writing-archive] img')).toHaveCount(0);
  await expect(page.locator('[data-writing-archive] .writing-list-item__copy > p')).toHaveCount(0);
  await expect(page.getByText('최신순으로 모았습니다')).toHaveCount(0);
  await expect(page.locator('.eyebrow')).toHaveCount(0);
});

test('filters writing with canonical URL history, restores state, and focuses reset', async ({ page }) => {
  const matching = withType(filterType);
  const typeFilters = page.locator('[data-filter-group="type"]');
  const status = page.locator('[data-filter-status]');
  await page.goto('/writing/');
  const initialHistoryLength = await page.evaluate(() => history.length);

  const expectFilteredList = async () => {
    await expect(status).toHaveText(statusText(matching.length, filterLabel));
    await expect(page.locator('[data-writing-item]:visible')).toHaveCount(matching.length);
    for (const item of cases) {
      const shown = item.type === filterType;
      await (shown ? expect(page.locator(link(item.slug)), item.slug).toBeVisible() : expect(page.locator(link(item.slug)), item.slug).toBeHidden());
    }
  };

  await typeFilters.getByRole('button', { name: filterLabel }).click();
  await expect(page).toHaveURL(`/writing/?type=${filterType}`);
  await expectFilteredList();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);

  await typeFilters.getByRole('button', { name: filterLabel }).click();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 1);
  await expectFilteredList();

  await typeFilters.getByRole('button', { name: 'All' }).click();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(cases.length, 'All'));
  await expect(typeFilters.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(page.evaluate(() => history.length)).resolves.toBe(initialHistoryLength + 2);

  await page.goBack();
  await expect(page).toHaveURL(`/writing/?type=${filterType}`);
  await expect(typeFilters.getByRole('button', { name: filterLabel })).toHaveAttribute('aria-pressed', 'true');
  await expectFilteredList();

  await page.goForward();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(cases.length, 'All'));

  await page.locator('[data-writing-item]').evaluateAll((items, type) => {
    for (const item of items) (item as HTMLElement).dataset.type = type;
  }, otherType);
  const historyBeforeEmptyState = await page.evaluate(() => history.length);
  await typeFilters.getByRole('button', { name: filterLabel }).click();
  await expect(page).toHaveURL(`/writing/?type=${filterType}`);
  await expect(status).toHaveText(statusText(0, filterLabel));
  await expect(page.locator('[data-writing-item]:visible')).toHaveCount(0);
  const reset = page.locator('[data-reset-filters]');
  await expect(reset).toBeVisible();
  await expect(page.evaluate(() => history.length)).resolves.toBe(historyBeforeEmptyState + 1);

  await reset.click();
  await expect(page).toHaveURL('/writing/');
  await expect(status).toHaveText(statusText(cases.length, 'All'));
  await expect(page.locator('[data-writing-item]:visible')).toHaveCount(cases.length);
  await expect(typeFilters.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(page.evaluate(() => history.length)).resolves.toBe(historyBeforeEmptyState + 2);
});

test('ignores legacy language queries before canonical interaction', async ({ page }) => {
  await page.goto(`/writing/?type=${filterType}&lang=en`);
  const typeFilters = page.locator('[data-filter-group="type"]');
  await expect(typeFilters.getByRole('button', { name: filterLabel })).toHaveAttribute('aria-pressed', 'true');
  for (const item of cases) {
    await (item.type === filterType ? expect(page.locator(link(item.slug)), item.slug).toBeVisible() : expect(page.locator(link(item.slug)), item.slug).toBeHidden());
  }
  await typeFilters.getByRole('button', { name: typeLabel(otherType) }).click();
  await expect(page).toHaveURL(`/writing/?type=${otherType}`);
});

test('synchronizes dynamically added writing archives after a filter click', async ({ page }) => {
  await page.goto('/writing/');
  await page.locator('[data-writing-archive]').evaluate((archive) => {
    const clone = archive.cloneNode(true) as HTMLElement;
    archive.insertAdjacentElement('afterend', clone);
  });

  const firstArchive = page.locator('[data-writing-archive]').nth(0);
  const secondArchive = page.locator('[data-writing-archive]').nth(1);
  await firstArchive.locator('[data-filter-group="type"]').getByRole('button', { name: filterLabel }).click();

  await expect(page).toHaveURL(`/writing/?type=${filterType}`);
  for (const archive of [firstArchive, secondArchive]) {
    await expect(archive.locator('[data-filter-group="type"]').getByRole('button', { name: filterLabel })).toHaveAttribute('aria-pressed', 'true');
    await expect(archive.locator('[data-filter-status]')).toHaveText(statusText(withType(filterType).length, filterLabel));
    for (const item of cases) {
      const row = archive.locator(`a[href="/writing/${item.slug}/"]`);
      await (item.type === filterType ? expect(row, item.slug).toBeVisible() : expect(row, item.slug).toBeHidden());
    }
  }
});

test('server-renders a visible archive list but hides inert enhancement controls without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/writing/');
  for (const item of cases) await expect(page.locator(link(item.slug)), item.slug).toBeVisible();
  await expect(page.locator('[data-writing-item]')).toHaveCount(cases.length);
  await expect(page.locator('[data-writing-filters]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Note' })).toHaveCount(0);
  await context.close();
});

for (const item of cases) {
  const original = item.originalLanguage;
  const other = otherLanguage(item);

  test(`${item.slug}: shows the original language first at one stable URL and switches languages`, async ({ page }) => {
    await page.goto(articlePath(item));
    const title = (language: Language) => page.getByRole('heading', { level: 1, name: item.translations[language].title, exact: true });

    await expect(title(original)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', original);
    await expect(page.getByRole('button', { name: buttonName(original, true) })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: buttonName(other, false) })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator(`[data-language-panel="${original}"]`)).toBeVisible();
    await expect(page.locator(`[data-language-panel="${other}"]`)).toBeHidden();
    const sentence = firstPlainLine(item.translations[original].body);
    if (sentence) await expect(page.locator(`[data-language-panel="${original}"]`)).toContainText(sentence);

    await expect(page.locator('.meta time').first()).toHaveText(item.publishedAt);
    await expect(page.locator('.meta time').first()).toHaveAttribute('datetime', isoDatetime(item));
    await expect(page.locator('.article-header .meta')).toContainText(typeLabel(item.type));
    await expect(page.locator('.article-header .meta')).toHaveAttribute('lang', original);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${articlePath(item)}`);
    await expect(page.locator('meta[name="description"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(0);
    await expect(page.locator('.article-header__description')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to Writing' })).toBeVisible();
    await expect(page.locator('[data-writing-cover]')).toHaveCount(item.cover ? 1 : 0);

    const initialUrl = page.url();
    await page.getByRole('button', { name: buttonName(other, false) }).click();
    await expect(title(other)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    await expect(page.locator(`[data-language-panel="${other}"]`)).toBeVisible();
    await expect(page.locator(`[data-language-panel="${original}"]`)).toBeHidden();
    await expect(page.locator('.meta time').first()).toHaveText(item.publishedAt);
    if (item.cover) await expect(page.locator('[data-writing-cover] img')).toHaveAttribute('alt', item.cover.alt[other]);
    expect(page.url()).toBe(initialUrl);

    await page.reload();
    await expect(title(original)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', original);
  });

  test(`${item.slug}: keeps the original text readable without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(articlePath(item));
    await expect(page.getByRole('heading', { level: 1, name: originalTitle(item), exact: true })).toBeVisible();
    await expect(page.locator(`[data-language-panel="${original}"]`)).toBeVisible();
    await expect(page.locator(`[data-language-panel="${other}"]`)).toBeHidden();
    await expect(page.locator('[data-language-toggle]')).toBeHidden();
    await context.close();
  });

  test(`${item.slug}: offers the subscription form after an Essay but not after a Note`, async ({ page }) => {
    await page.goto(articlePath(item));
    await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(item.type === 'essay' ? 1 : 0);
  });
}

test('wraps Korean and English detail titles only at word boundaries', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(articlePath(cases[0]));

  const original = cases[0].originalLanguage;
  const other = otherLanguage(cases[0]);
  const titleOf = (language: Language) => page.locator(`h1[data-language-fragment="${language}"]`);

  await expect(titleOf(original)).toBeVisible();
  await page.getByRole('button', { name: buttonName(other, false) }).click();
  await expect(titleOf(other)).toBeVisible();

  for (const language of [original, other]) {
    await expect(titleOf(language)).toHaveCSS('font-size', '32px');
    await expect(titleOf(language)).toHaveCSS('word-break', 'keep-all');
    await expect(titleOf(language)).toHaveCSS('overflow-wrap', 'normal');
    await expect(titleOf(language)).toHaveCSS('hyphens', 'none');
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(titleOf(other)).toHaveCSS('font-size', '38px');
});

test('sets writing in the self-hosted serif typefaces', async ({ page }) => {
  const koreanOriginal = cases.find((item) => item.originalLanguage === 'ko');
  expect(koreanOriginal, 'a Korean-original article (a fixture guarantees one)').toBeDefined();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(articlePath(koreanOriginal!));

  const brand = page.getByRole('link', { name: 'Sunwoo Choi' });
  await expect(brand).toHaveCSS('font-family', /^"?Instrument Serif"?,/);
  await expect(page.locator('h1[data-language-fragment="ko"]')).toHaveCSS('font-family', /^"?Instrument Serif"?,.*Noto Serif KR Variable/);

  const koreanBody = page.locator('[data-language-panel="ko"] p').first();
  await expect(koreanBody).toHaveCSS('font-family', /^"?Noto Serif KR Variable"?,/);
  await expect(koreanBody).toHaveCSS('font-size', '17px');

  await page.getByRole('button', { name: 'English' }).click();
  const englishBody = page.locator('[data-language-panel="en"] p').first();
  await expect(englishBody).toHaveCSS('font-family', /^"?Instrument Serif"?,/);
  await expect(englishBody).toHaveCSS('font-size', '21px');

  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replaceAll('"', ''));
  });
  expect(loadedFamilies).toContain('Instrument Serif');
  expect(loadedFamilies).toContain('Noto Serif KR Variable');
});

const covered = cases.filter((item) => item.cover);

test('at least one article has a cover to check', () => {
  expect(covered.length).toBeGreaterThan(0);
});

for (const [width, side] of [[1280, 624], [390, 342]] as const) {
  test(`frames every cover in the same white square at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const frames: { width: number; height: number }[] = [];

    for (const item of covered) {
      await page.goto(articlePath(item));
      const frame = page.locator('[data-writing-cover]');
      await expect(frame, item.slug).toHaveCount(1);
      const image = frame.locator('img');

      await expect(frame).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(frame).toHaveCSS('border-top-width', '1px');
      await expect(image).toHaveCSS('object-fit', 'contain');
      await expect(image, item.slug).toHaveAttribute('alt', item.cover!.alt[item.originalLanguage]);
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0), { message: item.slug }).toBe(true);

      const box = await frame.boundingBox();
      expect(box, item.slug).not.toBeNull();
      expect(Math.abs(box!.width - side), `${item.slug} frame width`).toBeLessThanOrEqual(1);
      expect(Math.abs(box!.height - box!.width), `${item.slug} frame is square`).toBeLessThanOrEqual(1);
      frames.push({ width: box!.width, height: box!.height });

      const imageBox = await image.boundingBox();
      expect(imageBox!.width).toBeLessThanOrEqual(box!.width);
      expect(imageBox!.height).toBeLessThanOrEqual(box!.height);
    }

    for (const size of frames) {
      expect(Math.abs(size.width - frames[0].width)).toBeLessThanOrEqual(1);
      expect(Math.abs(size.height - frames[0].height)).toBeLessThanOrEqual(1);
    }
  });
}

test('places the cover between the article header and the text', async ({ page }) => {
  await page.goto(articlePath(covered[0]));
  const header = await page.locator('.article-header').boundingBox();
  const cover = await page.locator('[data-writing-cover]').boundingBox();
  const prose = await page.locator('.prose').boundingBox();
  expect(header!.y + header!.height).toBeLessThanOrEqual(cover!.y + 1);
  expect(cover!.y + cover!.height).toBeLessThanOrEqual(prose!.y + 1);
});

test('keeps navigation available on the noindex 404 page', async ({ page }) => {
  const response = await page.goto('/missing-memory/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('기억 속에 남아 있지 않습니다');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Writing 둘러보기' })).toBeVisible();
});
