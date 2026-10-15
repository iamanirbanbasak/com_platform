'use server'

import { revalidatePath } from 'next/cache'

import { followClub, unfollowClub } from '@/server/follows'
import { leaveClub } from '@/server/memberships'
import type { Result } from '@/server/result'
import { getCurrentUser } from '@/server/session'

async function run(action: () => Promise<Result<null>>, slug: string): Promise<{ error?: string }> {
  const result = await action()
  revalidatePath(`/clubs/${slug}`)
  revalidatePath('/feed')
  return result.ok ? {} : { error: result.error.message }
}

export async function followAction(clubId: string, slug: string) {
  const user = await getCurrentUser()
  return run(() => followClub(user, clubId), slug)
}

export async function unfollowAction(clubId: string, slug: string) {
  const user = await getCurrentUser()
  return run(() => unfollowClub(user, clubId), slug)
}

export async function leaveClubAction(clubId: string, slug: string) {
  const user = await getCurrentUser()
  return run(() => leaveClub(user, clubId), slug)
}
