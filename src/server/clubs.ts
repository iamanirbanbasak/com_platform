import type { Club, ClubStatus } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import type { ClubProfileInput, CreateClubInput } from '@/lib/validation'
import { canManageClub, requireClubManager } from '@/server/access'
import { isAdmin, requireAdmin, type Actor } from '@/server/actor'
import { isUniqueViolation } from '@/server/errors'
import { fail, ok, type Result } from '@/server/result'

export type ClubListFilters = { query?: string; category?: string }

export async function listClubs({ query, category }: ClubListFilters = {}) {
  return db.club.findMany({
    where: {
      status: 'ACTIVE',
      ...(category ? { category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    include: { _count: { select: { memberships: true, follows: true } } },
  })
}

/** Archived clubs are only visible to the admin. */
export async function getClubBySlug(slug: string, viewer: Actor | null) {
  const club = await db.club.findUnique({
    where: { slug },
    include: {
      president: { select: { id: true, name: true, image: true } },
      _count: { select: { memberships: true, follows: true } },
    },
  })
  if (!club) return null
  if (club.status === 'ARCHIVED' && !isAdmin(viewer)) return null
  return club
}

/** Club for the president's management area, or null when the viewer can't manage it. */
export async function getManagedClub(slug: string, actor: Actor | null) {
  const club = await db.club.findUnique({ where: { slug } })
  if (!club || !canManageClub(actor, club)) return null
  if (club.status === 'ARCHIVED' && !isAdmin(actor)) return null
  return club
}

export async function listClubsPresidedBy(userId: string) {
  return db.club.findMany({
    where: { presidentId: userId, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}

export async function createClub(
  actor: Actor | null,
  input: CreateClubInput,
): Promise<Result<Club>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access

  let presidentId: string | null = null
  if (input.presidentEmail) {
    presidentId = await findUserIdByEmail(input.presidentEmail)
    if (!presidentId) {
      return fail('VALIDATION', 'No account uses that email. Ask them to sign up first.')
    }
  }

  try {
    const club = await db.club.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        category: input.category,
        logoUrl: input.logoUrl ?? null,
        coverUrl: input.coverUrl ?? null,
        presidentId,
      },
    })
    return ok(club)
  } catch (error: unknown) {
    if (isUniqueViolation(error)) return fail('CONFLICT', 'That URL slug is already taken.')
    throw error
  }
}

export async function updateClubProfile(
  actor: Actor | null,
  clubId: string,
  input: ClubProfileInput,
): Promise<Result<Club>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access

  const club = await db.club.update({
    where: { id: clubId },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      logoUrl: input.logoUrl,
      coverUrl: input.coverUrl,
    },
  })
  return ok(club)
}

export async function setClubStatus(
  actor: Actor | null,
  clubId: string,
  status: ClubStatus,
): Promise<Result<Club>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const club = await db.club.findUnique({ where: { id: clubId }, select: { id: true } })
  if (!club) return fail('NOT_FOUND', 'Club not found.')
  return ok(await db.club.update({ where: { id: clubId }, data: { status } }))
}

/** Pass null to leave the club without a president. */
export async function assignPresident(
  actor: Actor | null,
  clubId: string,
  presidentEmail: string | null,
): Promise<Result<Club>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access

  const club = await db.club.findUnique({ where: { id: clubId }, select: { id: true } })
  if (!club) return fail('NOT_FOUND', 'Club not found.')

  let presidentId: string | null = null
  if (presidentEmail) {
    presidentId = await findUserIdByEmail(presidentEmail.trim().toLowerCase())
    if (!presidentId) return fail('NOT_FOUND', 'No account uses that email.')
  }

  return ok(await db.club.update({ where: { id: clubId }, data: { presidentId } }))
}

export async function deleteClub(actor: Actor | null, clubId: string): Promise<Result<null>> {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const { count } = await db.club.deleteMany({ where: { id: clubId } })
  if (count === 0) return fail('NOT_FOUND', 'Club not found.')
  return ok(null)
}

export async function listAllClubsForAdmin(actor: Actor | null) {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const clubs = await db.club.findMany({
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      president: { select: { name: true, email: true } },
      _count: { select: { memberships: true, follows: true } },
    },
  })
  return ok(clubs)
}

export async function listCategoriesInUse(): Promise<string[]> {
  const rows = await db.club.findMany({
    where: { status: 'ACTIVE' },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  })
  return rows.map((row) => row.category)
}
