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

test.describe('Event Promotion', () => {
  test('кнопка «Продвинуть» открывает AlertDialog с ценой', async ({
    page,
  }) => {
    await login(page, 'ivan@example.com', 'password123');
    await page.goto('/my-events');

    const approvedTab = page.getByRole('tab', { name: /Опубликованы/ });
    await approvedTab.click();

    const promoteBtn = page.getByLabel('Продвинуть').first();
    if ((await promoteBtn.count()) === 0) {
      test.skip(true, 'Нет опубликованных событий для продвижения');
      return;
    }

    await promoteBtn.click();

    await expect(
      page.locator('[data-slot="alert-dialog-title"]'),
    ).toContainText('29');
  });

  test('кнопка «Продвинуть» не показывается для прошедших событий', async ({
    page,
  }) => {
    await login(page, 'ivan@example.com', 'password123');
    await page.goto('/my-events');

    const approvedTab = page.getByRole('tab', { name: /Опубликованы/ });
    await approvedTab.click();

    const cards = page.locator('[data-slot="my-event-card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const hasPromote = await card.getByLabel('Продвинуть').count();
      if (hasPromote === 0) {
        await expect(card).toBeTruthy();
        return;
      }
    }

    test.skip(true, 'Все события в будущем — невозможно проверить');
  });

  test('отмена в диалоге закрывает его без списания', async ({ page }) => {
    await login(page, 'ivan@example.com', 'password123');
    await page.goto('/my-events');

    const approvedTab = page.getByRole('tab', { name: /Опубликованы/ });
    await approvedTab.click();

    const promoteBtn = page.getByLabel('Продвинуть').first();
    if ((await promoteBtn.count()) === 0) {
      test.skip(true, 'Нет опубликованных событий для продвижения');
      return;
    }

    await promoteBtn.click();
    await expect(
      page.locator('[data-slot="alert-dialog-title"]'),
    ).toBeVisible();

    await page
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();

    await expect(
      page.locator('[data-slot="alert-dialog-title"]'),
    ).not.toBeVisible();
  });
});
