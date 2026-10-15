import Link from 'next/link'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { PresidentEditor } from '@/components/admin-club-row'
import { ClubPatch } from '@/components/club-patch'
import { ConfirmAction } from '@/components/confirm-action'
import { ImageInput } from '@/components/image-input'
import { NameAndSlugFields } from '@/components/slug-field'
import { Field, Select, TextAreaField, TextField } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { CLUB_CATEGORIES } from '@/lib/validation'
import { listAllClubsForAdmin } from '@/server/clubs'
import { getCurrentUser } from '@/server/session'

import {
  assignPresidentAction,
  createClubAction,
  deleteClubAction,
  setClubStatusAction,
} from '../actions'

export default async function AdminClubsPage() {
  const clubs = await listAllClubsForAdmin(await getCurrentUser())
  if (!clubs.ok) return null

  return (
    <div className="grid gap-10 xl:grid-cols-[360px_1fr]">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Create a club</h2>
        <ActionForm action={createClubAction} resetOnSuccess>
          <NameAndSlugFields />
          <Field name="category" label="Category">
            {({ id }) => (
              <Select id={id} name="category" defaultValue="General">
                {CLUB_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            )}
          </Field>
          <TextAreaField name="description" label="Description" rows={3} />
          <TextField
            name="presidentEmail"
            label="President's email (optional)"
            type="email"
            hint="They need an account first. You can assign one later."
          />
          <ImageInput name="logo" label="Logo (optional)" />
          <SubmitButton>Create club</SubmitButton>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">All clubs</h2>
        {clubs.value.length === 0 ? (
          <EmptyState title="No clubs yet">Create the first one with the form.</EmptyState>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {clubs.value.map((club) => (
              <li key={club.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <ClubPatch name={club.name} logoUrl={club.logoUrl} size="sm" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold">
                    <Link href={`/clubs/${club.slug}`} className="hover:underline">
                      {club.name}
                    </Link>{' '}
                    {club.status === 'ARCHIVED' ? <Badge tone="danger">Archived</Badge> : null}
                  </p>
                  <p className="text-sm text-slate">
                    {club.category}, {club._count.memberships} members, {club._count.follows}{' '}
                    followers
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="text-slate">President:</span>
                    <span>
                      {club.president ? `${club.president.name} (${club.president.email})` : 'None'}
                    </span>
                    <PresidentEditor
                      action={assignPresidentAction.bind(null, club.id)}
                      currentEmail={club.president?.email ?? null}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/manage/${club.slug}`}
                    className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold text-cobalt hover:bg-cobalt-soft"
                  >
                    Manage
                  </Link>
                  <ConfirmAction
                    action={setClubStatusAction.bind(null, club.id, club.status === 'ACTIVE')}
                    label={club.status === 'ACTIVE' ? 'Archive' : 'Restore'}
                    variant="secondary"
                    confirm={
                      club.status === 'ACTIVE'
                        ? `Archive ${club.name}? It disappears from the site and invites stop working.`
                        : undefined
                    }
                  />
                  <ConfirmAction
                    action={deleteClubAction.bind(null, club.id)}
                    label="Delete"
                    confirm={`Permanently delete ${club.name} with all its posts, events, photos, members and invites?`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
