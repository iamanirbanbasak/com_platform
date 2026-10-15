import { randomUUID } from 'node:crypto'

import type { Club, User } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import type { Actor } from '@/server/actor'

let counter = 0
const next = () => ++counter

export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const n = next()
  return db.user.create({
    data: {
      id: randomUUID(),
      name: `User ${n}`,
      email: `user${n}-${randomUUID()}@example.com`,
      emailVerified: true,
      role: 'user',
      ...overrides,
    },
  })
}

export async function createAdmin(): Promise<User> {
  return createUser({ role: 'admin' })
}

export async function createClub(overrides: Partial<Club> = {}): Promise<Club> {
  const n = next()
  return db.club.create({
    data: { slug: `club-${n}-${randomUUID().slice(0, 6)}`, name: `Club ${n}`, ...overrides },
  })
}

export function actorOf(user: User): Actor {
  return { id: user.id, role: user.role === 'admin' ? 'admin' : 'user' }
}

/** A club with a president, ready for president-scoped tests. */
export async function createClubWithPresident() {
  const president = await createUser()
  const club = await createClub({ presidentId: president.id })
  return { club, president, presidentActor: actorOf(president) }
}
