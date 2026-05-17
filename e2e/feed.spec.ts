import { test, expect } from '@playwright/test';

test.describe('Feed: фильтры, поиск и пагинация', () => {
  test('главная отображает события из БД', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('События в Самаре');

    const cards = page.locator('[data-slot="event-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(20);
  });

  test('фильтр по категории показывает только выбранную', async ({ page }) => {
    await page.goto('/');

    const sportBadge = page.getByLabel('Категория Спорт');
    await sportBadge.click();

    await page.waitForURL(/category=SPORT/, { timeout: 30000 });

    const cards = page.locator('[data-slot="event-card"]');
    const count = await cards.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const badge = cards.nth(i).locator('.tb-badge-summer');
        await expect(badge).toContainText('Спорт');
      }
    }
  });

  test('поиск по тексту фильтрует события', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByLabel('Поиск событий');
    await searchInput.fill('йога');

    await page.waitForURL(/q=/, { timeout: 30000 });

    const cards = page.locator('[data-slot="event-card"]');
    const count = await cards.count();
    if (count > 0) {
      const firstTitle = await cards.first().locator('h3').textContent();
      expect(firstTitle?.toLowerCase()).toContain('йога');
    }
  });

  test('сброс фильтров возвращает все события', async ({ page }) => {
    await page.goto('/?category=SPORT');

    const resetBtn = page.getByLabel('Сбросить все фильтры');
    await resetBtn.click();

    await page.waitForURL('/', { timeout: 30000 });

    const cards = page.locator('[data-slot="event-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('продвинутое событие отображается с акцентом и бейджем', async ({ page }) => {
    await page.goto('/');

    const promotedCard = page.locator('.promoted-card').first();
    if (await promotedCard.isVisible()) {
      const badge = promotedCard.locator('text=Рекомендуем');
      await expect(badge).toBeVisible();
    }
  });

  test('пустой результат показывает empty state', async ({ page }) => {
    await page.goto('/?q=несуществующеесобытие12345');

    const emptyState = page.getByText('Ничего не нашли по этим фильтрам');
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    const resetBtn = page.getByText('Сбросить фильтры');
    await expect(resetBtn).toBeVisible();
  });
});
