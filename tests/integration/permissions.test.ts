import { describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  assignPresident,
  createClub as createClubService,
  getClubBySlug,
  setClubStatus,
  updateClubProfile,
} from '@/server/clubs'
import { createEvent, listClubEvents, listFeedEvents } from '@/server/events'
import { followClub, isFollowing, unfollowClub } from '@/server/follows'
import { addGalleryImage, deleteGalleryImage } from '@/server/gallery'
import { leaveClub, removeMember } from '@/server/memberships'
import { countHiddenPosts, createPost, deletePost, getFeed, listClubPosts } from '@/server/posts'
import { deleteUser, setUserBanned } from '@/server/users'

import {
  actorOf,
  createAdmin,
  createClub,
  createClubWithPresident,
  createUser,
} from '../support/factories'

const profile = {
  name: 'Robotics',
  description: 'We build robots',
  category: 'Technology' as const,
  logoUrl: null,
  coverUrl: null,
}

describe('club administration', () => {
  it('only the admin can create clubs, optionally with a president', async () => {
    const admin = actorOf(await createAdmin())
    const president = await createUser({ email: 'pres@example.com' })

    const created = await createClubService(admin, {
      ...profile,
      slug: 'robotics',
      presidentEmail: 'pres@example.com',
    })
    expect(created).toMatchObject({ ok: true, value: { presidentId: president.id } })

    const byUser = await createClubService(actorOf(president), { ...profile, slug: 'other' })
    expect(byUser).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } })

    const duplicate = await createClubService(admin, { ...profile, slug: 'robotics' })
    expect(duplicate).toMatchObject({ ok: false, error: { code: 'CONFLICT' } })
  })

  it('reassigning the president moves management rights', async () => {
    const admin = actorOf(await createAdmin())
    const { club, presidentActor } = await createClubWithPresident()
    const successor = await createUser()

    expect((await assignPresident(admin, club.id, successor.email)).ok).toBe(true)

    expect(await updateClubProfile(presidentActor, club.id, profile)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect((await updateClubProfile(actorOf(successor), club.id, profile)).ok).toBe(true)
  })

  it('archived clubs are hidden from everyone but the admin', async () => {
    const admin = actorOf(await createAdmin())
    const { club, presidentActor } = await createClubWithPresident()
    await setClubStatus(admin, club.id, 'ARCHIVED')

    expect(await getClubBySlug(club.slug, null)).toBeNull()
    expect(await getClubBySlug(club.slug, presidentActor)).toBeNull()
    expect(await getClubBySlug(club.slug, admin)).not.toBeNull()
    expect(
      await createPost(presidentActor, club.id, { title: 't', body: 'b', visibility: 'PUBLIC' }),
    ).toMatchObject({ error: { code: 'CLUB_ARCHIVED' } })
  })
})

describe('club content', () => {
  it('only the president or admin can publish', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const member = await createUser()
    await db.membership.create({ data: { userId: member.id, clubId: club.id } })
    const post = { title: 'Hello', body: 'World', visibility: 'PUBLIC' as const }

    expect((await createPost(presidentActor, club.id, post)).ok).toBe(true)
    expect(await createPost(actorOf(member), club.id, post)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(
      await createEvent(actorOf(member), club.id, {
        title: 'Meetup',
        description: '',
        startsAt: new Date(),
        endsAt: null,
        venue: '',
      }),
    ).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(await addGalleryImage(null, club.id, { url: '/x.png', caption: '' })).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    })
  })

  it('the admin can moderate any content', async () => {
    const admin = actorOf(await createAdmin())
    const { club, presidentActor } = await createClubWithPresident()
    const post = await createPost(presidentActor, club.id, {
      title: 'Oops',
      body: 'spam',
      visibility: 'PUBLIC',
    })
    const image = await addGalleryImage(presidentActor, club.id, { url: '/a.png', caption: '' })
    if (!post.ok || !image.ok) throw new Error('setup failed')

    expect((await deletePost(admin, post.value.id)).ok).toBe(true)
    expect((await deleteGalleryImage(admin, image.value.id)).ok).toBe(true)
  })

  it('members-only posts are visible to members, the president and the admin only', async () => {
    const { club, president, presidentActor } = await createClubWithPresident()
    await createPost(presidentActor, club.id, { title: 'Public', body: '.', visibility: 'PUBLIC' })
    await createPost(presidentActor, club.id, { title: 'Secret', body: '.', visibility: 'MEMBERS' })
    const member = await createUser()
    await db.membership.create({ data: { userId: member.id, clubId: club.id } })
    const follower = await createUser()
    const admin = await createAdmin()

    const titles = async (viewer: Parameters<typeof listClubPosts>[1]) =>
      (await listClubPosts(club, viewer)).map((p) => p.title).sort()

    expect(await titles(null)).toEqual(['Public'])
    expect(await titles(actorOf(follower))).toEqual(['Public'])
    expect(await titles(actorOf(member))).toEqual(['Public', 'Secret'])
    expect(await titles(actorOf(president))).toEqual(['Public', 'Secret'])
    expect(await titles(actorOf(admin))).toEqual(['Public', 'Secret'])
  })

  it('tells outsiders how many members-only posts they cannot see', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    await createPost(presidentActor, club.id, { title: 'A', body: '.', visibility: 'MEMBERS' })
    await createPost(presidentActor, club.id, { title: 'B', body: '.', visibility: 'MEMBERS' })

    expect(await countHiddenPosts(club, null)).toBe(2)
    expect(await countHiddenPosts(club, presidentActor)).toBe(0)
  })

  it('splits events into upcoming and past', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const day = 86_400_000
    const base = { description: '', venue: '', endsAt: null }
    await createEvent(presidentActor, club.id, {
      ...base,
      title: 'Next week',
      startsAt: new Date(Date.now() + 7 * day),
    })
    await createEvent(presidentActor, club.id, {
      ...base,
      title: 'Last week',
      startsAt: new Date(Date.now() - 7 * day),
    })
    await createEvent(presidentActor, club.id, {
      ...base,
      title: 'Happening now',
      startsAt: new Date(Date.now() - day),
      endsAt: new Date(Date.now() + day),
    })

    const { upcoming, past } = await listClubEvents(club.id)
    expect(upcoming.map((e) => e.title)).toEqual(['Happening now', 'Next week'])
    expect(past.map((e) => e.title)).toEqual(['Last week'])
  })
})

describe('following and the feed', () => {
  it('follow is idempotent and requires sign-in', async () => {
    const club = await createClub()
    const user = actorOf(await createUser())

    expect((await followClub(user, club.id)).ok).toBe(true)
    expect((await followClub(user, club.id)).ok).toBe(true)
    expect(await isFollowing(user.id, club.id)).toBe(true)
    expect(await followClub(null, club.id)).toMatchObject({ error: { code: 'UNAUTHENTICATED' } })

    await unfollowClub(user, club.id)
    expect(await isFollowing(user.id, club.id)).toBe(false)
  })

  it('the feed shows followed clubs and hides members-only posts from followers', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const other = await createClubWithPresident()
    await createPost(presidentActor, club.id, { title: 'Open', body: '.', visibility: 'PUBLIC' })
    await createPost(presidentActor, club.id, { title: 'Inner', body: '.', visibility: 'MEMBERS' })
    await createPost(other.presidentActor, other.club.id, {
      title: 'Unrelated',
      body: '.',
      visibility: 'PUBLIC',
    })

    const follower = actorOf(await createUser())
    await followClub(follower, club.id)
    expect((await getFeed(follower)).map((p) => p.title)).toEqual(['Open'])

    const member = await createUser()
    await db.membership.create({ data: { userId: member.id, clubId: club.id } })
    expect((await getFeed(actorOf(member))).map((p) => p.title).sort()).toEqual(['Inner', 'Open'])
  })
})

describe('feed events', () => {
  it('lists upcoming events from followed and joined clubs only', async () => {
    const followed = await createClubWithPresident()
    const joined = await createClubWithPresident()
    const unrelated = await createClubWithPresident()
    const soon = (days: number) => new Date(Date.now() + days * 86_400_000)
    const base = { description: '', venue: '', endsAt: null }
    await createEvent(followed.presidentActor, followed.club.id, {
      ...base,
      title: 'Followed',
      startsAt: soon(2),
    })
    await createEvent(followed.presidentActor, followed.club.id, {
      ...base,
      title: 'Old',
      startsAt: soon(-2),
    })
    await createEvent(joined.presidentActor, joined.club.id, {
      ...base,
      title: 'Joined',
      startsAt: soon(1),
    })
    await createEvent(unrelated.presidentActor, unrelated.club.id, {
      ...base,
      title: 'Other',
      startsAt: soon(1),
    })

    const user = await createUser()
    await followClub(actorOf(user), followed.club.id)
    await db.membership.create({ data: { userId: user.id, clubId: joined.club.id } })

    expect((await listFeedEvents(actorOf(user))).map((e) => e.title)).toEqual([
      'Joined',
      'Followed',
    ])
  })
})

describe('membership management', () => {
  it('the president can remove members and members can leave', async () => {
    const { club, presidentActor } = await createClubWithPresident()
    const [a, b] = await Promise.all([createUser(), createUser()])
    await db.membership.createMany({
      data: [
        { userId: a.id, clubId: club.id },
        { userId: b.id, clubId: club.id },
      ],
    })

    expect(await removeMember(actorOf(b), club.id, a.id)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect((await removeMember(presidentActor, club.id, a.id)).ok).toBe(true)
    expect((await leaveClub(actorOf(b), club.id)).ok).toBe(true)
    expect(await db.membership.count({ where: { clubId: club.id } })).toBe(0)
  })
})

describe('user administration', () => {
  it('banning ends sessions, and the admin cannot ban or delete themselves', async () => {
    const adminUser = await createAdmin()
    const admin = actorOf(adminUser)
    const target = await createUser()
    await db.session.create({
      data: {
        id: 's1',
        token: 'token-1',
        userId: target.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    expect((await setUserBanned(admin, target.id, true)).ok).toBe(true)
    expect(await db.session.count({ where: { userId: target.id } })).toBe(0)
    expect((await db.user.findUniqueOrThrow({ where: { id: target.id } })).banned).toBe(true)

    expect(await setUserBanned(admin, adminUser.id, true)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(await deleteUser(admin, adminUser.id)).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(await setUserBanned(actorOf(target), adminUser.id, true)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
  })

  it('deleting a president leaves their club without one', async () => {
    const admin = actorOf(await createAdmin())
    const { club, president } = await createClubWithPresident()

    expect((await deleteUser(admin, president.id)).ok).toBe(true)
    expect((await db.club.findUniqueOrThrow({ where: { id: club.id } })).presidentId).toBeNull()
  })
})
