import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'

import { getManagedClub } from '@/server/clubs'
import { getCurrentUser } from '@/server/session'

/** The club being managed plus the current user; 404s for anyone who can't manage it. */
export const loadManagedClub = cache(async (slug: string) => {
  const user = await getCurrentUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/manage/${slug}`)}`)
  const club = await getManagedClub(slug, user)
  if (!club) notFound()
  return { user, club }
})
