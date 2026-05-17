import { test, expect } from '@playwright/test';

test.describe('Brand: Samara Dvorik design system', () => {
  test('homepage shows logo, cards, and map', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('ТамБуду')).toBeVisible();
    await expect(page.locator('h1')).toContainText('События в Самаре');

    const cards = page.locator('.tb-card');
    await expect(cards).toHaveCount(7); // 6 event cards + 1 filter placeholder

    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();

    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(6);
  });

  test('theme toggle persists after reload', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Сменить тему').click();
    await page.getByText('Тёмная').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('mobile: tabs work for list and map', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.getByRole('tab', { name: 'Карта' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();

    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(6);
  });

  test('hover on card sets data-selected', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('.tb-card').first();
    await firstCard.hover();

    const wrapper = firstCard.locator('..');
    await expect(wrapper).toHaveAttribute('data-selected', 'true');
  });

  test('login page has correct design', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Войти');

    const link = page.getByText('Зарегистрируйся');
    await expect(link).toBeVisible();
  });

  test('mobile: burger menu is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByLabel('Меню')).toBeVisible();
  });
});
