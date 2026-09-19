import { expect, test } from '@playwright/test';
import { articlePath, loadWritingCases } from '../support/writing-content';

const cases = loadWritingCases({ fixtures: true });
const essay = cases.find((item) => item.type === 'essay');
const note = cases.find((item) => item.type === 'note');

test('collects only an email and links to the privacy notice', async ({ page }) => {
  await page.goto('/writing/');
  const form = page.getByRole('form', { name: 'Newsletter subscription' });
  await expect(form.getByLabel('Email')).toBeVisible();
  await expect(form.locator('input')).toHaveCount(2);
  await expect(form.locator('input[type="email"]')).toHaveAttribute('name', 'email');
  await expect(page.locator('.newsletter').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
});

test('invites subscription in plain words without boxes or old copy', async ({ page }) => {
  await page.goto('/writing/');
  const newsletter = page.getByRole('complementary').filter({ has: page.getByRole('form', { name: 'Newsletter subscription' }) });
  await expect(newsletter.getByRole('heading', { level: 2, name: '새 에세이를 이메일로 받아 보세요.' })).toBeVisible();
  await expect(newsletter).toContainText('새 에세이가 올라오면 남겨 주신 이메일 주소로 보내 드립니다. 구독은 언제든 취소할 수 있습니다.');
  await expect(newsletter).not.toContainText('Subscribe to new Essays');
  await expect(newsletter).not.toContainText('Note는 기본 발송 대상이 아닙니다');
  await expect(newsletter.getByLabel('Email')).toHaveAttribute('placeholder', 'you@example.com');
  await expect(newsletter).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(newsletter).toHaveCSS('border-top-width', '1px');
  await expect(newsletter).toHaveCSS('border-left-width', '0px');

  expect(essay, 'an Essay (a fixture guarantees one)').toBeDefined();
  await page.goto(articlePath(essay!));
  await expect(page.getByRole('heading', { level: 2, name: '새 에세이를 이메일로 받아 보세요.' })).toBeVisible();
});

test('uses browser validation and posts valid email directly to Buttondown', async ({ page }) => {
  await page.goto('/writing/');
  const email = page.getByRole('form', { name: 'Newsletter subscription' }).getByLabel('Email');
  await email.fill('invalid');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);

  let posted = '';
  await page.route('https://buttondown.com/api/emails/embed-subscribe/memorying-test', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<h1>Check your inbox</h1>',
    });
  });
  await email.fill('reader@example.com');
  await Promise.all([
    page.waitForURL('https://buttondown.com/api/emails/embed-subscribe/memorying-test'),
    page.getByRole('button', { name: 'Subscribe' }).click(),
  ]);
  expect(posted).toContain('email=reader%40example.com');
  expect(posted).toContain('embed=1');
});

test('shows the secondary subscription form after an Essay but not a Note', async ({ page }) => {
  expect(essay, 'an Essay (a fixture guarantees one)').toBeDefined();
  expect(note, 'a Note (a fixture guarantees one)').toBeDefined();
  await page.goto(articlePath(essay!));
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toBeVisible();
  await page.goto(articlePath(note!));
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(0);
});
