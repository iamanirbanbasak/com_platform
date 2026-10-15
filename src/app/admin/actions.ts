'use server'

import { revalidatePath } from 'next/cache'

import { formValues, fromResult, invalid, type ActionState } from '@/lib/action-state'
import { createClubSchema } from '@/lib/validation'
import { assignPresident, createClub, deleteClub, setClubStatus } from '@/server/clubs'
import { deleteEvent } from '@/server/events'
import { deleteGalleryImage } from '@/server/gallery'
import { revokeInvite } from '@/server/invites'
import { deletePost } from '@/server/posts'
import { deleteUser, setUserBanned } from '@/server/users'
import { requireAdmin } from '@/server/actor'
import { getCurrentUser } from '@/server/session'
import { imageFromForm } from '@/server/uploads'

function refreshAll() {
  // Admin changes can touch any page, so refresh everything under the root layout.
  revalidatePath('/', 'layout')
}

export async function createClubAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createClubSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)

  const user = await getCurrentUser()
  const access = requireAdmin(user)
  if (!access.ok) return fromResult(access, '')

  const logo = await imageFromForm(formData, 'logo', 'clubs')
  if (!logo.ok) return fromResult(logo, '')

  const result = await createClub(user, { ...parsed.data, logoUrl: logo.value ?? null })
  refreshAll()
  if (!result.ok && result.error.code === 'CONFLICT') {
    return {
      ok: false,
      message: result.error.message,
      fieldErrors: { slug: [result.error.message] },
      at: Date.now(),
    }
  }
  if (!result.ok && result.error.code === 'VALIDATION') {
    return {
      ok: false,
      message: result.error.message,
      fieldErrors: { presidentEmail: [result.error.message] },
      at: Date.now(),
    }
  }
  return fromResult(result, `Created ${parsed.data.name}.`)
}

export async function assignPresidentAction(
  clubId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('presidentEmail') ?? '').trim()
  const result = await assignPresident(await getCurrentUser(), clubId, email || null)
  refreshAll()
  return fromResult(result, email ? `President set to ${email}.` : 'President removed.')
}

export async function setClubStatusAction(clubId: string, archived: boolean): Promise<ActionState> {
  const result = await setClubStatus(
    await getCurrentUser(),
    clubId,
    archived ? 'ARCHIVED' : 'ACTIVE',
  )
  refreshAll()
  return fromResult(result, archived ? 'Club archived.' : 'Club restored.')
}

export async function deleteClubAction(clubId: string): Promise<ActionState> {
  const result = await deleteClub(await getCurrentUser(), clubId)
  refreshAll()
  return fromResult(result, 'Club deleted.')
}

export async function setUserBannedAction(userId: string, banned: boolean): Promise<ActionState> {
  const result = await setUserBanned(await getCurrentUser(), userId, banned)
  refreshAll()
  return fromResult(result, banned ? 'User banned and signed out.' : 'User unbanned.')
}

export async function deleteUserAction(userId: string): Promise<ActionState> {
  const result = await deleteUser(await getCurrentUser(), userId)
  refreshAll()
  return fromResult(result, 'User deleted.')
}

export async function adminRevokeInviteAction(inviteId: string): Promise<ActionState> {
  const result = await revokeInvite(await getCurrentUser(), inviteId)
  refreshAll()
  return fromResult(result, 'Invite revoked.')
}

export async function adminDeletePostAction(postId: string): Promise<ActionState> {
  const result = await deletePost(await getCurrentUser(), postId)
  refreshAll()
  return fromResult(result, 'Post deleted.')
}

export async function adminDeleteEventAction(eventId: string): Promise<ActionState> {
  const result = await deleteEvent(await getCurrentUser(), eventId)
  refreshAll()
  return fromResult(result, 'Event deleted.')
}

export async function adminDeleteImageAction(imageId: string): Promise<ActionState> {
  const result = await deleteGalleryImage(await getCurrentUser(), imageId)
  refreshAll()
  return fromResult(result, 'Photo removed.')
}
