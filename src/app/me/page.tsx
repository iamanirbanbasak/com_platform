import type { Metadata } from 'next'
import Link from 'next/link'

import { ClubPatch } from '@/components/club-patch'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Container, EmptyState, PageHeader } from '@/components/ui/misc'
import { requirePageUser } from '@/lib/require-user'
import { formatDate } from '@/lib/dates'
import { listClubsPresidedBy } from '@/server/clubs'
import { listFollowedClubs } from '@/server/follows'
import { listMyMemberships } from '@/server/memberships'

export const metadata: Metadata = { title: 'My clubs' }

function ClubRow({
  club,
  meta,
  badge,
  href,
}: {
  club: { name: string; slug: string; logoUrl: string | null }
  meta?: string
  badge?: React.ReactNode
  href?: string
}) {
  return (
    <li>
      <Link
        href={href ?? `/clubs/${club.slug}`}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-slate"
      >
        <ClubPatch name={club.name} logoUrl={club.logoUrl} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{club.name}</span>
          {meta ? <span className="text-sm text-slate">{meta}</span> : null}
        </span>
        {badge}
      </Link>
    </li>
  )
}

export default async function MePage() {
  const user = await requirePageUser('/me')
  const [presided, memberships, follows] = await Promise.all([
    listClubsPresidedBy(user.id),
    listMyMemberships(user.id),
    listFollowedClubs(user.id),
  ])

  return (
    <Container className="max-w-3xl space-y-10">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <ButtonLink href="/join" variant="secondary">
            Enter an invite code
          </ButtonLink>
        }
      />

      {presided.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Clubs you run</h2>
          <ul className="space-y-2">
            {presided.map((club) => (
              <ClubRow
                key={club.id}
                club={club}
                href={`/manage/${club.slug}`}
                badge={<Badge tone="cobalt">President</Badge>}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Official memberships</h2>
        {memberships.length === 0 ? (
          <EmptyState title="Not a member of any club yet">
            Club presidents send personal invite codes. Enter yours on the{' '}
            <Link href="/join" className="text-cobalt hover:underline">
              join page
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {memberships.map((membership) => (
              <ClubRow
                key={membership.id}
                club={membership.club}
                meta={`Member since ${formatDate(membership.joinedAt)}`}
                badge={<Badge tone="ok">Member</Badge>}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Following</h2>
        {follows.length === 0 ? (
          <EmptyState title="You are not following any clubs">
            <Link href="/clubs" className="text-cobalt hover:underline">
              Browse clubs
            </Link>{' '}
            and follow the ones you want to hear from.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {follows.map((follow) => (
              <ClubRow key={follow.id} club={follow.club} />
            ))}
          </ul>
        )}
      </section>
    </Container>
  )
}
