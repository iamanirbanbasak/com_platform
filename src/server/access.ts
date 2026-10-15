import type { Club } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { isAdmin, type Actor } from '@/server/actor'
import { fail, ok, type Result } from '@/server/result'

type ClubRef = Pick<Club, 'id' | 'presidentId' | 'status'>

export function canManageClub(actor: Actor | null, club: Pick<Club, 'presidentId'>): boolean {
  if (!actor) return false
  return isAdmin(actor) || club.presidentId === actor.id
}

/**
 * Loads a club and checks the actor is its president or the admin.
 * Archived clubs can only be managed by the admin.
 */
export async function requireClubManager(
  actor: Actor | null,
  clubId: string,
): Promise<Result<{ actor: Actor; club: ClubRef }>> {
  if (!actor) return fail('UNAUTHENTICATED', 'Please sign in to continue.')

  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { id: true, presidentId: true, status: true },
  })
  if (!club) return fail('NOT_FOUND', 'Club not found.')
  if (!canManageClub(actor, club)) return fail('FORBIDDEN', 'Only the club president can do that.')
  if (club.status === 'ARCHIVED' && !isAdmin(actor)) {
    return fail('CLUB_ARCHIVED', 'This club has been archived.')
  }

  return ok({ actor, club })
}

/** Members, the president and the admin can see members-only posts. */
export async function canSeeMembersContent(
  actor: Actor | null,
  club: Pick<Club, 'id' | 'presidentId'>,
): Promise<boolean> {
  if (!actor) return false
  if (canManageClub(actor, club)) return true
  const membership = await db.membership.findUnique({
    where: { userId_clubId: { userId: actor.id, clubId: club.id } },
    select: { id: true },
  })
  return membership !== null
}
