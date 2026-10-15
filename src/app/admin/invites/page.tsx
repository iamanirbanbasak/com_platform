import Link from 'next/link'

import { ConfirmAction } from '@/components/confirm-action'
import { InviteStatusBadge } from '@/components/invite-status'
import { EmptyState } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'
import { listAllInvites } from '@/server/invites'
import { getCurrentUser } from '@/server/session'

import { adminRevokeInviteAction } from '../actions'

export default async function AdminInvitesPage() {
  const invites = await listAllInvites(await getCurrentUser())
  if (!invites.ok) return null
  if (invites.value.length === 0) {
    return (
      <EmptyState title="No invites yet">
        Club presidents generate invites from their club dashboard.
      </EmptyState>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-slate">
          <tr>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Club</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Created by</th>
            <th className="px-4 py-3 font-semibold">Used by</th>
            <th className="px-4 py-3 font-semibold">Expires</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {invites.value.map((invite) => (
            <tr key={invite.id}>
              <td className="px-4 py-3 font-mono whitespace-nowrap">{invite.code}</td>
              <td className="px-4 py-3">
                <Link href={`/clubs/${invite.club.slug}`} className="hover:underline">
                  {invite.club.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <InviteStatusBadge status={invite.status} />
              </td>
              <td className="px-4 py-3 text-slate">{invite.createdBy?.name ?? 'Deleted user'}</td>
              <td className="px-4 py-3 text-slate">
                {invite.usedBy ? `${invite.usedBy.name} (${invite.usedBy.email})` : ''}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-slate">
                {formatDateTime(invite.expiresAt)}
              </td>
              <td className="px-4 py-3 text-right">
                {invite.status === 'ACTIVE' ? (
                  <ConfirmAction
                    action={adminRevokeInviteAction.bind(null, invite.id)}
                    label="Revoke"
                    confirm={`Revoke ${invite.code}?`}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
