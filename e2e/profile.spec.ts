import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(profile|my-events|create-event)/, { timeout: 30000 });
}

test.describe('Profile', () => {
  test('профиль показывает email и баланс', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await expect(page.locator('text=anna@example.com')).toBeVisible();
    await expect(page.locator('text=Баланс')).toBeVisible();
    await expect(page.locator('text=0\u00A0₽').first()).toBeVisible();
  });

  test('смена эмодзи обновляет аватар', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить аватар').click();
    await page.getByLabel('Эмодзи 🦊').click();
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Аватар обновлён')).toBeVisible({ timeout: 5000 });
  });

  test('смена имени обновляет профиль', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить имя').click();
    await page.getByPlaceholder('Ваше имя').fill('Анна Тест');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Имя обновлено')).toBeVisible({ timeout: 5000 });
  });

  test('подписка без баланса → ошибка', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    const subscribeBtn = page.getByRole('button', { name: /Оформить подписку/ });
    await subscribeBtn.click();

    await page.getByRole('button', { name: 'Оформить' }).click();

    await expect(page.getByText(/Не хватает средств|Недостаточно средств/)).toBeVisible({
      timeout: 5000,
    });
  });

  test('tab «Мои события» отображает события юзера', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByRole('tab', { name: /Мои события/ }).click();

    const content = page.locator('[data-slot="tabs-content"]').filter({
      has: page.locator(':visible'),
    });
    await expect(content).toBeVisible();
  });
});
