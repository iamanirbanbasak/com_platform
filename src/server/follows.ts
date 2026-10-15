import { db } from '@/lib/db'
import { requireUser, type Actor } from '@/server/actor'
import { isUniqueViolation } from '@/server/errors'
import { fail, ok, type Result } from '@/server/result'

export async function followClub(actor: Actor | null, clubId: string): Promise<Result<null>> {
  const access = requireUser(actor)
  if (!access.ok) return access

  const club = await db.club.findUnique({ where: { id: clubId }, select: { status: true } })
  if (!club || club.status !== 'ACTIVE') return fail('NOT_FOUND', 'Club not found.')

  try {
    await db.follow.create({ data: { userId: access.value.id, clubId } })
  } catch (error: unknown) {
    // Following twice (double click, two tabs) is a no-op, not an error.
    if (!isUniqueViolation(error)) throw error
  }
  return ok(null)
}

export async function unfollowClub(actor: Actor | null, clubId: string): Promise<Result<null>> {
  const access = requireUser(actor)
  if (!access.ok) return access
  await db.follow.deleteMany({ where: { userId: access.value.id, clubId } })
  return ok(null)
}

export async function isFollowing(userId: string, clubId: string): Promise<boolean> {
  const follow = await db.follow.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { id: true },
  })
  return follow !== null
}

export async function listFollowedClubs(userId: string) {
  return db.follow.findMany({
    where: { userId, club: { status: 'ACTIVE' } },
    orderBy: { createdAt: 'desc' },
    include: { club: { select: { id: true, name: true, slug: true, logoUrl: true } } },
  })
}
