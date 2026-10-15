'use server'

import { revalidatePath } from 'next/cache'

import { formValues, fromResult, invalid, type ActionState } from '@/lib/action-state'
import { clubProfileSchema, eventSchema, galleryCaptionSchema, postSchema } from '@/lib/validation'
import { requireClubManager } from '@/server/access'
import { updateClubProfile } from '@/server/clubs'
import { clubIdOfEvent, createEvent, deleteEvent, updateEvent } from '@/server/events'
import { addGalleryImage, deleteGalleryImage } from '@/server/gallery'
import { createInvite, revokeInvite } from '@/server/invites'
import { removeMember } from '@/server/memberships'
import { createPost, deletePost, updatePost } from '@/server/posts'
import { getCurrentUser } from '@/server/session'
import { imageFromForm, storeImage } from '@/server/uploads'

function refresh(slug: string) {
  revalidatePath(`/clubs/${slug}`)
  revalidatePath(`/manage/${slug}`, 'layout')
  revalidatePath('/')
  revalidatePath('/events')
  revalidatePath('/feed')
}

export async function updateProfileAction(
  clubId: string,
  slug: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clubProfileSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)

  const user = await getCurrentUser()
  // Check access before storing uploads so strangers can't fill the bucket.
  const access = await requireClubManager(user, clubId)
  if (!access.ok) return fromResult(access, '')

  const logo = await imageFromForm(formData, 'logo', 'clubs')
  if (!logo.ok) return fromResult(logo, '')
  const cover = await imageFromForm(formData, 'cover', 'clubs')
  if (!cover.ok) return fromResult(cover, '')

  const result = await updateClubProfile(user, clubId, {
    ...parsed.data,
    logoUrl: logo.value,
    coverUrl: cover.value,
  })
  refresh(slug)
  return fromResult(result, 'Club profile saved.')
}

export async function createPostAction(
  clubId: string,
  slug: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = postSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)
  const result = await createPost(await getCurrentUser(), clubId, parsed.data)
  refresh(slug)
  return fromResult(result, 'Post published.')
}

export async function updatePostAction(
  postId: string,
  slug: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = postSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)
  const result = await updatePost(await getCurrentUser(), postId, parsed.data)
  refresh(slug)
  return fromResult(result, 'Post updated.')
}

export async function deletePostAction(postId: string, slug: string): Promise<ActionState> {
  const result = await deletePost(await getCurrentUser(), postId)
  refresh(slug)
  return fromResult(result, 'Post deleted.')
}

export async function saveEventAction(
  target: { clubId: string } | { eventId: string },
  slug: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = eventSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)

  const user = await getCurrentUser()
  // Check access before storing the upload so strangers can't fill the bucket.
  const clubId = 'clubId' in target ? target.clubId : await clubIdOfEvent(target.eventId)
  if (!clubId) return { ok: false, message: 'Event not found.', at: Date.now() }
  const access = await requireClubManager(user, clubId)
  if (!access.ok) return fromResult(access, '')

  const cover = await imageFromForm(formData, 'cover', 'events')
  if (!cover.ok) return fromResult(cover, '')
  const input = { ...parsed.data, coverUrl: cover.value }

  const result =
    'eventId' in target
      ? await updateEvent(user, target.eventId, input)
      : await createEvent(user, target.clubId, input)
  refresh(slug)
  return fromResult(result, 'eventId' in target ? 'Event updated.' : 'Event added.')
}

export async function deleteEventAction(eventId: string, slug: string): Promise<ActionState> {
  const result = await deleteEvent(await getCurrentUser(), eventId)
  refresh(slug)
  return fromResult(result, 'Event deleted.')
}

export async function uploadPhotoAction(
  clubId: string,
  slug: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser()
  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: 'Choose a photo to upload.',
      fieldErrors: { photo: ['Choose a photo.'] },
      at: Date.now(),
    }
  }
  const parsed = galleryCaptionSchema.safeParse(formValues(formData))
  if (!parsed.success) return invalid(parsed.error)
  // Check access before storing the file so strangers can't fill the bucket.
  const access = await requireClubManager(user, clubId)
  if (!access.ok) return fromResult(access, '')

  const stored = await storeImage(file, 'gallery')
  if (!stored.ok) return fromResult(stored, '')

  const result = await addGalleryImage(user, clubId, {
    url: stored.value,
    caption: parsed.data.caption,
  })
  refresh(slug)
  return fromResult(result, 'Photo added.')
}

export async function deletePhotoAction(imageId: string, slug: string): Promise<ActionState> {
  const result = await deleteGalleryImage(await getCurrentUser(), imageId)
  refresh(slug)
  return fromResult(result, 'Photo removed.')
}

export async function removeMemberAction(
  clubId: string,
  userId: string,
  slug: string,
): Promise<ActionState> {
  const result = await removeMember(await getCurrentUser(), clubId, userId)
  refresh(slug)
  return fromResult(result, 'Member removed.')
}

export async function createInviteAction(
  clubId: string,
  slug: string,
): Promise<NonNullable<ActionState> & { code?: string }> {
  const result = await createInvite(await getCurrentUser(), clubId)
  revalidatePath(`/manage/${slug}/invites`)
  if (!result.ok) return { ok: false, message: result.error.message, at: Date.now() }
  return { ok: true, message: 'Invite created.', code: result.value.code, at: Date.now() }
}

export async function revokeInviteAction(inviteId: string, slug: string): Promise<ActionState> {
  const result = await revokeInvite(await getCurrentUser(), inviteId)
  revalidatePath(`/manage/${slug}/invites`)
  return fromResult(result, 'Invite revoked.')
}
