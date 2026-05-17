import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(profile|my-events|create-event)/, { timeout: 30000 });
}

test.describe('Create Event', () => {
  test('залогиненный юзер создаёт событие → редирект на /my-events', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/create-event');
    await expect(page.locator('h1')).toContainText('Создать событие');

    await page.fill('#title', 'Тестовая лекция E2E');
    await page.fill('#description', 'Это описание тестового события для E2E теста');

    await page.locator('[data-slot="select-trigger"]').click();
    await page.locator('[data-slot="select-item"]').first().click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('#startsAt-date', dateStr!);
    await page.fill('#startsAt-time', '18:00');

    await page.fill('#address', 'ул. Тестовая, 1, Самара');
    await page.fill('#priceRubles', '0');

    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();

    await page.waitForURL('/my-events', { timeout: 30000 });
    await expect(page.locator('[data-slot="my-event-card"]').first()).toBeVisible();
  });

  test('пустой title → форма не отправляется, показывает ошибку', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/create-event');

    await page.fill('#description', 'Это описание тестового события');

    await page.locator('[data-slot="select-trigger"]').click();
    await page.locator('[data-slot="select-item"]').first().click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('#startsAt-date', dateStr!);
    await page.fill('#startsAt-time', '18:00');
    await page.fill('#address', 'ул. Тестовая, 1, Самара');

    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();

    await expect(page.locator('.text-destructive').first()).toBeVisible();
    expect(page.url()).toContain('/create-event');
  });

  test('незалогиненный юзер → редирект на /login', async ({ page }) => {
    await page.goto('/create-event');
    await page.waitForURL(/\/login/, { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Войти');
  });
});
