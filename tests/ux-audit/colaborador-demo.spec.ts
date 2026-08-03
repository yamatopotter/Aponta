import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Demo automatizada da experiência do COLABORADOR no celular: login por CPF,
// justificar um dia de ponto, consultar/validar o espelho da folha e abrir um
// chamado com o RH. Cada passo tira um screenshot com uma legenda descrevendo
// a ação, pra virar uma apresentação depois (ver tests/ux-audit/screenshots/colaborador-demo).
//
// Roda contra o app e o Postgres reais de dev (ambiente de testes) — sem
// mocks: os dados de folha vêm ao vivo do RHiD para o funcionário de teste
// "TESTE GABRIEL" (CPF 00000123456), que já existe no banco pra esse fim.

const CPF_FUNCIONARIO_TESTE = '00000123456';
const OUT_DIR = path.join(__dirname, 'screenshots', 'colaborador-demo');

let stepCount = 0;

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) fs.unlinkSync(path.join(OUT_DIR, f));
});

// Screenshots limpos (sem legenda embutida na imagem) — a legenda de cada
// passo vira texto de verdade no painel da apresentação (fora da imagem),
// pra poder reaproveitar as telas num layout diferente sem regravar.
async function passo(page: Page, slug: string, opts: { wait?: number } = {}) {
  stepCount += 1;
  const file = path.join(OUT_DIR, `${String(stepCount).padStart(2, '0')}-${slug}.png`);

  if (opts.wait) await page.waitForTimeout(opts.wait);
  await page.waitForTimeout(150);
  // Screenshot só do viewport (não a página inteira) — a ideia é mostrar UMA
  // tela de celular por vez, do jeito que o colaborador realmente vê, e não
  // um scroll gigante quando a lista é longa (ex.: espelho da folha).
  await page.screenshot({ path: file, fullPage: false });
}

test('demo do colaborador: login, justificativa, folha e chamado com o RH', async ({ page }) => {
  test.setTimeout(120_000);

  // 1. Tela de login
  await page.goto('/login');
  await expect(page.getByRole('tab', { name: 'Sou funcionário' })).toBeVisible();
  await passo(page, 'login');

  // 2. Preenchendo CPF (funcionário não usa senha)
  await page.getByPlaceholder('Somente números').fill(CPF_FUNCIONARIO_TESTE);
  await passo(page, 'cpf');

  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/ponto/);

  // 3. Tela inicial: Meu Ponto
  await expect(page.getByRole('heading', { name: 'Minha folha de ponto' })).toBeVisible();
  await passo(page, 'home', { wait: 500 });

  // 4. Justificando um dia de ponto
  await page.getByRole('button', { name: 'Justificar / ajustar' }).click();
  await expect(page.getByText('Justificar ou ajustar um dia')).toBeVisible();
  await passo(page, 'justificar-abrir');

  const hoje = new Date();
  const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
  const dataStr = ontem.toISOString().slice(0, 10);

  await page.locator('input[type="date"]').fill(dataStr);
  await page.getByPlaceholder('Ex.: Atestado médico').fill('Atestado médico');
  await page.locator('textarea').fill('Consulta médica de rotina, atestado anexado ao RH em mãos.');
  await passo(page, 'justificar-preencher');

  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Justificar ou ajustar um dia')).toBeHidden();
  await passo(page, 'justificar-enviada', { wait: 400 });

  // 5. Consultando o espelho da folha (dados reais via RHiD)
  await page.getByRole('tab', { name: 'Espelho da folha' }).click();
  await page.waitForTimeout(1500);
  await passo(page, 'folha-espelho');

  // 6. Validando a folha de ponto
  const confirmar = page.getByRole('button', { name: 'Confirmo que meu ponto está correto' });
  if (await confirmar.isVisible().catch(() => false)) {
    await confirmar.click();
    await expect(page.getByText('Confirmar sua folha de ponto?')).toBeVisible();
    await passo(page, 'folha-validar');
    await page.getByRole('button', { name: 'Cancelar' }).click();
  } else {
    await passo(page, 'folha-validar');
  }

  // 7. Indo para Chamados com o RH
  await page.getByRole('link', { name: /Chamados RH/ }).click();
  await page.waitForURL(/\/chamados/);
  await expect(page.getByRole('heading', { name: 'Chamados com o RH' })).toBeVisible();
  await passo(page, 'chamados-lista', { wait: 500 });

  // 8. Abrindo um novo chamado
  await page.getByRole('button', { name: 'Novo chamado' }).click();
  await expect(page.getByText('Abrir chamado com o RH')).toBeVisible();
  await passo(page, 'chamado-abrir');

  await page
    .locator('textarea')
    .fill('Preciso de uma declaração de horas trabalhadas do último mês para levar ao banco.');
  await passo(page, 'chamado-descrever');

  await page.getByRole('button', { name: 'Enviar chamado' }).click();
  await expect(page.getByText('Abrir chamado com o RH')).toBeHidden();
  await page.waitForTimeout(500);
  await passo(page, 'chamado-enviado');

  // 9. Abrindo a conversa do chamado recém-criado
  await page.locator('button:has-text("Ver conversa →")').first().click();
  await page.waitForTimeout(500);
  await passo(page, 'chamado-conversa');

  await page.locator('textarea[placeholder*="Escreva uma mensagem"]').fill('Fico no aguardo, obrigado!');
  await passo(page, 'chamado-mensagem-escrevendo');

  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await page.waitForTimeout(500);
  await passo(page, 'chamado-mensagem-enviada');

  await page.getByRole('button', { name: 'Fechar' }).click();
  await passo(page, 'fim', { wait: 300 });
});
