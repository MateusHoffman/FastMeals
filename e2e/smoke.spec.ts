import { test, expect } from '@playwright/test';
import { VIEWER } from './fixtures/credentials';
import { login, loginAdminWithSessionWait } from './helpers/session';

test.describe('Smoke @smoke', () => {
  test('login admin e navega pedidos', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/orders/);
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Pedidos' }),
    ).toBeVisible();
  });

  test('viewer nao ve novo produto', async ({ page }) => {
    await login(page, VIEWER);
    await page.goto('/products');
    await expect(page.getByRole('button', { name: /novo produto/i })).toHaveCount(0);
  });

  test('sessao persiste apos reload', async ({ page }) => {
    await loginAdminWithSessionWait(page);
    const restoreSession = page.waitForResponse(
      (r) => r.url().includes('/auth/session') && r.request().method() === 'GET',
    );
    await page.reload();
    await restoreSession;
    await expect(page.getByText(/admin@fastmeals.com/)).toBeVisible({
      timeout: 15_000,
    });
  });
});
