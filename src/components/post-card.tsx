import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import { ClubPatch } from '@/components/club-patch'
import { Badge } from '@/components/ui/misc'
import { formatDateTime } from '@/lib/dates'

type PostCardProps = {
  post: {
    id: string
    title: string
    body: string
    visibility: 'PUBLIC' | 'MEMBERS'
    createdAt: Date
    author: { name: string } | null
  }
  club?: { name: string; slug: string; logoUrl: string | null }
}

export function PostCard({ post, club }: PostCardProps) {
  return (
    <article
      id={`post-${post.id}`}
      className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
        {club ? (
          <Link
            href={`/clubs/${club.slug}`}
            className="inline-flex items-center gap-2 font-semibold text-ink hover:underline"
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
        <time dateTime={post.createdAt.toISOString()}>{formatDateTime(post.createdAt)}</time>
        {post.author ? <span>by {post.author.name}</span> : null}
        {post.visibility === 'MEMBERS' ? <Badge tone="cobalt">Members only</Badge> : null}
      </header>
      <h3 className="mt-2 font-display text-xl font-bold">{post.title}</h3>
      <div className="prose-club mt-3">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </article>
  )
}
