import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 25000, fullyParallel: false, workers: 1,
  reporter: [['list']], use: { baseURL: 'http://127.0.0.1:3210', channel: 'chromium', headless: true, actionTimeout: 5000, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm.cmd run dev -- --port 3210', url: 'http://127.0.0.1:3210', reuseExistingServer: false, timeout: 120000,
    env: { PANTA_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1' } },
});
