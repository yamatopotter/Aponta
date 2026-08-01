import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'admin.json');
// Senha real do admin de dev: passe via env ADMIN_TEST_PASSWORD (nunca hardcode aqui).
// Se a conta ainda estiver no estado de seed (mustChangePassword=true), cai pro fluxo
// de troca de senha usando este valor como nova senha.
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'TesteUx2026!';

async function tryLogin(page: import('@playwright/test').Page, senha: string) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Sou do RH' }).click();
  await page.getByPlaceholder('admin').fill('admin');
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await Promise.race([
    page.waitForURL(/\/(trocar-senha|admin)/, { timeout: 8_000 }).catch(() => {}),
    page.getByText('Não foi possível entrar', { exact: false }).waitFor({ timeout: 8_000 }).catch(() => {}),
  ]);
  return page.url();
}

setup('login como admin (com troca de senha obrigatória no 1º acesso)', async ({ page }) => {
  // Next.js em dev compila cada rota sob demanda no primeiro acesso — pode passar de 10s
  // por rota logo após reiniciar o servidor, então damos mais margem que o padrão de 30s.
  setup.setTimeout(90_000);
  // Seed cria admin/admin com mustChangePassword=true. Se um teste anterior já trocou a
  // senha, o login com a senha provisória falha — nesse caso usamos a senha de teste direto.
  let url = await tryLogin(page, 'admin');

  if (url.includes('/login')) {
    url = await tryLogin(page, ADMIN_PASSWORD);
  }

  if (url.includes('trocar-senha')) {
    await page.getByPlaceholder('Nova senha (mín. 6 caracteres)').fill(ADMIN_PASSWORD);
    await page.getByPlaceholder('Confirme a nova senha').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Salvar e continuar' }).click();
    await page.waitForURL(/\/admin/);
  }

  await expect(page).toHaveURL(/\/admin\/justificativas/);
  await page.context().storageState({ path: authFile });
});
