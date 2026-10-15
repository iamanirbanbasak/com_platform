import Link from 'next/link'

import { ActionForm } from '@/components/action-form'
import { ConfirmAction } from '@/components/confirm-action'
import { PostFormFields } from '@/components/post-form'
import { Badge, EmptyState } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'
import { listClubPosts } from '@/server/posts'

import { createPostAction, deletePostAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ManagePostsPage({ params }: PageProps<'/manage/[slug]/posts'>) {
  const { slug } = await params
  const { club, user } = await loadManagedClub(slug)
  const posts = await listClubPosts(club, user)

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Write a post</h2>
        <ActionForm action={createPostAction.bind(null, club.id, club.slug)} resetOnSuccess>
          <PostFormFields submitLabel="Publish post" />
        </ActionForm>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Published</h2>
        {posts.length === 0 ? (
          <EmptyState title="No posts yet">Your first announcement will show up here.</EmptyState>
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
                  <p className="text-sm text-slate">{formatDateTime(post.createdAt)}</p>
                </div>
                <Link
                  href={`/manage/${club.slug}/posts/${post.id}`}
                  className="text-sm font-semibold text-cobalt hover:underline"
                >
                  Edit
                </Link>
                <ConfirmAction
                  action={deletePostAction.bind(null, post.id, club.slug)}
                  label="Delete"
                  confirm={`Delete "${post.title}"? This cannot be undone.`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
