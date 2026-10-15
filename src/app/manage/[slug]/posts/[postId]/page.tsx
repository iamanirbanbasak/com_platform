import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ActionForm } from '@/components/action-form'
import { PostFormFields } from '@/components/post-form'
import { getPostForEdit } from '@/server/posts'

import { updatePostAction } from '../../actions'
import { loadManagedClub } from '../../load-club'

export default async function EditPostPage({ params }: PageProps<'/manage/[slug]/posts/[postId]'>) {
  const { slug, postId } = await params
  const { club, user } = await loadManagedClub(slug)
  const post = await getPostForEdit(user, postId)
  if (!post || post.clubId !== club.id) notFound()

  return (
    <div className="max-w-2xl">
      <Link href={`/manage/${club.slug}/posts`} className="text-sm text-slate hover:text-ink">
        Back to posts
      </Link>
      <h2 className="mt-2 mb-6 font-display text-xl font-bold">Edit post</h2>
      <ActionForm
        action={updatePostAction.bind(null, post.id, club.slug)}
        redirectTo={`/manage/${club.slug}/posts`}
      >
        <PostFormFields defaults={post} submitLabel="Save changes" />
      </ActionForm>
    </div>
  )
}
