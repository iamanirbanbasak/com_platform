import { db } from '@/lib/db'
import { requireAdmin, type Actor } from '@/server/actor'
import { fail, ok, type Result } from '@/server/result'

export async function listUsers(actor: Actor | null, query = '') {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      emailVerified: true,
      createdAt: true,
      presidentOf: { select: { name: true, slug: true } },
      _count: { select: { memberships: true, follows: true } },
    },
  })
  return ok(users)
}

function guardTarget(actor: Actor, targetId: string): Result<null> | null {
  if (actor.id === targetId) return fail('FORBIDDEN', 'You cannot do that to your own account.')
  return null
}

/** Bans the user and ends their sessions so the ban takes effect immediately. */
export async function setUserBanned(
  actor: Actor | null,
  userId: string,
  banned: boolean,
): Promise<Result<null>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const blocked = guardTarget(access.value, userId)
  if (blocked) return blocked

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return fail('NOT_FOUND', 'User not found.')

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: banned ? { banned: true } : { banned: false, banReason: null, banExpires: null },
    }),
    ...(banned ? [db.session.deleteMany({ where: { userId } })] : []),
  ])
  return ok(null)
}

/** Deletes the account; clubs they presided over are left without a president. */
export async function deleteUser(actor: Actor | null, userId: string): Promise<Result<null>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const blocked = guardTarget(access.value, userId)
  if (blocked) return blocked

  const { count } = await db.user.deleteMany({ where: { id: userId } })
  if (count === 0) return fail('NOT_FOUND', 'User not found.')
  return ok(null)
}

export async function getAdminStats(actor: Actor | null) {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const [users, clubs, memberships, follows, posts, events, activeInvites] = await Promise.all([
    db.user.count(),
    db.club.count({ where: { status: 'ACTIVE' } }),
    db.membership.count(),
    db.follow.count(),
    db.post.count(),
    db.event.count(),
    db.invite.count({
      where: { usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ])
  return ok({ users, clubs, memberships, follows, posts, events, activeInvites })
}
