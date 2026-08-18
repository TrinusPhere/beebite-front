import { test, expect } from '@playwright/test';

test.describe('Financeiro (Fase 5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForURL('**/pedidos', { timeout: 10000 });
  });

  test('Deve carregar o Financeiro e exibir dados faturados', async ({ page }) => {
    await page.goto('/financeiro');

    await expect(page.locator('h1', { hasText: 'Financeiro' })).toBeVisible();
    await expect(page.getByText('Faturamento Bruto')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Vendas por Produto' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Formas de Pagamento' })).toBeVisible();

    const btnMensal = page.locator('button', { hasText: 'Mensal' });
    await btnMensal.click();
    
    await expect(page.getByText('Faturamento Bruto')).toBeVisible();
  });
});
