import { expect, test } from '@playwright/test';
import {
  articlePath,
  categoryPath,
  findWritingCategory,
  firstPlainLine,
  isoDatetime,
  loadCategories,
  loadWritingCases,
  originalTitle,
  otherLanguage,
  type Language,
} from '../support/writing-content';

/**
 * Every expectation about the writing itself is read from the repository, so
 * adding, renaming, or converting an article never needs a test change. The
 * dev server used here shows drafts and loads the test fixtures, so those are
 * part of the expected archive.
 */
const cases = loadWritingCases({ fixtures: true });
const categories = loadCategories();
const categoryOf = (slug: string) => findWritingCategory(categories, slug);
const SITE = 'http://localhost:4321';

const withCategory = (category: string) => cases.filter((item) => item.category === category);
const buttonName = (language: Language, original: boolean) =>
  language === 'ko' ? (original ? /한국어.*Original/ : /^한국어$/) : (original ? /English.*Original/ : /^English$/);
const link = (slug: string) => `[data-writing-item] a[href="/writing/${slug}/"]`;
const EMPTY_STATE = '이 카테고리에는 아직 공개된 글이 없습니다.';

/** Every archive page: 전체보기 first, then the registered categories in registry order. */
const archivePages = [
  { path: '/writing/', name: '전체보기', items: cases, category: undefined },
  ...categories.map((category) => ({
    path: categoryPath(category.slug),
    name: category.name.ko,
    items: withCategory(category.slug),
    category: category.slug,
  })),
];

test('the repository has writing to check', () => {
  expect(cases.length).toBeGreaterThan(0);
});

test('the category sidebar counts the listed writing in registry order and marks the current page', async ({ page }) => {
  for (const current of archivePages) {
    await page.goto(current.path);
    const sidebar = page.getByRole('navigation', { name: '카테고리' });
    const links = sidebar.getByRole('link');
    await expect(links, current.path).toHaveCount(archivePages.length);

    for (const [index, entry] of archivePages.entries()) {
      const entryLink = links.nth(index);
      await expect(entryLink, `${current.path}: ${entry.path}`).toHaveAttribute('href', entry.path);
      await expect(entryLink.locator('.category-nav__count'), `${current.path}: ${entry.path}`).toHaveText(String(entry.items.length));
      await expect(entryLink, `${current.path}: ${entry.path}`).toContainText(entry.name);
      if (entry === current) await expect(entryLink, entry.path).toHaveAttribute('aria-current', 'page');
      else expect(await entryLink.getAttribute('aria-current'), `${current.path}: ${entry.path}`).toBeNull();
    }
    await expect(sidebar.locator('details')).toHaveCount(0);
  }
});

for (const current of archivePages) {
  test(`${current.path} lists exactly its writing newest first`, async ({ page }) => {
    await page.goto(current.path);
    await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();
    await expect(page.locator('.writing-archive__name')).toHaveText(current.name);
    await expect(page.locator('.writing-archive__count')).toContainText(String(current.items.length));

    const items = page.locator('[data-writing-item]');
    await expect(items).toHaveCount(current.items.length);
    await expect(page.locator('.empty-state')).toHaveCount(current.items.length ? 0 : 1);
    if (current.items.length === 0) await expect(page.locator('.empty-state')).toHaveText(EMPTY_STATE);

    for (const [index, item] of current.items.entries()) {
      const row = items.nth(index);
      const titleLink = row.locator('h2').getByRole('link');
      await expect(row.locator('h2'), item.slug).toHaveAttribute('lang', item.originalLanguage);
      await expect(titleLink, item.slug).toHaveText(originalTitle(item));
      await expect(titleLink, item.slug).toHaveAttribute('href', articlePath(item));
      await expect(row.locator('time'), item.slug).toHaveText(item.publishedAt);
      await expect(row.locator('time'), item.slug).toHaveAttribute('lang', item.originalLanguage);
      await expect(row.locator('time'), item.slug).toHaveAttribute('datetime', isoDatetime(item));
      await expect(row, item.slug).toHaveAttribute('data-category', item.category);

      // Rows name their category on 전체보기 only; on a category page every row shares it.
      const label = row.locator('.writing-list-item__meta > span');
      if (current.category === undefined) {
        await expect(label, item.slug).toHaveText(categoryOf(item.category).name.ko);
        await expect(label, item.slug).toHaveAttribute('lang', 'ko');
      } else {
        await expect(label, item.slug).toHaveCount(0);
      }
    }

    await expect(page.locator('[data-writing-archive] img')).toHaveCount(0);
    await expect(page.locator('[data-writing-archive] .writing-list-item__copy > p')).toHaveCount(0);
    await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(1);
  });
}

test('sends legacy ?type= links to the category page and leaves unknown types on 전체보기', async ({ page }) => {
  for (const category of categories) {
    await page.goto(`/writing/?type=${category.slug}`);
    await expect(page).toHaveURL(categoryPath(category.slug));
    await page.goto(`/writing/?type=${category.slug}&lang=en`);
    await expect(page).toHaveURL(categoryPath(category.slug));
  }

  const unknown = `not-${categories.map((category) => category.slug).join('-')}`;
  await page.goto(`/writing/?type=${unknown}`);
  await expect(page.locator('[data-writing-item]')).toHaveCount(cases.length);
  await expect(page).toHaveURL(`/writing/?type=${unknown}`);
});

test('server-renders the archive and category pages without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const current of archivePages) {
    await page.goto(current.path);
    await expect(page.locator('[data-writing-item]'), current.path).toHaveCount(current.items.length);
    for (const item of current.items) await expect(page.locator(link(item.slug)), item.slug).toBeVisible();
    await expect(page.getByRole('navigation', { name: '카테고리' }).getByRole('link'), current.path).toHaveCount(archivePages.length);
  }
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
    const category = categoryOf(item.category);
    const categoryLink = page.locator('.article-header .meta a');
    await expect(categoryLink).toHaveAttribute('href', categoryPath(item.category));
    await expect(categoryLink).toHaveText(category.name[original], { useInnerText: true });
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
    await expect(categoryLink).toHaveText(category.name[other], { useInnerText: true });
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

  test(`${item.slug}: offers the subscription form only after writing in a newsletter category`, async ({ page }) => {
    await page.goto(articlePath(item));
    await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(categoryOf(item.category).newsletter ? 1 : 0);
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
  await expect(koreanBody).toHaveCSS('font-size', '16px');

  await page.getByRole('button', { name: 'English' }).click();
  const englishBody = page.locator('[data-language-panel="en"] p').first();
  await expect(englishBody).toHaveCSS('font-family', /^"?Instrument Serif"?,/);
  await expect(englishBody).toHaveCSS('font-size', '20px');

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
