import { redirect } from 'next/navigation'

import { requirePageUser } from '@/lib/require-user'
import { listClubsPresidedBy } from '@/server/clubs'

export default async function ManageIndexPage() {
  const user = await requirePageUser('/manage')
  const clubs = await listClubsPresidedBy(user.id)
  redirect(clubs.length === 1 ? `/manage/${clubs[0].slug}` : '/me')
}
