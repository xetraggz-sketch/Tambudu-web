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
  await page.waitForURL(/\/(profile|my-events|create-event|admin)/, { timeout: 30000 });
}

test.describe('Admin panel', () => {
  test('обычный юзер не может зайти на /admin', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/admin');
    // Wait for redirect away from /admin (should redirect to / or /profile)
    await page.waitForFunction(() => !window.location.pathname.startsWith('/admin'), { timeout: 30000 });

    const url = page.url();
    expect(url).not.toContain('/admin');
  });

  test('админ видит дашборд с метриками', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL ?? 'admin@tambudu.ru', process.env.ADMIN_PASSWORD ?? 'admin123');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
    await expect(page.locator('[data-slot="metric-card"]').first()).toBeVisible();
  });

  test('модерация — одобрить событие', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL ?? 'admin@tambudu.ru', process.env.ADMIN_PASSWORD ?? 'admin123');
    await page.goto('/admin/moderation');

    const card = page.locator('[data-slot="moderation-card"]').first();
    if ((await card.count()) === 0) {
      test.skip(true, 'Нет событий на модерации');
      return;
    }

    const title = await card.locator('h3').textContent();
    await card.getByLabel('Одобрить').click();

    await expect(page.getByText('Одобрено')).toBeVisible({ timeout: 5000 });

    await page.goto('/');
    if (title) {
      const feed = page.locator('[data-slot="event-card"]');
      await expect(feed.filter({ hasText: title }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('модерация — отклонить с причиной', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL ?? 'admin@tambudu.ru', process.env.ADMIN_PASSWORD ?? 'admin123');
    await page.goto('/admin/moderation');

    const card = page.locator('[data-slot="moderation-card"]').first();
    if ((await card.count()) === 0) {
      test.skip(true, 'Нет событий на модерации');
      return;
    }

    await card.getByLabel('Отклонить').click();
    await expect(page.locator('[data-slot="dialog-title"]')).toBeVisible();

    const submitBtn = page.getByRole('button', { name: 'Отклонить' }).last();
    await expect(submitBtn).toBeDisabled();

    await page.fill('#reject-reason', 'Не соответствует правилам');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.getByText('Отклонено')).toBeVisible({ timeout: 5000 });
  });

  test('пополнение баланса пользователю', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL ?? 'admin@tambudu.ru', process.env.ADMIN_PASSWORD ?? 'admin123');
    await page.goto('/admin/topup');

    await page.fill('#user-search', 'anna');
    await page.waitForTimeout(500);

    const dropdown = page.locator('button').filter({ hasText: 'anna@example.com' });
    if ((await dropdown.count()) === 0) {
      test.skip(true, 'Юзер anna не найден');
      return;
    }
    await dropdown.first().click();

    await page.fill('#topup-amount', '100');
    await page.getByRole('button', { name: 'Пополнить' }).click();

    await expect(page.getByText('Пополнено')).toBeVisible({ timeout: 5000 });
  });

  test('страница пользователей — таблица и поиск', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL ?? 'admin@tambudu.ru', process.env.ADMIN_PASSWORD ?? 'admin123');
    await page.goto('/admin/users');

    await expect(page.getByText('Пользователи')).toBeVisible();

    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    await page.fill('input[placeholder*="Поиск"]', 'anna');
    await page.waitForTimeout(300);

    const filteredRows = page.locator('tbody tr');
    const count = await filteredRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
