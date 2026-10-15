import type { Metadata } from 'next'
import Link from 'next/link'

import { EventTicket } from '@/components/event-ticket'
import { PostCard } from '@/components/post-card'
import { ButtonLink } from '@/components/ui/button'
import { Container, EmptyState, PageHeader } from '@/components/ui/misc'
import { requirePageUser } from '@/lib/require-user'
import { listFeedEvents } from '@/server/events'
import { getFeed } from '@/server/posts'

export const metadata: Metadata = { title: 'My feed' }

export default async function FeedPage() {
  const user = await requirePageUser('/feed')
  const [posts, events] = await Promise.all([getFeed(user), listFeedEvents(user)])

  if (posts.length === 0 && events.length === 0) {
    return (
      <Container className="max-w-3xl">
        <PageHeader title="My feed" />
        <EmptyState title="Your feed is empty">
          Follow a few clubs and their posts and events will land here.
          <div className="mt-4">
            <ButtonLink href="/clubs" size="sm">
              Browse clubs
            </ButtonLink>
          </div>
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container>
      <PageHeader
        title="My feed"
        description="News and events from clubs you follow or belong to."
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="feed-posts" className="min-w-0 space-y-4">
          <h2 id="feed-posts" className="sr-only">
            Posts
          </h2>
          {posts.length === 0 ? (
            <EmptyState title="No posts yet">Your clubs have not posted anything.</EmptyState>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} club={post.club} />)
          )}
        </section>
        <aside aria-labelledby="feed-events">
          <h2 id="feed-events" className="mb-4 font-display text-xl font-bold">
            Coming up from your clubs
          </h2>
          {events.length === 0 ? (
            <p className="text-slate">
              Nothing scheduled.{' '}
              <Link href="/events" className="text-cobalt hover:underline">
                See all events
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
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
        </aside>
      </div>
    </Container>
  )
}
