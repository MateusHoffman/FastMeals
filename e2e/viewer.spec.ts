import { test, expect } from '@playwright/test';
import { loginViewer } from './helpers/session';

test.describe('Viewer read-only @viewer', () => {
  test('navega pedidos, produtos e relatórios sem mutações', async ({ page }) => {
    await loginViewer(page);

    await expect(page.getByRole('button', { name: /novo pedido/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Produtos' }).click();
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
    await expect(page.getByRole('button', { name: /novo produto/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Relatórios' }).click();
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();

    await page.getByRole('link', { name: 'Atribuição' }).click();
    await expect(
      page.getByRole('button', { name: /sugerir atribuição otimizada/i }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: /novo entregador/i })).toHaveCount(0);
  });
});
