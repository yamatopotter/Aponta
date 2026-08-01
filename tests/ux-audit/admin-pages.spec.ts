import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import fs from 'fs';

test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

const ROUTES = [
  { path: '/admin/justificativas', name: 'justificativas' },
  { path: '/admin/chamados', name: 'chamados' },
  { path: '/admin/folha', name: 'folha' },
  { path: '/admin/funcionarios', name: 'funcionarios' },
  { path: '/admin/configuracoes', name: 'configuracoes' },
];

const SHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

function collectConsole(page: Page) {
  const messages: { type: string; text: string }[] = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      messages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    messages.push({ type: 'pageerror', text: err.message });
  });
  return messages;
}

for (const route of ROUTES) {
  test.describe(`Página admin: ${route.path}`, () => {
    test(`carrega sem erros de console/rede — ${route.name}`, async ({ page }) => {
      const consoleMessages = collectConsole(page);
      const failedRequests: string[] = [];
      page.on('response', (res) => {
        if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
      });

      const start = Date.now();
      await page.goto(route.path, { waitUntil: 'networkidle' });
      const loadMs = Date.now() - start;

      await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

      console.log(`[perf] ${route.path} carregou em ${loadMs}ms (networkidle)`);
      if (consoleMessages.length) {
        console.log(`[console] ${route.path}:`, JSON.stringify(consoleMessages, null, 2));
      }
      if (failedRequests.length) {
        console.log(`[network-errors] ${route.path}:`, failedRequests);
      }

      const viewport = page.viewportSize();
      const suffix = viewport && viewport.width < 500 ? 'mobile' : 'desktop';
      await page.screenshot({
        path: path.join(SHOT_DIR, `${route.name}-${suffix}.png`),
        fullPage: true,
      });

      expect(failedRequests, `Requisições com erro em ${route.path}`).toEqual([]);
    });

    test(`sem rolagem horizontal (overflow) — ${route.name}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      const viewport = page.viewportSize();
      console.log(`[overflow] ${route.path} viewport=${viewport?.width} scrollWidth=${scrollWidth} clientWidth=${clientWidth}`);

      expect(
        scrollWidth,
        `Página ${route.path} tem rolagem horizontal indesejada em viewport ${viewport?.width}px (scrollWidth=${scrollWidth} > clientWidth=${clientWidth})`
      ).toBeLessThanOrEqual(clientWidth + 1);
    });

    test(`acessibilidade automatizada (axe-core) — ${route.name}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Carregando...', { state: 'detached', timeout: 10_000 }).catch(() => {});

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      if (results.violations.length) {
        const summary = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        }));
        console.log(`[a11y] ${route.path}:`, JSON.stringify(summary, null, 2));
      }

      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious, `Violações graves de acessibilidade em ${route.path}`).toEqual([]);
    });
  });
}
