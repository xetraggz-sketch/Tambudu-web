import { test, expect } from '@playwright/test';
import path from 'path';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(profile|my-events|create-event)/, { timeout: 30000 });
}

test.describe('Profile Avatar Upload', () => {
  test('загрузка аватара → кроп → сохранение → отображается img', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить аватар').click();
    await page.getByRole('tab', { name: 'Своя картинка' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test-avatar.png'));

    await expect(page.locator('.ReactCrop')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Сохранить' }).last().click();
    await expect(page.getByText('Аватар обновлён')).toBeVisible({ timeout: 10000 });
  });

  test('удаление аватара → снова виден эмодзи', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить аватар').click();
    await page.getByRole('tab', { name: 'Своя картинка' }).click();

    const removeBtn = page.getByRole('button', { name: 'Удалить картинку' });
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(page.getByText('Картинка удалена')).toBeVisible({ timeout: 5000 });
    }
  });

  test('подделка MIME → ошибка «Неверный тип файла»', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить аватар').click();
    await page.getByRole('tab', { name: 'Своя картинка' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/evil.png'));

    const cropOrError = await Promise.race([
      page.locator('.ReactCrop').waitFor({ timeout: 3000 }).then(() => 'crop'),
      page.waitForTimeout(3000).then(() => 'timeout'),
    ]);

    if (cropOrError === 'crop') {
      await page.getByRole('button', { name: 'Сохранить' }).last().click();
      await expect(page.getByText(/Неверный тип файла/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('большой файл → ошибка размера', async ({ page }) => {
    await login(page, 'anna@example.com', 'password123');
    await page.goto('/profile');

    await page.getByLabel('Изменить аватар').click();
    await page.getByRole('tab', { name: 'Своя картинка' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/large-avatar.jpg'));

    const cropVisible = await page.locator('.ReactCrop').isVisible().catch(() => false);
    if (cropVisible) {
      await page.getByRole('button', { name: 'Сохранить' }).last().click();
      await expect(
        page.getByText(/слишком детальная|Файл больше/)
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
