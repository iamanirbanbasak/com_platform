import Link from 'next/link'

import { ConfirmAction } from '@/components/confirm-action'
import { EmptyState } from '@/components/ui/misc'
import { formatDate } from '@/lib/dates'
import { initials } from '@/lib/utils'
import { listMembers } from '@/server/memberships'

import { removeMemberAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ManageMembersPage({ params }: PageProps<'/manage/[slug]/members'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)
  const members = await listMembers(club.id)

  return (
    <section>
      <h2 className="mb-1 font-display text-xl font-bold">Official members</h2>
      <p className="mb-5 text-slate">
        {members.length} {members.length === 1 ? 'person has' : 'people have'} joined with an
        invite.
      </p>
      {members.length === 0 ? (
        <EmptyState title="No members yet">
          <Link href={`/manage/${club.slug}/invites`} className="text-cobalt hover:underline">
            Generate an invite
          </Link>{' '}
          and send it to your first member.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {members.map(({ user, joinedAt }) => (
            <li key={user.id} className="flex items-center gap-3 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-paper">
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="text-sm text-slate">Joined {formatDate(joinedAt)}</p>
              </div>
              <ConfirmAction
                action={removeMemberAction.bind(null, club.id, user.id, club.slug)}
                label="Remove"
                confirm={`Remove ${user.name} from ${club.name}? They will need a new invite to rejoin.`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
