'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionState } from '@/lib/action-state'
import { normalizeInviteCode, redeemInvite } from '@/server/invites'
import { getCurrentUser } from '@/server/session'

/** From the manual-entry form: validate the format, then show the invite preview. */
export async function lookUpInviteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const code = normalizeInviteCode(String(formData.get('code') ?? ''))
  if (!code) {
    return {
      ok: false,
      message: 'Invite codes have 10 letters and numbers, like ABCD-EFGH-JK.',
      fieldErrors: { code: ['Enter the full 10-character code.'] },
      at: Date.now(),
    }
  }
  redirect(`/join/${code}`)
}

export async function acceptInviteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  const code = String(formData.get('code') ?? '')
  const result = await redeemInvite(user, code)
  if (!result.ok) return { ok: false, message: result.error.message, at: Date.now() }

  revalidatePath(`/clubs/${result.value.clubSlug}`)
  revalidatePath('/me')
  redirect(`/clubs/${result.value.clubSlug}?welcome=1`)
}
