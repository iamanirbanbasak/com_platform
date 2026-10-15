import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'vitest/config'

const testEnv = loadEnv({ path: '.env.test', quiet: true }).parsed ?? {}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/support/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    env: testEnv,
    setupFiles: ['tests/support/setup.ts'],
    // Tests share one Postgres database, so files must not run concurrently.
    fileParallelism: false,
  },
})
