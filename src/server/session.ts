import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { auth } from '@/lib/auth'
import type { Actor } from '@/server/actor'

export type CurrentUser = Actor & { name: string; email: string; image: string | null }

/** Reads the session once per request; banned users are treated as signed out. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.banned) return null

  return {
    id: session.user.id,
    role: session.user.role === 'admin' ? 'admin' : 'user',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  }
})
