import { afterAll, beforeEach } from 'vitest'

import { db } from '@/lib/db'

const TABLES = [
  'membership',
  'invite',
  'follow',
  'post',
  'event',
  'gallery_image',
  'club',
  'session',
  'account',
  'verification',
  '"user"',
]

beforeEach(async () => {
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error('Refusing to wipe a non-test database')
  }
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`)
})

afterAll(async () => {
  await db.$disconnect()
})
