import Link from 'next/link'

import { ActionForm } from '@/components/action-form'
import { ConfirmAction } from '@/components/confirm-action'
import { EventFormFields } from '@/components/event-form'
import { EmptyState } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'
import { listClubEvents } from '@/server/events'

import { deleteEventAction, saveEventAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ManageEventsPage({ params }: PageProps<'/manage/[slug]/events'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)
  const { upcoming, past } = await listClubEvents(club.id)
  const events = [...upcoming, ...past]

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Add an event</h2>
        <ActionForm
          action={saveEventAction.bind(null, { clubId: club.id }, club.slug)}
          resetOnSuccess
        >
          <EventFormFields submitLabel="Add event" />
        </ActionForm>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Scheduled</h2>
        {events.length === 0 ? (
          <EmptyState title="No events yet">
            Add one and it appears on the club page and the events calendar.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-slate">
                    {formatDateTime(event.startsAt)}
                    {event.venue ? `, ${event.venue}` : ''}
                  </p>
                </div>
                <Link
                  href={`/manage/${club.slug}/events/${event.id}`}
                  className="text-sm font-semibold text-cobalt hover:underline"
                >
                  Edit
                </Link>
                <ConfirmAction
                  action={deleteEventAction.bind(null, event.id, club.slug)}
                  label="Delete"
                  confirm={`Delete "${event.title}"?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
