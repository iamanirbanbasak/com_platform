import Link from 'next/link'

import { ClubPatch } from '@/components/club-patch'
import { plural } from '@/lib/utils'

type ClubCardProps = {
  club: {
    slug: string
    name: string
    description: string
    category: string
    logoUrl: string | null
    _count: { memberships: number; follows: number }
  }
}

export function ClubCard({ club }: ClubCardProps) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex gap-4 rounded-2xl p-3 -m-3 hover:bg-surface"
    >
      <ClubPatch name={club.name} logoUrl={club.logoUrl} size="md" />
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold group-hover:underline">{club.name}</h3>
        <p className="text-sm text-slate">
          {club.category}, {plural(club._count.memberships, 'member')},{' '}
          {plural(club._count.follows, 'follower')}
        </p>
        {club.description ? <p className="mt-1 line-clamp-2 text-sm">{club.description}</p> : null}
      </div>
    </Link>
  )
}
