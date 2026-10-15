import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'

/** Empties every app table in the e2e database. Refuses to touch any other database. */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? ''
  if (!/\/club_platform_e2e(\?|$)/.test(url)) {
    throw new Error('Refusing to wipe a database that is not club_platform_e2e')
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE membership, invite, follow, post, event, gallery_image, club, session, account, verification, "user" CASCADE',
  )
  await db.$disconnect()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
