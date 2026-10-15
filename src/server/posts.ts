import type { Post } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import type { PostInput } from '@/lib/validation'
import { canSeeMembersContent, requireClubManager } from '@/server/access'
import { isAdmin, type Actor } from '@/server/actor'
import { getFeedClubIds } from '@/server/my-clubs'
import { fail, ok, type Result } from '@/server/result'

const authorSelect = { author: { select: { name: true, image: true } } } as const

export async function listClubPosts(
  club: { id: string; presidentId: string | null },
  viewer: Actor | null,
) {
  const includeMembersOnly = await canSeeMembersContent(viewer, club)
  return db.post.findMany({
    where: { clubId: club.id, ...(includeMembersOnly ? {} : { visibility: 'PUBLIC' }) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: authorSelect,
  })
}

/** How many members-only posts the viewer can't see, so the page can say so. */
export async function countHiddenPosts(
  club: { id: string; presidentId: string | null },
  viewer: Actor | null,
): Promise<number> {
  if (await canSeeMembersContent(viewer, club)) return 0
  return db.post.count({ where: { clubId: club.id, visibility: 'MEMBERS' } })
}

export async function createPost(
  actor: Actor | null,
  clubId: string,
  input: PostInput,
): Promise<Result<Post>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access
  const post = await db.post.create({
    data: { ...input, clubId, authorId: access.value.actor.id },
  })
  return ok(post)
}

async function loadOwnedPost(actor: Actor | null, postId: string) {
  const post = await db.post.findUnique({ where: { id: postId }, select: { clubId: true } })
  if (!post) return fail('NOT_FOUND', 'Post not found.')
  return requireClubManager(actor, post.clubId)
}

export async function updatePost(
  actor: Actor | null,
  postId: string,
  input: PostInput,
): Promise<Result<Post>> {
  const access = await loadOwnedPost(actor, postId)
  if (!access.ok) return access
  return ok(await db.post.update({ where: { id: postId }, data: input }))
}

export async function deletePost(actor: Actor | null, postId: string): Promise<Result<null>> {
  const access = await loadOwnedPost(actor, postId)
  if (!access.ok) return access
  await db.post.delete({ where: { id: postId } })
  return ok(null)
}

export async function getPostForEdit(actor: Actor | null, postId: string) {
  const access = await loadOwnedPost(actor, postId)
  if (!access.ok) return null
  return db.post.findUnique({ where: { id: postId } })
}

/**
 * Posts from clubs the viewer follows or belongs to. Members-only posts are
 * included only for clubs the viewer is a member or president of.
 */
export async function getFeed(actor: Actor) {
  const { clubIds, insiderClubIds } = await getFeedClubIds(actor)
  if (clubIds.length === 0) return []

  const visibilityFilter = isAdmin(actor)
    ? {}
    : { OR: [{ visibility: 'PUBLIC' as const }, { clubId: { in: insiderClubIds } }] }

  return db.post.findMany({
    where: { clubId: { in: clubIds }, club: { status: 'ACTIVE' }, ...visibilityFilter },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { ...authorSelect, club: { select: { name: true, slug: true, logoUrl: true } } },
  })
}

export async function listRecentPostsForAdmin(actor: Actor | null) {
  if (!isAdmin(actor)) return []
  return db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { ...authorSelect, club: { select: { name: true, slug: true } } },
  })
}
