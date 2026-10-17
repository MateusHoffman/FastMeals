import { test, expect } from '@playwright/test';
import { VIEWER } from './fixtures/credentials';
import {
  login,
  loginAdmin,
  loginAdminWithSessionWait,
  loginViewer,
  logout,
} from './helpers/session';
import {
  expectOrderListed,
  orderListing,
  updateOrderStatus,
} from './helpers/orders';
import { acceptAssignmentApi } from './helpers/assignment';

test.describe('FastMeals E2E', () => {
  test('login admin e navega pedidos', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible();
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

  test('logout encerra sessao', async ({ page }) => {
    await loginAdmin(page);
    await logout(page);
  });

  test('E2E-03 logout nao restaura sessao apos reload', async ({ page }) => {
    await loginAdmin(page);
    await logout(page);
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-02 viewer navega telas read-only', async ({ page }) => {
    await loginViewer(page);
    await page.getByRole('link', { name: 'Relatórios' }).click();
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    await page.getByRole('link', { name: 'Atribuição' }).click();
    await expect(
      page.getByRole('button', { name: /sugerir atribuição otimizada/i }),
    ).toHaveCount(0);
  });

  test('E2E-01 @admin admin fluxo produto pedido optimize delivered', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const productName = `E2E Prod ${stamp}`;
    const courierName = `Entregador E2E ${stamp}`;

    await loginAdmin(page);

    await page.getByRole('link', { name: 'Atribuição' }).click();
    await page.getByRole('button', { name: /novo entregador/i }).click();
    const createPerson = page.waitForResponse(
      (r) =>
        r.url().includes('/delivery-persons') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
    );
    await page.getByLabel(/^nome$/i).fill(courierName);
    await page.getByRole('button', { name: /^salvar$/i }).click();
    const person = (await (await createPerson).json()) as { id: string };

    await page.getByRole('link', { name: 'Produtos' }).click();
    await page.getByRole('button', { name: /novo produto/i }).click();
    await page.getByLabel(/^nome$/i).fill(productName);
    await page.getByLabel(/descrição/i).fill(
      'Produto criado pelo fluxo E2E automatizado.',
    );
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await expect(page.getByText(productName)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Pedidos' }).click();
    await page.getByRole('button', { name: /novo pedido/i }).click();
    const orderForm = page.locator('form').filter({ hasText: 'Novo pedido' });
    await expect(orderForm).toBeVisible();
    const customer = `Cliente E2E ${stamp}`;
    await orderForm.getByLabel(/^cliente$/i).fill(customer);
    const productSelect = orderForm.locator('select');
    await expect(productSelect.locator('option')).not.toHaveCount(1, {
      timeout: 20_000,
    });
    await productSelect.selectOption({ index: 1 });
    const createOrder = page.waitForResponse(
      (r) =>
        r.url().includes('/orders') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
    );
    await page.getByRole('button', { name: /^criar$/i }).click();
    const created = (await (await createOrder).json()) as { id: string };
    await expectOrderListed(page, customer);

    await updateOrderStatus(page, customer, 'preparing');
    await updateOrderStatus(page, customer, 'ready');

    await page.getByRole('link', { name: 'Atribuição' }).click();
    const optimizeResp = page.waitForResponse(
      (r) =>
        r.url().includes('/optimize-assignment') &&
        r.request().method() === 'POST' &&
        r.status() === 200,
    );
    await page
      .getByRole('button', { name: /sugerir atribuição otimizada/i })
      .click();
    const optimizeBody = (await (await optimizeResp).json()) as {
      assignments: Array<{
        orderId: string;
        deliveryPersonId: string;
        deliveryPersonName?: string;
      }>;
    };
    await expect(page.getByText(/Algoritmo:/i)).toBeVisible({ timeout: 30_000 });

    const suggested = optimizeBody.assignments.find(
      (a) => a.orderId === created.id,
    );
    if (suggested) {
      const acceptResp = page.waitForResponse(
        (r) =>
          r.url().includes(`/orders/${created.id}/accept-assignment`) &&
          r.request().method() === 'POST' &&
          r.status() === 200,
      );
      const personLabel =
        suggested.deliveryPersonName ?? suggested.deliveryPersonId.slice(0, 8);
      await page
        .locator('li')
        .filter({ hasText: personLabel })
        .getByRole('button', { name: /^aceitar$/i })
        .click();
      await acceptResp;
    } else {
      await acceptAssignmentApi(page, created.id, person.id);
    }

    await page.getByRole('link', { name: 'Pedidos' }).click();
    await page.getByLabel('Filtrar status').selectOption('delivering');
    await expectOrderListed(page, customer, 20_000);
    await updateOrderStatus(page, customer, 'delivered');
    await page.getByLabel('Filtrar status').selectOption('delivered');
    await expectOrderListed(page, customer);
    await expect(
      orderListing(page, customer).first().getByText(/^Entregue$/),
    ).toBeVisible({ timeout: 15_000 });
  });
});
