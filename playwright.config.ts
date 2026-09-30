import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 20_000,
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' } },
  webServer: [
    { command: 'pnpm --filter @polystrike/server dev', url: 'http://127.0.0.1:2567/health', timeout: 30_000, reuseExistingServer: true },
    { command: 'pnpm --filter @polystrike/client dev', url: 'http://127.0.0.1:5173', timeout: 30_000, reuseExistingServer: true },
  ],
});
