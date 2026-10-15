import { ButtonLink } from '@/components/ui/button'
import { db } from '@/lib/db'

import { loadManagedClub } from './load-club'

export default async function ManageOverviewPage({ params }: PageProps<'/manage/[slug]'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)
  const now = new Date()
  const [members, followers, posts, upcoming, activeInvites] = await Promise.all([
    db.membership.count({ where: { clubId: club.id } }),
    db.follow.count({ where: { clubId: club.id } }),
    db.post.count({ where: { clubId: club.id } }),
    db.event.count({ where: { clubId: club.id, startsAt: { gte: now } } }),
    db.invite.count({
      where: { clubId: club.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
    }),
  ])

  const stats = [
    { label: 'Official members', value: members },
    { label: 'Followers', value: followers },
    { label: 'Posts', value: posts },
    { label: 'Upcoming events', value: upcoming },
    { label: 'Open invites', value: activeInvites },
  ]

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface p-4">
            <dt className="text-sm text-slate">{stat.label}</dt>
            <dd className="font-display text-3xl font-extrabold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/manage/${club.slug}/invites`}>Invite a member</ButtonLink>
        <ButtonLink href={`/manage/${club.slug}/posts`} variant="secondary">
          Write a post
        </ButtonLink>
        <ButtonLink href={`/manage/${club.slug}/events`} variant="secondary">
          Add an event
        </ButtonLink>
      </div>
    </div>
  )
}
