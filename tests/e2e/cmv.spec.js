import { test, expect } from '@playwright/test';

test.describe('Controle de CMV (Fase 5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForURL('**/pedidos', { timeout: 10000 });
  });

  test('Deve calcular o CMV Geral', async ({ page }) => {
    await page.goto('/financeiro/cmv');

    await expect(page.locator('h1', { hasText: 'Controle de CMV' })).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    const inputsDate = page.locator('input[type="date"]');
    await inputsDate.nth(0).fill(today);
    await inputsDate.nth(1).fill(today);

    const inputsNumber = page.locator('input[type="number"]');
    await inputsNumber.nth(0).fill('1000'); 
    await inputsNumber.nth(1).fill('500');  
    await inputsNumber.nth(2).fill('800');  

    await page.getByRole('button', { name: 'Calcular CMV' }).click();

    await expect(page.getByText('Resultados')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Faturamento Bruto')).toBeVisible();
    await expect(page.getByText('CMV Calculado')).toBeVisible();
    await expect(page.getByText('CMV em %')).toBeVisible();
  });

  test('Deve buscar e exibir o CMV por Produto', async ({ page }) => {
    await page.goto('/financeiro/cmv');
    
    await page.getByRole('button', { name: 'CMV por Produto' }).click();

    const searchInput = page.getByPlaceholder('Nome do produto...');
    await searchInput.fill(''); 
    
    await page.waitForTimeout(1000);
    const firstProductBtn = page.locator('.max-h-48 button').first();
    const count = await firstProductBtn.count();
    if (count > 0) {
      await firstProductBtn.click();
      
      await expect(page.getByText('Ficha Técnica de')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Preço de Venda')).toBeVisible();
      await expect(page.getByText('Custo Total de Produção')).toBeVisible();
    }
  });
});
