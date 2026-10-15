import Image from 'next/image'
import Link from 'next/link'

import { ConfirmAction } from '@/components/confirm-action'
import { Badge, EmptyState } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'
import { listRecentEventsForAdmin } from '@/server/events'
import { listRecentImagesForAdmin } from '@/server/gallery'
import { listRecentPostsForAdmin } from '@/server/posts'
import { getCurrentUser } from '@/server/session'

import { adminDeleteEventAction, adminDeleteImageAction, adminDeletePostAction } from '../actions'

export default async function AdminContentPage() {
  const user = await getCurrentUser()
  const [posts, events, images] = await Promise.all([
    listRecentPostsForAdmin(user),
    listRecentEventsForAdmin(user),
    listRecentImagesForAdmin(user),
  ])

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Recent posts</h2>
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" />
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {posts.map((post) => (
              <li key={post.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {post.title}{' '}
                    {post.visibility === 'MEMBERS' ? (
                      <Badge tone="cobalt">Members only</Badge>
                    ) : null}
                  </p>
                  <p className="line-clamp-2 text-sm">{post.body}</p>
                  <p className="mt-1 text-sm text-slate">
                    <Link href={`/clubs/${post.club.slug}`} className="hover:underline">
                      {post.club.name}
                    </Link>
                    , {formatDateTime(post.createdAt)}
                    {post.author ? `, by ${post.author.name}` : ''}
                  </p>
                </div>
                <ConfirmAction
                  action={adminDeletePostAction.bind(null, post.id)}
                  label="Delete"
                  confirm={`Delete "${post.title}"?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Recent events</h2>
        {events.length === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-slate">
                    <Link href={`/clubs/${event.club.slug}?tab=events`} className="hover:underline">
                      {event.club.name}
                    </Link>
                    , {formatDateTime(event.startsAt)}
                  </p>
                </div>
                <ConfirmAction
                  action={adminDeleteEventAction.bind(null, event.id)}
                  label="Delete"
                  confirm={`Delete "${event.title}"?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Recent photos</h2>
        {images.length === 0 ? (
          <EmptyState title="No photos yet" />
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {images.map((image) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-xl border border-line bg-surface"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt={image.caption || 'Club photo'}
                    fill
                    sizes="16vw"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs text-slate">{image.club.name}</p>
                  <ConfirmAction
                    action={adminDeleteImageAction.bind(null, image.id)}
                    label="Remove"
                    confirm="Remove this photo?"
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
