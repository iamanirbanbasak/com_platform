import { db } from '@/lib/db'
import { requireClubManager } from '@/server/access'
import { requireUser, type Actor } from '@/server/actor'
import { fail, ok, type Result } from '@/server/result'

export async function listMembers(clubId: string) {
  return db.membership.findMany({
    where: { clubId },
    orderBy: { joinedAt: 'asc' },
    include: { user: { select: { id: true, name: true, image: true } } },
  })
}

export async function isMember(userId: string, clubId: string): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { id: true },
  })
  return membership !== null
}

export async function removeMember(
  actor: Actor | null,
  clubId: string,
  userId: string,
): Promise<Result<null>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access

  const { count } = await db.membership.deleteMany({ where: { clubId, userId } })
  if (count === 0) return fail('NOT_FOUND', 'That person is not a member of this club.')
  return ok(null)
}

export async function leaveClub(actor: Actor | null, clubId: string): Promise<Result<null>> {
  const access = requireUser(actor)
  if (!access.ok) return access

  const { count } = await db.membership.deleteMany({ where: { clubId, userId: access.value.id } })
  if (count === 0) return fail('NOT_FOUND', 'You are not a member of this club.')
  return ok(null)
}

export async function listMyMemberships(userId: string) {
  return db.membership.findMany({
    where: { userId, club: { status: 'ACTIVE' } },
    orderBy: { joinedAt: 'desc' },
    include: { club: { select: { name: true, slug: true, logoUrl: true } } },
  })
}
