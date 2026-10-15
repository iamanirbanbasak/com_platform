import { ButtonLink } from '@/components/ui/button'
import { getAdminStats } from '@/server/users'
import { getCurrentUser } from '@/server/session'

export default async function AdminOverviewPage() {
  const stats = await getAdminStats(await getCurrentUser())
  if (!stats.ok) return null
  const items = [
    { label: 'Users', value: stats.value.users },
    { label: 'Active clubs', value: stats.value.clubs },
    { label: 'Official memberships', value: stats.value.memberships },
    { label: 'Follows', value: stats.value.follows },
    { label: 'Posts', value: stats.value.posts },
    { label: 'Events', value: stats.value.events },
    { label: 'Open invites', value: stats.value.activeInvites },
  ]
  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
        {items.map((item) => (
          <div key={item.label} className="bg-surface p-4">
            <dt className="text-sm text-slate">{item.label}</dt>
            <dd className="font-display text-3xl font-extrabold">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/clubs">Create a club</ButtonLink>
        <ButtonLink href="/admin/users" variant="secondary">
          Manage users
        </ButtonLink>
      </div>
    </div>
  )
}
