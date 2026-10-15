import 'dotenv/config'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Creates the single admin account through Better Auth (so the password hash is
 * in the format it expects), then promotes and verifies it. Safe to re-run.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env')

  const existing = await db.user.findUnique({ where: { email } })
  if (!existing) {
    await auth.api.signUpEmail({ body: { email, password, name: 'Admin' } })
    console.info(`Created admin account ${email}`)
  }

  await db.user.update({
    where: { email },
    data: { role: 'admin', emailVerified: true, banned: false },
  })
  // Demote anyone else so there is only ever one admin.
  const demoted = await db.user.updateMany({
    where: { role: 'admin', NOT: { email } },
    data: { role: 'user' },
  })
  if (demoted.count > 0) console.info(`Demoted ${demoted.count} other admin account(s)`)
  console.info(`Admin ready: ${email}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
