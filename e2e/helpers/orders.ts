import { expect, type Page } from '@playwright/test';

export function orderListing(page: Page, customer: string) {
  return page
    .locator('.fm-table-wrap tbody tr')
    .filter({ hasText: customer })
    .or(page.locator('article.fm-card-padded').filter({ hasText: customer }));
}

export async function expectOrderListed(
  page: Page,
  customer: string,
  timeout = 15_000,
) {
  await expect(orderListing(page, customer).first()).toBeVisible({ timeout });
}

export async function updateOrderStatus(
  page: Page,
  customer: string,
  status: 'preparing' | 'ready' | 'delivered',
) {
  const row = page.getByRole('row').filter({ hasText: customer });
  const card = page.locator('article').filter({ hasText: customer });
  if ((await row.count()) > 0) {
    await row.getByRole('button', { name: /^editar$/i }).click();
  } else {
    await card.getByRole('button', { name: /^editar$/i }).click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/novo status/i).selectOption(status);
  await dialog.getByRole('button', { name: /atualizar status/i }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
}
