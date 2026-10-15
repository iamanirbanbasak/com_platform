import { db } from '@/lib/db'
import type { Actor } from '@/server/actor'

/**
 * Clubs that make up a user's feed: followed, joined or presided over.
 * `insiderClubIds` are the ones whose members-only content they may see.
 */
export async function getFeedClubIds(actor: Actor) {
  const [follows, memberships, presided] = await Promise.all([
    db.follow.findMany({ where: { userId: actor.id }, select: { clubId: true } }),
    db.membership.findMany({ where: { userId: actor.id }, select: { clubId: true } }),
    db.club.findMany({ where: { presidentId: actor.id }, select: { id: true } }),
  ])
  const insiderClubIds = [...memberships.map((m) => m.clubId), ...presided.map((c) => c.id)]
  const clubIds = [...new Set([...follows.map((f) => f.clubId), ...insiderClubIds])]
  return { clubIds, insiderClubIds }
}
