import { test, expect } from '@playwright/test';

async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(profile|my-events|create-event)/, { timeout: 30000 });
}

test.describe('Event Reports', () => {
  test('юзер жалуется на событие → toast «Жалоба отправлена»', async ({
    page,
  }) => {
    await login(page, 'ivan@example.com', 'password123');

    await page.goto('/');
    const eventLink = page.locator('[data-slot="event-card"] a').first();
    if ((await eventLink.count()) === 0) {
      test.skip(true, 'Нет событий в ленте');
      return;
    }
    await eventLink.click();

    const reportBtn = page.getByLabel('Пожаловаться');
    if ((await reportBtn.count()) === 0) {
      test.skip(true, 'Кнопка «Пожаловаться» не видна (юзер — автор)');
      return;
    }
    await reportBtn.click();

    await expect(
      page.locator('[data-slot="dialog-title"]'),
    ).toContainText('Пожаловаться');

    await page.locator('input[value="SPAM"]').click();
    await page.getByRole('button', { name: 'Отправить' }).click();

    await expect(page.getByText('Жалоба отправлена')).toBeVisible();
  });

  test('кнопка «Пожаловаться» не видна для автора события', async ({
    page,
  }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/my-events');
    const approvedTab = page.getByRole('tab', { name: /Опубликованы/ });
    await approvedTab.click();

    const eventLink = page.locator('[data-slot="my-event-card"] a').first();
    if ((await eventLink.count()) === 0) {
      test.skip(true, 'Нет опубликованных событий');
      return;
    }
    await eventLink.click();

    await expect(page.getByLabel('Пожаловаться')).not.toBeVisible();
  });

  test('кнопка «Пожаловаться» не видна для гостей', async ({ page }) => {
    await page.goto('/');
    const eventLink = page.locator('[data-slot="event-card"] a').first();
    if ((await eventLink.count()) === 0) {
      test.skip(true, 'Нет событий в ленте');
      return;
    }
    await eventLink.click();

    await expect(page.getByLabel('Пожаловаться')).not.toBeVisible();
  });
});
