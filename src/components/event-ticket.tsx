import Link from 'next/link'

import { ClubPatch, clubTint } from '@/components/club-patch'
import { formatDate, formatDay, formatMonth, formatTime, formatWeekday } from '@/lib/dates'
import { cn } from '@/lib/utils'

type EventTicketProps = {
  event: {
    id: string
    title: string
    startsAt: Date
    endsAt: Date | null
    venue: string
    description?: string
  }
  club?: { name: string; slug: string; logoUrl: string | null }
  tintName: string
  className?: string
}

/** An event as a tear-off ticket: the date stub carries the club's colour. */
export function EventTicket({ event, club, tintName, className }: EventTicketProps) {
  const sameDay = event.endsAt && formatDate(event.endsAt) === formatDate(event.startsAt)
  return (
    <article
      id={`event-${event.id}`}
      className={cn('flex overflow-hidden rounded-2xl border border-line bg-surface', className)}
    >
      <div
        className="flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-paper py-4 text-white"
        style={{ background: clubTint(tintName) }}
      >
        <span className="text-sm font-semibold">{formatMonth(event.startsAt)}</span>
        <span className="font-display text-3xl leading-none font-extrabold">
          {formatDay(event.startsAt)}
        </span>
        <span className="text-xs opacity-90">{formatWeekday(event.startsAt)}</span>
      </div>
      <div className="min-w-0 flex-1 p-4">
        <h3 className="font-display text-lg font-bold">{event.title}</h3>
        <p className="mt-0.5 text-sm text-slate">
          {formatTime(event.startsAt)}
          {event.endsAt
            ? ` to ${sameDay ? formatTime(event.endsAt) : `${formatDate(event.endsAt)}, ${formatTime(event.endsAt)}`}`
            : ''}
          {event.venue ? `, ${event.venue}` : ''}
        </p>
        {event.description ? (
          <p className="mt-2 line-clamp-2 text-sm">{event.description}</p>
        ) : null}
        {club ? (
          <Link
            href={`/clubs/${club.slug}?tab=events`}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            <ClubPatch
              name={club.name}
              logoUrl={club.logoUrl}
              size="sm"
              className="size-6 rounded-md text-[10px]"
            />
            {club.name}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
