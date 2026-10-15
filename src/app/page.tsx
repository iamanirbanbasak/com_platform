import Link from 'next/link'

import { ClubPatch } from '@/components/club-patch'
import { EventTicket } from '@/components/event-ticket'
import { ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { Container, EmptyState } from '@/components/ui/misc'
import { listClubs } from '@/server/clubs'
import { listUpcomingEvents } from '@/server/events'
import { getCurrentUser } from '@/server/session'

export default async function HomePage() {
  const [clubs, events, user] = await Promise.all([
    listClubs(),
    listUpcomingEvents(4),
    getCurrentUser(),
  ])

  return (
    <Container className="space-y-16">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-5xl font-extrabold sm:text-6xl lg:text-7xl">
            Find your people.
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate">
            Browse every club, follow the ones you like, and see what they are planning. Got an
            invite from a club president? Use it to join as an official member.
          </p>
          <form action="/clubs" className="mt-8 flex max-w-md gap-2">
            <label htmlFor="hero-search" className="sr-only">
              Search clubs
            </label>
            <Input id="hero-search" name="q" placeholder="Search clubs" className="h-12" />
            <button
              type="submit"
              className="h-12 rounded-lg bg-cobalt px-5 font-semibold text-cobalt-ink"
            >
              Search
            </button>
          </form>
          {!user ? (
            <p className="mt-4 text-sm text-slate">
              <Link href="/sign-up" className="font-semibold text-cobalt hover:underline">
                Create an account
              </Link>{' '}
              to follow clubs.
            </p>
          ) : null}
        </div>

        {clubs.length > 0 ? (
          <ul className="grid grid-cols-4 gap-3 sm:gap-4" aria-label="Clubs">
            {clubs.slice(0, 12).map((club, index) => (
              <li key={club.id} className={index % 2 === 1 ? 'translate-y-4' : undefined}>
                <Link
                  href={`/clubs/${club.slug}`}
                  title={club.name}
                  className="block transition-transform hover:-rotate-3"
                >
                  <ClubPatch
                    name={club.name}
                    logoUrl={club.logoUrl}
                    size="lg"
                    className="w-full h-auto aspect-square"
                  />
                  <span className="sr-only">{club.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold">Coming up</h2>
          <Link href="/events" className="text-sm font-semibold text-cobalt hover:underline">
            All events
          </Link>
        </div>
        {events.length === 0 ? (
          <EmptyState title="No upcoming events">
            When clubs schedule something, it shows up here.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <EventTicket
                key={event.id}
                event={event}
                club={event.club}
                tintName={event.club.name}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold">Clubs</h2>
          <Link href="/clubs" className="text-sm font-semibold text-cobalt hover:underline">
            Browse all {clubs.length}
          </Link>
        </div>
        {clubs.length === 0 ? (
          <EmptyState title="No clubs yet">
            The admin adds clubs and appoints their presidents.
            {user?.role === 'admin' ? (
              <ButtonLink href="/admin/clubs" size="sm" className="mt-4">
                Add the first club
              </ButtonLink>
            ) : null}
          </EmptyState>
        ) : (
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.slice(0, 6).map((club) => (
              <li key={club.id}>
                <Link href={`/clubs/${club.slug}`} className="group flex items-center gap-3">
                  <ClubPatch name={club.name} logoUrl={club.logoUrl} size="md" />
                  <span>
                    <span className="block font-display text-lg font-bold group-hover:underline">
                      {club.name}
                    </span>
                    <span className="text-sm text-slate">{club.category}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  )
}
