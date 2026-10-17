import { expect, type Page } from '@playwright/test';

export async function acceptAssignmentApi(
  page: Page,
  orderId: string,
  deliveryPersonId: string,
) {
  const cookies = await page.context().cookies();
  const csrf = cookies.find((c) => c.name === 'csrf_token')?.value ?? '';
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
  const res = await page.request.post(
    `${base}/api/orders/${orderId}/accept-assignment`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        Origin: base.replace(/\/$/, ''),
        Cookie: cookieHeader,
      },
      data: { deliveryPersonId },
    },
  );
  expect(res.status()).toBe(200);
}
