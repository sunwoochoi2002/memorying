import { expect, test } from '@playwright/test';

test('four-page navigation and compact About work on narrow screens', async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/about/');
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link')).toHaveText(['About', 'Writing', 'Projects', 'Experience']);
    await expect(page.locator('main h2')).toHaveText(['Selected Affiliations']);
    await expect(page.locator('main details')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Selected Affiliations' }).getByRole('listitem')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('About connects affiliations chronologically with a timeline line and nodes', async ({ page }) => {
  await page.goto('/about/');
  const list = page.getByRole('list', { name: 'Selected Affiliations' });
  const line = await list.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return { content: style.content, width: style.width };
  });
  expect(line).toEqual({ content: '""', width: '1px' });
  const nodes = await list.getByRole('listitem').evaluateAll((items) =>
    items.map((item) => {
      const style = getComputedStyle(item, '::before');
      return { content: style.content, radius: style.borderRadius };
    }),
  );
  expect(nodes).toEqual(Array.from({ length: 4 }, () => ({ content: '""', radius: '50%' })));
});

test('Projects and Experience render bilingual details and section anchors', async ({ page }) => {
  await page.goto('/projects/');
  for (const name of ['Sunwoo’s Archive', 'JARVIS', 'BERA']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  const jarvis = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'JARVIS', exact: true }) });
  await expect(jarvis.getByText(/로컬 파일/)).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(jarvis.getByText(/indexes local files/)).toBeVisible();
  await page.goto('/experience/');
  for (const heading of ['Education', 'Work & Research', 'Activities & Leadership', 'Awards']) await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Experience sections' }).getByRole('link', { name: 'Awards' }).click();
  await expect(page).toHaveURL(/#awards$/);
});

test('legacy Work leads to Projects and Korean content works without JavaScript', async ({ browser, page }) => {
  await page.goto('/work/');
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole('heading', { name: 'JARVIS', exact: true })).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const noJs = await context.newPage();
    await noJs.goto('/experience/');
    await expect(noJs.locator('[data-language-toggle]')).toBeHidden();
    const details = noJs.locator('main details').first();
    await details.locator('summary').click();
    await expect(details.locator('p[data-language-fragment="ko"]').first()).toBeVisible();
  } finally { await context.close(); }
});
