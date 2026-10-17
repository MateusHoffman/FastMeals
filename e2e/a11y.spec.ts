import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers/session';

/** Falha só em violações serious/critical (ruído de contraste menor fica visível no relatório). */
function seriousViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
) {
  return violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
}

test.describe('Acessibilidade @a11y', () => {
  test.use({ colorScheme: 'light' });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fastmeals-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
  });

  test('tela de login', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page })
      .include('.fm-login-card')
      .analyze();
    expect(seriousViolations(results.violations)).toEqual([]);
  });

  test('painel de pedidos após login admin', async ({ page }) => {
    await login(page);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .exclude('aside, .recharts-wrapper')
      .analyze();
    expect(seriousViolations(results.violations)).toEqual([]);
  });
});
