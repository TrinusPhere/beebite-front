import { test, expect } from '@playwright/test';

test.describe('Dashboard (Fase 5)', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login real na aplicação
    await page.goto('/');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Acessar Painel")');
    // Aguarda a rota mudar para o painel
    await page.waitForURL('**/pedidos', { timeout: 10000 });
  });

  test('Deve carregar o Dashboard e exibir os KPIs e pedidos recentes', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('h1', { hasText: 'Painel Administrativo' })).toBeVisible();
    await expect(page.getByText('Pedidos Recentes')).toBeVisible();
    await expect(page.getByText('Equipe de Entrega')).toBeVisible();
  });
});
