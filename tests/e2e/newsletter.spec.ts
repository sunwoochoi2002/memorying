import { expect, test } from '@playwright/test';

test('collects only an email and links to the privacy notice', async ({ page }) => {
  await page.goto('/writing/');
  const form = page.getByRole('form', { name: 'Newsletter subscription' });
  await expect(form.getByLabel('Email')).toBeVisible();
  await expect(form.locator('input')).toHaveCount(2);
  await expect(form.locator('input[type="email"]')).toHaveAttribute('name', 'email');
  await expect(form.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
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
  await page.goto('/writing/memorying-start/');
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toBeVisible();
  await page.goto('/writing/small-beginning/');
  await expect(page.getByRole('form', { name: 'Newsletter subscription' })).toHaveCount(0);
});
