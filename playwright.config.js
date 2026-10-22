import { defineConfig, devices } from '@playwright/test'

// E2E tests drive the real app in Chrome. Uses the locally installed Chrome
// (channel: 'chrome'); run `npx playwright install chromium` and drop the
// channel line to use Playwright's bundled browser instead.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npx vite --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 60_000,
    env: { VLP_NO_CONTENT_RELOAD: '1' },
  },
})
