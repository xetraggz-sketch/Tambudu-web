import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPass123!';

test.describe('Авторизация', () => {
  test('регистрация нового юзера → редирект на /profile', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await page.waitForURL('**/profile', { timeout: 30000 });
    await expect(page.locator('header')).toContainText('😀');
  });

  test('выход → видна кнопка «Войти»', async ({ page }) => {
    await page.goto('/register');
    const email = `e2e-logout-${Date.now()}@test.com`;
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });

    const menuButton = page.locator('header').getByText('😀');
    await menuButton.click();
    await page.getByText('Выйти').click();

    await page.waitForURL('/', { timeout: 30000 });
    await expect(
      page.locator('header').getByRole('link', { name: 'Войти' }),
    ).toBeVisible();
  });

  test('логин существующим юзером → /profile', async ({ page }) => {
    const email = `e2e-login-${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });

    const menuButton = page.locator('header').getByText('😀');
    await menuButton.click();
    await page.getByText('Выйти').click();
    await page.waitForURL('/', { timeout: 30000 });

    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });

    await expect(page.locator('header')).toContainText('😀');
  });

  test('логин с неверным паролем → ошибка', async ({ page }) => {
    const email = `e2e-badpw-${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });

    const menuButton = page.locator('header').getByText('😀');
    await menuButton.click();
    await page.getByText('Выйти').click();
    await page.waitForURL('/', { timeout: 30000 });

    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', 'WrongPassword!');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByText('Неверный email или пароль')).toBeVisible();
  });

  test('регистрация с дубликатом email → ошибка', async ({ page }) => {
    const email = `e2e-dup-${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });

    const menuButton = page.locator('header').getByText('😀');
    await menuButton.click();
    await page.getByText('Выйти').click();
    await page.waitForURL('/', { timeout: 30000 });

    await page.goto('/register');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirm', TEST_PASSWORD);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(page.getByText('Email уже занят')).toBeVisible();
  });

  test('попытка зайти на /profile без авторизации → редирект на /login', async ({
    page,
  }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
