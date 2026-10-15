import { customAlphabet } from 'nanoid'

import type { Invite } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { requireClubManager } from '@/server/access'
import { requireAdmin, type Actor } from '@/server/actor'
import { isUniqueViolation } from '@/server/errors'
import { fail, ok, type Result } from '@/server/result'

// No 0/O, 1/I/L so codes can be read aloud or typed from a screenshot.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LENGTH = 10
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

const randomCode = customAlphabet(ALPHABET, CODE_LENGTH)

export function formatInviteCode(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`
}

/** Accepts user-typed codes in any case, with or without separators. */
export function normalizeInviteCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compact.length !== CODE_LENGTH) return null
  return formatInviteCode(compact)
}

export type InviteStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED'

export function inviteStatus(
  invite: Pick<Invite, 'usedAt' | 'revokedAt' | 'expiresAt'>,
  now = new Date(),
): InviteStatus {
  if (invite.usedAt) return 'USED'
  if (invite.revokedAt) return 'REVOKED'
  if (invite.expiresAt <= now) return 'EXPIRED'
  return 'ACTIVE'
}

export async function createInvite(actor: Actor | null, clubId: string): Promise<Result<Invite>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access
  if (access.value.club.status === 'ARCHIVED') {
    return fail('CLUB_ARCHIVED', 'Archived clubs cannot invite members.')
  }

  // A collision is astronomically unlikely (31^10 codes), but retry rather than fail.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const invite = await db.invite.create({
        data: {
          code: formatInviteCode(randomCode()),
          clubId,
          createdById: access.value.actor.id,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      })
      return ok(invite)
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) throw error
    }
  }
  throw new Error('Could not generate a unique invite code')
}

export async function revokeInvite(actor: Actor | null, inviteId: string): Promise<Result<Invite>> {
  const invite = await db.invite.findUnique({ where: { id: inviteId } })
  if (!invite) return fail('NOT_FOUND', 'Invite not found.')

  const access = await requireClubManager(actor, invite.clubId)
  if (!access.ok) return access

  if (invite.usedAt) return fail('USED', 'This invite has already been used.')
  if (invite.revokedAt) return ok(invite)

  return ok(await db.invite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } }))
}

const REDEEM_ERRORS = {
  NOT_FOUND: 'That invite code does not exist. Check it and try again.',
  REVOKED: 'This invite was revoked by the club president.',
  USED: 'This invite has already been used.',
  EXPIRED: 'This invite has expired. Ask the club president for a new one.',
  CLUB_ARCHIVED: 'This club is no longer active.',
  ALREADY_MEMBER: 'You are already an official member of this club.',
} as const

type RedeemError = keyof typeof REDEEM_ERRORS
const redeemFail = (code: RedeemError) => fail(code, REDEEM_ERRORS[code])

/**
 * Turns the actor into an official member of the invite's club.
 * The invite is claimed with a conditional update inside the transaction, so of
 * two concurrent redemptions of the same code exactly one succeeds.
 */
export async function redeemInvite(
  actor: Actor | null,
  rawCode: string,
): Promise<Result<{ clubSlug: string; clubName: string }>> {
  if (!actor) return fail('UNAUTHENTICATED', 'Please sign in to accept the invite.')

  const code = normalizeInviteCode(rawCode)
  if (!code) return redeemFail('NOT_FOUND')

  try {
    return await db.$transaction(async (tx) => {
      const now = new Date()
      const invite = await tx.invite.findUnique({
        where: { code },
        include: { club: { select: { slug: true, name: true, status: true } } },
      })
      if (!invite) return redeemFail('NOT_FOUND')

      const status = inviteStatus(invite, now)
      if (status !== 'ACTIVE') return redeemFail(status)
      if (invite.club.status !== 'ACTIVE') return redeemFail('CLUB_ARCHIVED')

      // Checked before claiming so an existing member doesn't burn a spare code.
      const existing = await tx.membership.findUnique({
        where: { userId_clubId: { userId: actor.id, clubId: invite.clubId } },
        select: { id: true },
      })
      if (existing) return redeemFail('ALREADY_MEMBER')

      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now, usedById: actor.id },
      })
      if (claimed.count !== 1) return redeemFail('USED')

      await tx.membership.create({
        data: { userId: actor.id, clubId: invite.clubId, inviteId: invite.id },
      })
      return ok({ clubSlug: invite.club.slug, clubName: invite.club.name })
    })
  } catch (error: unknown) {
    // Same user racing two different codes for one club: the membership unique
    // constraint rejects the loser and its transaction (and invite claim) rolls back.
    if (isUniqueViolation(error)) return redeemFail('ALREADY_MEMBER')
    throw error
  }
}

/** Public preview for the join page; reveals only the club, not who created it. */
export async function getInvitePreview(rawCode: string) {
  const code = normalizeInviteCode(rawCode)
  if (!code) return null
  const invite = await db.invite.findUnique({
    where: { code },
    select: {
      code: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      club: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } },
    },
  })
  if (!invite) return null
  return { ...invite, status: inviteStatus(invite) }
}

export async function listClubInvites(actor: Actor | null, clubId: string) {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access
  const invites = await db.invite.findMany({
    where: { clubId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { usedBy: { select: { name: true, email: true } } },
  })
  return ok(invites.map((invite) => ({ ...invite, status: inviteStatus(invite) })))
}

export async function listAllInvites(actor: Actor | null) {
  const access = requireAdmin(actor)
  if (!access.ok) return access
  const invites = await db.invite.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      club: { select: { name: true, slug: true } },
      createdBy: { select: { name: true } },
      usedBy: { select: { name: true, email: true } },
    },
  })
  return ok(invites.map((invite) => ({ ...invite, status: inviteStatus(invite) })))
}
