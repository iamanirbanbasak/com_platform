import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ActionForm } from '@/components/action-form'
import { EventFormFields } from '@/components/event-form'
import { getEventForEdit } from '@/server/events'

import { saveEventAction } from '../../actions'
import { loadManagedClub } from '../../load-club'

export default async function EditEventPage({
  params,
}: PageProps<'/manage/[slug]/events/[eventId]'>) {
  const { slug, eventId } = await params
  const { club, user } = await loadManagedClub(slug)
  const event = await getEventForEdit(user, eventId)
  if (!event || event.clubId !== club.id) notFound()

  return (
    <div className="max-w-2xl">
      <Link href={`/manage/${club.slug}/events`} className="text-sm text-slate hover:text-ink">
        Back to events
      </Link>
      <h2 className="mt-2 mb-6 font-display text-xl font-bold">Edit event</h2>
      <ActionForm
        action={saveEventAction.bind(null, { eventId: event.id }, club.slug)}
        redirectTo={`/manage/${club.slug}/events`}
      >
        <EventFormFields defaults={event} submitLabel="Save changes" />
      </ActionForm>
    </div>
  )
}
