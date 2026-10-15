import Link from 'next/link'

import { ClubPatch } from '@/components/club-patch'
import { NavLink } from '@/components/nav-link'
import { Badge, Container } from '@/components/ui/misc'

import { loadManagedClub } from './load-club'

export default async function ManageLayout({ children, params }: LayoutProps<'/manage/[slug]'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)
  const base = `/manage/${club.slug}`

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <ClubPatch name={club.name} logoUrl={club.logoUrl} size="md" />
        <div className="flex-1">
          <p className="text-sm text-slate">Managing</p>
          <h1 className="font-display text-2xl font-extrabold">
            {club.name} {club.status === 'ARCHIVED' ? <Badge tone="danger">Archived</Badge> : null}
          </h1>
        </div>
        <Link
          href={`/clubs/${club.slug}`}
          className="text-sm font-semibold text-cobalt hover:underline"
        >
          View public page
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Club management" className="flex gap-1 overflow-x-auto lg:flex-col">
          <NavLink href={base} exact>
            Overview
          </NavLink>
          <NavLink href={`${base}/invites`}>Invites</NavLink>
          <NavLink href={`${base}/members`}>Members</NavLink>
          <NavLink href={`${base}/posts`}>Posts</NavLink>
          <NavLink href={`${base}/events`}>Events</NavLink>
          <NavLink href={`${base}/gallery`}>Gallery</NavLink>
          <NavLink href={`${base}/profile`}>Club profile</NavLink>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  )
}
