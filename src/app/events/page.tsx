import type { Metadata } from 'next'

import { EventTicket } from '@/components/event-ticket'
import { Container, EmptyState, PageHeader } from '@/components/ui/misc'
import { formatMonthYear } from '@/lib/dates'
import { listUpcomingEvents } from '@/server/events'

export const metadata: Metadata = { title: 'Events' }

export default async function EventsPage() {
  const events = await listUpcomingEvents(100)

  const byMonth = new Map<string, typeof events>()
  for (const event of events) {
    const key = formatMonthYear(event.startsAt)
    byMonth.set(key, [...(byMonth.get(key) ?? []), event])
  }

  return (
    <Container>
      <PageHeader title="Events" description="What every club has planned, soonest first." />
      {events.length === 0 ? (
        <EmptyState title="Nothing scheduled yet">
          Club presidents add events from their club dashboard.
        </EmptyState>
      ) : (
        <div className="space-y-12">
          {[...byMonth.entries()].map(([month, monthEvents]) => (
            <section key={month}>
              <h2 className="mb-4 font-display text-xl font-bold">{month}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {monthEvents.map((event) => (
                  <EventTicket
                    key={event.id}
                    event={event}
                    club={event.club}
                    tintName={event.club.name}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Container>
  )
}
