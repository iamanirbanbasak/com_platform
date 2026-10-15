import { ConfirmAction } from '@/components/confirm-action'
import { InviteGenerator } from '@/components/invite-generator'
import { InviteStatusBadge } from '@/components/invite-status'
import { EmptyState } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'
import { env } from '@/lib/env'
import { listClubInvites } from '@/server/invites'

import { createInviteAction, revokeInviteAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ManageInvitesPage({ params }: PageProps<'/manage/[slug]/invites'>) {
  const { slug } = await params
  const { club, user } = await loadManagedClub(slug)
  const invites = await listClubInvites(user, club.id)

  return (
    <div className="space-y-10">
      {club.status === 'ACTIVE' ? (
        <InviteGenerator
          createInvite={createInviteAction.bind(null, club.id, club.slug)}
          baseUrl={env.appUrl}
        />
      ) : null}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Invite history</h2>
        {!invites.ok || invites.value.length === 0 ? (
          <EmptyState title="No invites yet">
            Invites you generate are listed here with their status.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-slate">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Used by / expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invites.value.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-4 py-3 font-mono whitespace-nowrap">{invite.code}</td>
                    <td className="px-4 py-3">
                      <InviteStatusBadge status={invite.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate">
                      {formatDateTime(invite.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {invite.usedBy
                        ? invite.usedBy.name
                        : invite.status === 'ACTIVE'
                          ? `Expires ${formatDateTime(invite.expiresAt)}`
                          : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invite.status === 'ACTIVE' ? (
                        <ConfirmAction
                          action={revokeInviteAction.bind(null, invite.id, club.slug)}
                          label="Revoke"
                          confirm={`Revoke invite ${invite.code}? It will stop working immediately.`}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
