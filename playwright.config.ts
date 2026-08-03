import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ux-audit',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { outputFolder: 'tests/ux-audit/report', open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3002',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'off',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop-chromium',
      testIgnore: /colaborador-demo\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chromium',
      testIgnore: /colaborador-demo\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
    },
    // Demo do colaborador loga por CPF (sem senha), então não precisa da
    // sessão de admin que o projeto 'setup' prepara — roda isolado pra não
    // ficar refém do login do RH.
    {
      name: 'mobile-chromium-colaborador',
      testMatch: /colaborador-demo\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
