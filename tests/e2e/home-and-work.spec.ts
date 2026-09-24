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

test('about leads with selected affiliations and retains the full resume by category', async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/about/');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page.getByText(/추천 시스템, 강화학습, Interactive ML/)).toBeVisible();
    const affiliations = page.getByRole('list', { name: 'Selected Affiliations' });
    await expect(affiliations.getByRole('listitem')).toHaveCount(4);
    await expect(affiliations.locator('.entry-title')).toHaveText([
      'Military Service @ Republic of Korea Army (ROKA)',
      'Data Analytics Intern @ Chartmetric',
      'Exchange Student @ TU Delft',
      'Mathematics @ POSTECH',
    ]);
    await expect(affiliations.getByText(/2026년 2월부터 대한민국 육군에서 복무/)).toBeVisible();
    await expect(affiliations.getByText(/수학을 전공/)).toBeVisible();
    await expect(page.getByRole('list', { name: 'Work & Research' }).getByRole('listitem')).toHaveCount(6);
    await expect(page.getByRole('list', { name: 'Activities' }).getByRole('listitem')).toHaveCount(11);
    await expect(page.getByRole('list', { name: 'Projects & Achievements' }).getByRole('listitem')).toHaveCount(8);
    await expect(page.getByRole('list', { name: 'Additional Education' }).getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('list', { name: 'Work & Research' }).getByText('Data Analytics Intern @ Chartmetric')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Activities' }).getByText('Exchange Student @ TU Delft')).toBeVisible();
    for (const title of await page.locator('.entry-title').allTextContents()) {
      expect(title).not.toMatch(/[가-힣]/);
    }
    await expect(page.getByText('아래는 예시 이력입니다. 실제 이력으로 교체할 예정입니다.')).toHaveCount(0);
    await expect(page.locator('main img')).toHaveCount(0);
    for (const privateText of ['GPA', 'TOEFL', 'Year of birth', 'Academic Excellence Recognition', 'sunwoochoi@postech.ac.kr']) {
      await expect(page.locator('main').getByText(privateText, { exact: false })).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('about timeline uses a continuous line and a node for each dated item', async ({ page }) => {
  await page.goto('/about/');
  for (const list of await page.locator('.about-entry-list').all()) {
    const line = await list.evaluate((element) => {
      const style = getComputedStyle(element, '::before');
      return { content: style.content, backgroundColor: style.backgroundColor };
    });
    const node = await list.locator('li').first().evaluate((element) => {
      const style = getComputedStyle(element, '::before');
      return { content: style.content, backgroundColor: style.backgroundColor };
    });
    expect(line.content).toBe('""');
    expect(node.content).toBe('""');
    expect(line.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(node.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('about timelines run from newer to older start dates', async ({ page }) => {
  await page.goto('/about/');
  for (const list of await page.locator('.about-entry-list').all()) {
    const dates = (await list.locator('.entry-period').allTextContents()).map((period) => period.slice(0, 7));
    expect(dates.length).toBeGreaterThan(0);
    for (let index = 1; index < dates.length; index += 1) {
      expect(dates[index - 1] >= dates[index]).toBe(true);
    }
  }
});

test('work introduces the personal archive', async ({ page }) => {
  await page.goto('/work/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sunwoo’s Archive' })).toBeVisible();
});

test('about keeps English titles, expands details on demand, and translates open content', async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/about/');
    const korean = page.getByRole('button', { name: '한국어', exact: true });
    const english = page.getByRole('button', { name: 'English', exact: true });
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(english).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    const projects = page.locator('[data-about-list="projects"]');
    const affiliations = page.locator('[data-about-list="affiliations"]');
    const army = affiliations.getByRole('listitem').filter({ hasText: 'Military Service @ Republic of Korea Army (ROKA)' });
    const chartmetric = affiliations.getByRole('listitem').filter({ hasText: 'Data Analytics Intern @ Chartmetric' });
    await expect(army.getByText(/대한민국 육군에서 복무/)).toBeVisible();
    await expect(army.getByText(/serving in the Republic of Korea Army/)).toBeHidden();
    await expect(chartmetric.getByText(/신뢰할 수 있는 데이터, 시각화, 심층 인사이트/)).toBeVisible();
    const jarvis = projects.getByRole('listitem').filter({ hasText: 'JARVIS' });
    await expect(jarvis.locator('.entry-title')).toHaveText('JARVIS');
    await expect(army.locator('.entry-title')).toHaveText('Military Service @ Republic of Korea Army (ROKA)');
    await expect(jarvis.locator('details')).not.toHaveAttribute('open', '');
    await expect(jarvis.getByText(/로컬 파일/)).toBeHidden();
    await jarvis.getByText('자세히 보기').click();
    await expect(jarvis.locator('details')).toHaveAttribute('open', '');
    await expect(jarvis.getByText(/로컬 파일/)).toBeVisible();
    await expect(jarvis.getByText(/local files/)).toBeHidden();

    await english.focus();
    await page.keyboard.press('Enter');
    await expect(english).toBeFocused();
    await expect(english).toHaveAttribute('aria-pressed', 'true');
    await expect(korean).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(army.getByText(/serving in the Republic of Korea Army/)).toBeVisible();
    await expect(army.getByText(/대한민국 육군에서 복무/)).toBeHidden();
    await expect(chartmetric.getByText(/reliable data, beautiful visuals, in-depth insights/)).toBeVisible();
    await expect(jarvis.locator('details')).toHaveAttribute('open', '');
    await expect(jarvis.getByText(/local files/)).toBeVisible();
    await expect(jarvis.getByText(/로컬 파일/)).toBeHidden();
    await expect(jarvis.locator('.entry-title')).toHaveText('JARVIS');
    await expect(page.getByText(/I study recommender systems, reinforcement learning, and Interactive ML/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

    await korean.click();
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(jarvis.getByText(/로컬 파일/)).toBeVisible();
    await english.click();
    await page.reload();
    await expect(korean).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(projects.getByRole('listitem')).toHaveCount(8);
    await expect(projects.getByRole('listitem').filter({ hasText: 'JARVIS' }).locator('details')).not.toHaveAttribute('open', '');
  }
});

test('about keeps Korean content and native details available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/about/');
    await expect(page.getByText(/추천 시스템, 강화학습, Interactive ML/)).toBeVisible();
    await expect(page.locator('[data-language-toggle]')).toBeHidden();
    const jarvis = page.getByRole('list', { name: 'Projects & Achievements' }).getByRole('listitem').filter({ hasText: 'JARVIS' });
    await jarvis.getByText('자세히 보기').click();
    await expect(jarvis.getByText(/로컬 파일/)).toBeVisible();
  } finally {
    await context.close();
  }
});
