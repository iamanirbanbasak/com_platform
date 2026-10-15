import 'server-only'

import { redirect } from 'next/navigation'

import { getCurrentUser, type CurrentUser } from '@/server/session'

/** For pages behind sign-in: the proxy redirects optimistically, this is the real check. */
export async function requirePageUser(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(path)}`)
  return user
}
