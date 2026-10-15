import type { Metadata } from 'next'

import { PostCard } from '@/components/post-card'
import { ButtonLink } from '@/components/ui/button'
import { Container, EmptyState, PageHeader } from '@/components/ui/misc'
import { requirePageUser } from '@/lib/require-user'
import { getFeed } from '@/server/posts'

export const metadata: Metadata = { title: 'My feed' }

export default async function FeedPage() {
  const user = await requirePageUser('/feed')
  const posts = await getFeed(user)

  return (
    <Container className="max-w-3xl">
      <PageHeader
        title="My feed"
        description="Posts from clubs you follow or belong to, newest first."
      />
      {posts.length === 0 ? (
        <EmptyState title="Your feed is empty">
          Follow a few clubs and their posts will land here.
          <div className="mt-4">
            <ButtonLink href="/clubs" size="sm">
              Browse clubs
            </ButtonLink>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} club={post.club} />
          ))}
        </div>
      )}
    </Container>
  )
}
