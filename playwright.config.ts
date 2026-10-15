import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Runs against a dedicated database with email verification switched off.
const e2eEnv = loadEnv({ path: '.env.e2e', override: true, quiet: true }).parsed ?? {}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A production build: dev-mode compiles trigger full reloads that wipe half-filled forms.
    command: 'pnpm next build && pnpm next start --port 3100',
    // Health endpoint that doesn't query app tables: global setup runs after the server starts.
    url: 'http://localhost:3100/api/auth/ok',
    reuseExistingServer: false,
    timeout: 300_000,
    env: e2eEnv,
  },
})
