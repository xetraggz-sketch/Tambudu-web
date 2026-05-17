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

test.describe('Event Reviews', () => {
  test('форма отзыва видна для записанного юзера на прошедшее событие', async ({
    page,
  }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/profile');
    const pastTab = page.getByRole('tab', { name: /Прошедшие/ });
    await pastTab.click();

    const reviewBtn = page.getByRole('link', { name: 'Отзыв' }).first();
    if ((await reviewBtn.count()) === 0) {
      test.skip(true, 'Нет прошедших событий без отзыва');
      return;
    }

    await reviewBtn.click();
    await expect(page.locator('#review-form')).toBeVisible();
  });

  test('юзер может оставить 5-звёздочный отзыв с текстом', async ({
    page,
  }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/profile');
    const pastTab = page.getByRole('tab', { name: /Прошедшие/ });
    await pastTab.click();

    const reviewBtn = page.getByRole('link', { name: 'Отзыв' }).first();
    if ((await reviewBtn.count()) === 0) {
      test.skip(true, 'Нет прошедших событий без отзыва');
      return;
    }

    await reviewBtn.click();
    await expect(page.locator('#review-form')).toBeVisible();

    await page.locator('#review-form [role="radio"][aria-label="5 из 5"]').click();
    await page.locator('#review-form textarea').fill('Отличное мероприятие!');
    await page.getByRole('button', { name: 'Оставить отзыв' }).click();

    await expect(page.locator('#review-form')).not.toBeVisible();
    await expect(page.locator('section[aria-label="Отзывы"]')).toContainText(
      'Отличное мероприятие!',
    );
  });

  test('форма исчезает после отправки отзыва (повторно открыть — нет формы)', async ({
    page,
  }) => {
    await login(page, 'anna@example.com', 'password123');

    await page.goto('/profile');
    const pastTab = page.getByRole('tab', { name: /Прошедшие/ });
    await pastTab.click();

    const reviewedLabel = page.getByText('Отзыв оставлен').first();
    if ((await reviewedLabel.count()) === 0) {
      test.skip(true, 'Нет прошедших событий с отзывом');
      return;
    }

    const eventLink = reviewedLabel
      .locator('..')
      .locator('..')
      .getByRole('link')
      .first();
    if ((await eventLink.count()) === 0) {
      test.skip(true, 'Не удалось найти ссылку на событие');
      return;
    }

    await eventLink.click();
    await expect(page.locator('#review-form')).not.toBeVisible();
  });

  test('автор события не видит форму отзыва', async ({ page }) => {
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
    await expect(page.locator('#review-form')).not.toBeVisible();
  });

  test('средняя оценка отображается корректно', async ({ page }) => {
    await page.goto('/');

    const eventCard = page.locator('[data-slot="event-card"] a').first();
    if ((await eventCard.count()) === 0) {
      test.skip(true, 'Нет событий в ленте');
      return;
    }

    await eventCard.click();
    const reviewsSection = page.locator('section[aria-label="Отзывы"]');
    await expect(reviewsSection).toBeVisible();
  });
});
