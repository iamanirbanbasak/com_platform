import Link from 'next/link'

import { ConfirmAction } from '@/components/confirm-action'
import { Input } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { formatDate } from '@/lib/dates'
import { getCurrentUser } from '@/server/session'
import { listUsers } from '@/server/users'

import { deleteUserAction, setUserBannedAction } from '../actions'

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q.trim() : ''
  const me = await getCurrentUser()
  const users = await listUsers(me, query)
  if (!users.ok) return null

  return (
    <section>
      <form className="mb-6 flex max-w-md gap-2">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <Input
          id="user-search"
          name="q"
          defaultValue={query}
          placeholder="Search by name or email"
        />
        <button
          type="submit"
          className="rounded-lg border border-line bg-surface px-4 text-sm font-semibold"
        >
          Search
        </button>
      </form>
      {users.value.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-slate">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.value.map((user) => {
                const self = user.id === me?.id
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-slate">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.role === 'admin' ? <Badge tone="cobalt">Admin</Badge> : null}
                        {user.presidentOf.map((club) => (
                          <Link key={club.slug} href={`/clubs/${club.slug}`}>
                            <Badge tone="ok">President of {club.name}</Badge>
                          </Link>
                        ))}
                        {user.banned ? <Badge tone="danger">Banned</Badge> : null}
                        {!user.emailVerified ? <Badge>Unverified</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate">
                      {user._count.memberships} memberships, {user._count.follows} follows
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {self ? null : (
                        <div className="flex justify-end gap-2">
                          <ConfirmAction
                            action={setUserBannedAction.bind(null, user.id, !user.banned)}
                            label={user.banned ? 'Unban' : 'Ban'}
                            variant="secondary"
                            confirm={
                              user.banned
                                ? undefined
                                : `Ban ${user.name}? They will be signed out and blocked from signing in.`
                            }
                          />
                          <ConfirmAction
                            action={deleteUserAction.bind(null, user.id)}
                            label="Delete"
                            confirm={`Permanently delete ${user.name}'s account? Their memberships and follows are removed too.`}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
