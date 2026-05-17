import { test, expect } from '@playwright/test';

test.describe('Event page', () => {
  test('открыть событие из ленты → видны название, описание, карта, кнопка', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.locator('[data-slot="event-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const eventHref = await firstCard.getAttribute('href');
    expect(eventHref).toBeTruthy();

    await page.goto(eventHref!);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('[data-slot="event-actions"]')).toBeVisible();
  });

  test('гость видит «Войти, чтобы записаться»', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-slot="event-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const eventHref = await firstCard.getAttribute('href');

    await page.goto(eventHref!);

    await expect(page.getByText('Войти, чтобы записаться')).toBeVisible();
  });

  test('несуществующее событие → 404', async ({ page }) => {
    await page.goto('/events/nonexistent-id-12345');

    await expect(page.getByText('Событие не найдено')).toBeVisible();
    await expect(page.getByText('Вернуться к ленте')).toBeVisible();
  });

  test('метаданные содержат название события', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-slot="event-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const eventHref = await firstCard.getAttribute('href');

    await page.goto(eventHref!);

    const title = await page.title();
    expect(title).toContain('ТамБуду');
    expect(title.length).toBeGreaterThan(10);
  });

  test('карта отображается на странице события', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-slot="event-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const eventHref = await firstCard.getAttribute('href');

    await page.goto(eventHref!);

    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible({ timeout: 10000 });

    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(1);
  });
});
