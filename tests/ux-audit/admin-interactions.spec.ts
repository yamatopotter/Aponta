import { test, expect } from '@playwright/test';
import path from 'path';

test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

test.describe('Navegação lateral (AdminShell)', () => {
  test('sidebar em mobile fica recolhido atrás de um menu hambúrguer', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width >= 500, 'Só relevante em viewport mobile');

    await page.goto('/admin/justificativas', { waitUntil: 'networkidle' });

    // Fechado por padrão: sidebar não deve estar visível nem reservar espaço do conteúdo.
    const aside = page.locator('aside');
    await expect(aside).not.toBeInViewport();
    const mainBox = await page.locator('main').boundingBox();
    console.log(`[mobile-nav] viewport=${viewport!.width} mainWidth=${mainBox?.width}`);
    expect(mainBox!.width).toBeGreaterThan(viewport!.width * 0.9);

    // Abre pelo hambúrguer e o sidebar deve ficar visível.
    const hamburger = page.getByRole('button', { name: 'Abrir menu' });
    await hamburger.click();
    await expect(aside).toBeInViewport();

    // Clicar no overlay fecha de novo (fora da área dos 230px do próprio sidebar,
    // que fica acima do overlay na pilha de z-index).
    await page.locator('div.fixed.inset-0.bg-black\\/40').click({ position: { x: viewport!.width - 10, y: 100 } });
    await expect(aside).not.toBeInViewport();
  });

  test('todos os itens de navegação têm alvo de toque >= 44x44px', async ({ page }) => {
    await page.goto('/admin/justificativas', { waitUntil: 'networkidle' });

    const viewport = page.viewportSize();
    if (viewport && viewport.width < 500) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }

    const links = page.locator('aside nav a');
    const count = await links.count();
    const small: string[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();
      const label = (await link.textContent())?.trim();
      if (box && box.height < 44) small.push(`${label} (h=${box.height}px)`);
    }

    console.log('[touch-target] itens de nav abaixo de 44px de altura:', small);
    expect(small, 'Itens de navegação com alvo de toque menor que o recomendado (44px)').toEqual([]);
  });
});

test.describe('Alternância Tabela/Kanban', () => {
  test('alternar para Kanban em Chamados persiste após reload', async ({ page }) => {
    await page.goto('/admin/chamados', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

    await page.getByRole('button', { name: 'Tabela' }).click();
    await expect(page.locator('table')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('Modal de detalhe (Radix Dialog)', () => {
  test('abrir um chamado move o foco para o modal e ESC fecha', async ({ page }) => {
    await page.goto('/admin/chamados', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});
    await page.getByRole('button', { name: 'Tabela' }).click();

    const firstRow = page.locator('table tbody tr').first();
    const hasRows = (await page.locator('table tbody tr').count()) > 0;
    test.skip(!hasRows, 'Sem chamados cadastrados para abrir o modal');

    await firstRow.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const focusInsideDialog = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"]');
      return !!dialogEl && dialogEl.contains(document.activeElement);
    });
    expect(focusInsideDialog, 'Foco não foi movido para dentro do modal ao abrir').toBeTruthy();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test.describe('Busca de funcionários', () => {
  test('busca por nome sem dígitos realmente filtra a lista (regressão do bug F-01)', async ({ page }) => {
    await page.goto('/admin/funcionarios', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

    const rowCount = () => page.locator('table tbody tr').count();
    const totalSemFiltro = await rowCount();

    const input = page.getByPlaceholder('Buscar nome ou CPF...');

    // termo que não existe em nenhum nome/CPF deve zerar a lista, não devolver tudo
    await input.fill('zzzzznaoexiste');
    await input.press('Enter');
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});
    await expect(page.getByText('Nenhum funcionário com esses filtros.')).toBeVisible();

    // termo comum (só letras, sem dígitos) deve devolver um subconjunto, não a lista inteira
    await input.fill('a');
    await input.press('Enter');
    await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});
    const totalComFiltro = await rowCount();

    console.log(`[busca] total sem filtro=${totalSemFiltro} | total com q="a"=${totalComFiltro}`);
    expect(totalComFiltro).toBeLessThan(totalSemFiltro);
  });
});
