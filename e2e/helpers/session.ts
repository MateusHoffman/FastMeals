import { expect, type Page } from '@playwright/test';
import { ADMIN, VIEWER } from '../fixtures/credentials';

type SeedUser = typeof ADMIN | typeof VIEWER;

/** Campo senha (evita colidir com botão "Mostrar senha"). */
function passwordInput(page: Page) {
  return page.locator('#password');
}

export async function login(page: Page, user: SeedUser = ADMIN) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await passwordInput(page).fill(user.password);
  await page.getByRole('button', { name: /entrar/i }).click();
}

export async function loginAdmin(page: Page) {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/orders/);
}

export async function loginViewer(page: Page) {
  await login(page, VIEWER);
  await expect(page).toHaveURL(/\/orders/);
}

export async function loginAdminWithSessionWait(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(ADMIN.email);
  await passwordInput(page).fill(ADMIN.password);
  const loginSession = page.waitForResponse(
    (r) => r.url().includes('/auth/session') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /entrar/i }).click();
  await loginSession;
  await expect(page).toHaveURL(/\/orders/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /sair/i }).click();
  await expect(page).toHaveURL(/\/login/);
}
