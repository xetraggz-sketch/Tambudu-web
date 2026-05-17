import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(profile|my-events|create-event)/, { timeout: 30000 });
}

test.describe('Event Registration', () => {
  test('записаться на бесплатное событие', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/');
    const freeCard = page.locator('[data-slot="event-card"]').filter({
      has: page.locator('.tb-badge-olive', { hasText: 'Бесплатно' }),
    }).first();

    if (await freeCard.count() === 0) {
      test.skip(true, 'Нет бесплатных событий в ленте');
      return;
    }

    await freeCard.click();
    await page.waitForURL(/\/events\//, { timeout: 30000 });

    const actions = page.locator('[data-slot="event-actions"]');
    const registerBtn = actions.getByRole('button', { name: 'Записаться' });

    if (await registerBtn.count() === 0) {
      test.skip(true, 'Кнопка записи недоступна (автор или уже записан)');
      return;
    }

    await registerBtn.click();
    await expect(page.locator('[data-slot="event-actions"]').getByRole('button', { name: 'Отменить запись' })).toBeVisible({ timeout: 10000 });
  });

  test('незалогиненный юзер видит кнопку Войти', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('[data-slot="event-card"]').first();

    if (await card.count() === 0) {
      test.skip(true, 'Нет событий в ленте');
      return;
    }

    await card.click();
    await page.waitForURL(/\/events\//, { timeout: 30000 });

    const actions = page.locator('[data-slot="event-actions"]');
    await expect(
      actions.getByRole('link', { name: /Войти/ }),
    ).toBeVisible();
  });

  test('платное событие показывает AlertDialog перед оплатой', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/');
    const paidCard = page.locator('[data-slot="event-card"]').filter({
      hasNot: page.locator('.tb-badge-olive'),
    }).first();

    if (await paidCard.count() === 0) {
      test.skip(true, 'Нет платных событий в ленте');
      return;
    }

    await paidCard.click();
    await page.waitForURL(/\/events\//, { timeout: 30000 });

    const actions = page.locator('[data-slot="event-actions"]');
    const registerBtn = actions.getByRole('button', { name: 'Записаться' });

    if (await registerBtn.count() === 0) {
      test.skip(true, 'Кнопка записи недоступна');
      return;
    }

    await registerBtn.click();

    await expect(
      page.locator('[data-slot="alert-dialog-title"]'),
    ).toContainText('Списать');
  });
});
