import { execSync } from 'node:child_process'

/** Up-to-date schema, empty tables and a seeded admin before every e2e run. */
export default function globalSetup(): void {
  const run = (command: string) =>
    execSync(`pnpm exec dotenv run -q --override -f .env.e2e -- ${command}`, { stdio: 'inherit' })
  run('prisma migrate deploy')
  run('tsx tests/e2e/reset-db.ts')
  run('tsx --conditions=react-server prisma/seed.ts')
}
