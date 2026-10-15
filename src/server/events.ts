import type { Event } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import type { EventInput } from '@/lib/validation'
import { requireClubManager } from '@/server/access'
import { isAdmin, type Actor } from '@/server/actor'
import { fail, ok, type Result } from '@/server/result'

const clubSelect = { club: { select: { name: true, slug: true, logoUrl: true } } } as const

/** An event counts as upcoming until it ends (or starts, when it has no end time). */
function upcomingFilter(now: Date) {
  return {
    OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
  }
}

// Spelled out rather than NOT(upcoming): SQL NULL comparisons would drop open-ended events.
function pastFilter(now: Date) {
  return {
    OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: now } }],
  }
}

export async function listUpcomingEvents(limit = 50) {
  return db.event.findMany({
    where: { ...upcomingFilter(new Date()), club: { status: 'ACTIVE' } },
    orderBy: { startsAt: 'asc' },
    take: limit,
    include: clubSelect,
  })
}

export async function listClubEvents(clubId: string) {
  const now = new Date()
  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { clubId, ...upcomingFilter(now) },
      orderBy: { startsAt: 'asc' },
    }),
    db.event.findMany({
      where: { clubId, ...pastFilter(now) },
      orderBy: { startsAt: 'desc' },
      take: 20,
    }),
  ])
  return { upcoming, past }
}

export async function createEvent(
  actor: Actor | null,
  clubId: string,
  input: EventInput,
): Promise<Result<Event>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access
  return ok(
    await db.event.create({
      data: { ...input, endsAt: input.endsAt ?? null, coverUrl: input.coverUrl ?? null, clubId },
    }),
  )
}

async function loadOwnedEvent(actor: Actor | null, eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { clubId: true } })
  if (!event) return fail('NOT_FOUND', 'Event not found.')
  return requireClubManager(actor, event.clubId)
}

export async function updateEvent(
  actor: Actor | null,
  eventId: string,
  input: EventInput,
): Promise<Result<Event>> {
  const access = await loadOwnedEvent(actor, eventId)
  if (!access.ok) return access
  return ok(
    await db.event.update({
      where: { id: eventId },
      data: { ...input, endsAt: input.endsAt ?? null, coverUrl: input.coverUrl ?? null },
    }),
  )
}

export async function deleteEvent(actor: Actor | null, eventId: string): Promise<Result<null>> {
  const access = await loadOwnedEvent(actor, eventId)
  if (!access.ok) return access
  await db.event.delete({ where: { id: eventId } })
  return ok(null)
}

export async function getEventForEdit(actor: Actor | null, eventId: string) {
  const access = await loadOwnedEvent(actor, eventId)
  if (!access.ok) return null
  return db.event.findUnique({ where: { id: eventId } })
}

export async function listRecentEventsForAdmin(actor: Actor | null) {
  if (!isAdmin(actor)) return []
  return db.event.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: clubSelect })
}
