import { describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  createInvite,
  formatInviteCode,
  normalizeInviteCode,
  redeemInvite,
  revokeInvite,
} from '@/server/invites'

import {
  actorOf,
  createAdmin,
  createClub,
  createClubWithPresident,
  createUser,
} from '../support/factories'

async function inviteFor(clubId: string, presidentActor: Parameters<typeof createInvite>[0]) {
  const result = await createInvite(presidentActor, clubId)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

describe('invite codes', () => {
  it('formats and normalizes codes regardless of case and separators', () => {
    expect(formatInviteCode('ABCDEFGHJK')).toBe('ABCD-EFGH-JK')
    expect(normalizeInviteCode(' abcd efgh-jk ')).toBe('ABCD-EFGH-JK')
    expect(normalizeInviteCode('too-short')).toBeNull()
  })
})

describe('createInvite', () => {
  it('lets the president create a unique 7-day invite', async () => {
    const { club, presidentActor } = await createClubWithPresident()

    const a = await inviteFor(club.id, presidentActor)
    const b = await inviteFor(club.id, presidentActor)

    expect(a.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{2}$/)
    expect(a.code).not.toBe(b.code)
    const days = (a.expiresAt.getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThanOrEqual(7)
  })

  it('lets the admin create invites for any club', async () => {
    const club = await createClub()
    const admin = await createAdmin()
    const result = await createInvite(actorOf(admin), club.id)
    expect(result.ok).toBe(true)
  })

  it('rejects members, other users and anonymous callers', async () => {
    const { club } = await createClubWithPresident()
    const stranger = await createUser()

    expect(await createInvite(actorOf(stranger), club.id)).toMatchObject({
      ok: false,
      error: { code: 'FORBIDDEN' },
    })
    expect(await createInvite(null, club.id)).toMatchObject({
      ok: false,
      error: { code: 'UNAUTHENTICATED' },
    })
  })

  it('refuses invites for archived clubs', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    await db.club.update({ where: { id: club.id }, data: { status: 'ARCHIVED' } })
    expect(await createInvite(presidentActor, club.id)).toMatchObject({
      ok: false,
      error: { code: 'CLUB_ARCHIVED' },
    })
  })
})

describe('redeemInvite', () => {
  it('makes the user an official member and marks the invite used', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    const joiner = await createUser()

    const result = await redeemInvite(actorOf(joiner), invite.code.toLowerCase())

    expect(result).toEqual({ ok: true, value: { clubSlug: club.slug, clubName: club.name } })
    const membership = await db.membership.findUnique({
      where: { userId_clubId: { userId: joiner.id, clubId: club.id } },
    })
    expect(membership?.inviteId).toBe(invite.id)
    const stored = await db.invite.findUniqueOrThrow({ where: { id: invite.id } })
    expect(stored.usedById).toBe(joiner.id)
    expect(stored.usedAt).not.toBeNull()
  })

  it('is single-use', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    await redeemInvite(actorOf(await createUser()), invite.code)

    const second = await redeemInvite(actorOf(await createUser()), invite.code)
    expect(second).toMatchObject({ ok: false, error: { code: 'USED' } })
  })

  it('lets exactly one of two concurrent redemptions win', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    const [alice, bob] = await Promise.all([createUser(), createUser()])

    const results = await Promise.all([
      redeemInvite(actorOf(alice), invite.code),
      redeemInvite(actorOf(bob), invite.code),
    ])

    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.find((r) => !r.ok)).toMatchObject({ error: { code: 'USED' } })
    expect(await db.membership.count({ where: { clubId: club.id } })).toBe(1)
  })

  it('rejects expired, revoked and unknown codes', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const joiner = actorOf(await createUser())

    const expired = await inviteFor(club.id, presidentActor)
    await db.invite.update({ where: { id: expired.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect(await redeemInvite(joiner, expired.code)).toMatchObject({ error: { code: 'EXPIRED' } })

    const revoked = await inviteFor(club.id, presidentActor)
    expect((await revokeInvite(presidentActor, revoked.id)).ok).toBe(true)
    expect(await redeemInvite(joiner, revoked.code)).toMatchObject({ error: { code: 'REVOKED' } })

    expect(await redeemInvite(joiner, 'ZZZZ-ZZZZ-ZZ')).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
  })

  it('does not burn the code when the user is already a member', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const joiner = actorOf(await createUser())
    await redeemInvite(joiner, (await inviteFor(club.id, presidentActor)).code)

    const spare = await inviteFor(club.id, presidentActor)
    expect(await redeemInvite(joiner, spare.code)).toMatchObject({
      error: { code: 'ALREADY_MEMBER' },
    })
    const stored = await db.invite.findUniqueOrThrow({ where: { id: spare.id } })
    expect(stored.usedAt).toBeNull()
  })

  it('maps a concurrent double-join by the same user to ALREADY_MEMBER', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const joiner = actorOf(await createUser())
    const [a, b] = await Promise.all([
      inviteFor(club.id, presidentActor),
      inviteFor(club.id, presidentActor),
    ])

    const results = await Promise.all([redeemInvite(joiner, a.code), redeemInvite(joiner, b.code)])

    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.find((r) => !r.ok)).toMatchObject({ error: { code: 'ALREADY_MEMBER' } })
    expect(await db.invite.count({ where: { clubId: club.id, usedAt: { not: null } } })).toBe(1)
  })

  it('rejects codes for archived clubs', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    await db.club.update({ where: { id: club.id }, data: { status: 'ARCHIVED' } })

    expect(await redeemInvite(actorOf(await createUser()), invite.code)).toMatchObject({
      error: { code: 'CLUB_ARCHIVED' },
    })
  })

  it('requires sign-in', async () => {
    expect(await redeemInvite(null, 'ABCD-EFGH-JK')).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    })
  })
})

describe('revokeInvite', () => {
  it('cannot revoke an invite that was already used', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    await redeemInvite(actorOf(await createUser()), invite.code)

    expect(await revokeInvite(presidentActor, invite.id)).toMatchObject({
      error: { code: 'USED' },
    })
  })

  it('is forbidden for non-presidents', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const invite = await inviteFor(club.id, presidentActor)
    const stranger = actorOf(await createUser())

    expect(await revokeInvite(stranger, invite.id)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
  })
})
