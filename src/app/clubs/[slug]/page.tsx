import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ClubPatch, clubTint } from '@/components/club-patch'
import { EventTicket } from '@/components/event-ticket'
import { FollowButton } from '@/components/follow-button'
import { LeaveClubButton } from '@/components/leave-club-button'
import { PostCard } from '@/components/post-card'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Container, EmptyState } from '@/components/ui/misc'
import { formatDate } from '@/lib/dates'
import { cn, initials } from '@/lib/utils'
import { canManageClub } from '@/server/access'
import { getClubBySlug } from '@/server/clubs'
import { listClubEvents } from '@/server/events'
import { isFollowing } from '@/server/follows'
import { listGallery } from '@/server/gallery'
import { isMember, listMembers } from '@/server/memberships'
import { listClubPosts } from '@/server/posts'
import { getCurrentUser } from '@/server/session'

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
  { id: 'gallery', label: 'Gallery' },
] as const
type Tab = (typeof TABS)[number]['id']

export async function generateMetadata({ params }: PageProps<'/clubs/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const club = await getClubBySlug(slug, await getCurrentUser())
  return club ? { title: club.name, description: club.description.slice(0, 160) } : {}
}

export default async function ClubPage({ params, searchParams }: PageProps<'/clubs/[slug]'>) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getCurrentUser()])
  const club = await getClubBySlug(slug, user)
  if (!club) notFound()

  const tab: Tab = TABS.some((t) => t.id === query.tab) ? (query.tab as Tab) : 'posts'
  const [following, member] = user
    ? await Promise.all([isFollowing(user.id, club.id), isMember(user.id, club.id)])
    : [false, false]
  const manager = canManageClub(user, club)

  return (
    <Container>
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="relative h-36 sm:h-52" style={{ background: clubTint(club.name) }}>
          {club.coverUrl ? (
            <Image
              src={club.coverUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
          <ClubPatch
            name={club.name}
            logoUrl={club.logoUrl}
            size="xl"
            className="-mt-14 ring-4 ring-surface"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{club.name}</h1>
              {club.status === 'ARCHIVED' ? <Badge tone="danger">Archived</Badge> : null}
              {member ? <Badge tone="ok">Official member</Badge> : null}
            </div>
            <p className="mt-1 text-slate">
              {club.category}, {club._count.memberships} members, {club._count.follows} followers
              {club.president ? `. President: ${club.president.name}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {manager ? (
              <ButtonLink href={`/manage/${club.slug}`} variant="secondary">
                Manage club
              </ButtonLink>
            ) : null}
            {member ? <LeaveClubButton clubId={club.id} slug={club.slug} /> : null}
            <FollowButton
              clubId={club.id}
              slug={club.slug}
              following={following}
              signedIn={Boolean(user)}
            />
          </div>
        </div>
        {club.description ? (
          <p className="max-w-3xl px-5 pb-6 whitespace-pre-line sm:px-8">{club.description}</p>
        ) : null}
      </section>

      <nav aria-label="Club sections" className="mt-8 mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === 'posts' ? `/clubs/${club.slug}` : `/clubs/${club.slug}?tab=${t.id}`}
            aria-current={tab === t.id ? 'page' : undefined}
            scroll={false}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold',
              tab === t.id ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'posts' ? <PostsTab club={club} viewer={user} member={member} /> : null}
      {tab === 'events' ? <EventsTab clubId={club.id} clubName={club.name} /> : null}
      {tab === 'members' ? <MembersTab clubId={club.id} presidentId={club.presidentId} /> : null}
      {tab === 'gallery' ? <GalleryTab clubId={club.id} /> : null}
    </Container>
  )
}

async function PostsTab({
  club,
  viewer,
  member,
}: {
  club: { id: string; presidentId: string | null }
  viewer: Awaited<ReturnType<typeof getCurrentUser>>
  member: boolean
}) {
  const posts = await listClubPosts(club, viewer)
  if (posts.length === 0) {
    return <EmptyState title="No posts yet">Announcements from the club show up here.</EmptyState>
  }
  return (
    <div className="max-w-3xl space-y-4">
      {!member && !viewer ? (
        <p className="text-sm text-slate">Some posts are visible to official members only.</p>
      ) : null}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

async function EventsTab({ clubId, clubName }: { clubId: string; clubName: string }) {
  const { upcoming, past } = await listClubEvents(clubId)
  if (upcoming.length === 0 && past.length === 0) {
    return <EmptyState title="No events yet">This club has not scheduled anything.</EmptyState>
  }
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-slate">Nothing scheduled right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((event) => (
              <EventTicket key={event.id} event={event} tintName={clubName} />
            ))}
          </div>
        )}
      </section>
      {past.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-slate">Past</h2>
          <div className="grid gap-4 opacity-75 md:grid-cols-2">
            {past.map((event) => (
              <EventTicket key={event.id} event={event} tintName={clubName} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

async function MembersTab({ clubId, presidentId }: { clubId: string; presidentId: string | null }) {
  const members = await listMembers(clubId)
  if (members.length === 0) {
    return (
      <EmptyState title="No official members yet">
        The president invites members with a personal invite code.
      </EmptyState>
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map(({ user, joinedAt }) => (
        <li
          key={user.id}
          className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper">
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {user.name}
              {user.id === presidentId ? (
                <Badge tone="cobalt" className="ml-2 align-middle">
                  President
                </Badge>
              ) : null}
            </span>
            <span className="text-sm text-slate">Joined {formatDate(joinedAt)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

async function GalleryTab({ clubId }: { clubId: string }) {
  const images = await listGallery(clubId)
  if (images.length === 0) {
    return <EmptyState title="No photos yet">Photos from club activities appear here.</EmptyState>
  }
  return (
    <ul className="columns-2 gap-3 md:columns-3">
      {images.map((image) => (
        <li key={image.id} className="mb-3 break-inside-avoid">
          <figure className="overflow-hidden rounded-xl border border-line bg-surface">
            <Image
              src={image.url}
              alt={image.caption || 'Club photo'}
              width={600}
              height={450}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="h-auto w-full"
            />
            {image.caption ? (
              <figcaption className="px-3 py-2 text-sm text-slate">{image.caption}</figcaption>
            ) : null}
          </figure>
        </li>
      ))}
    </ul>
  )
}
