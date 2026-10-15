import type { Metadata } from 'next'
import Link from 'next/link'

import { ClubCard } from '@/components/club-card'
import { Input } from '@/components/ui/field'
import { Container, EmptyState, PageHeader } from '@/components/ui/misc'
import { cn } from '@/lib/utils'
import { listCategoriesInUse, listClubs } from '@/server/clubs'

export const metadata: Metadata = { title: 'Clubs' }

export default async function ClubsPage({ searchParams }: PageProps<'/clubs'>) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const [clubs, categories] = await Promise.all([
    listClubs({ query: query || undefined, category: category || undefined }),
    listCategoriesInUse(),
  ])

  const categoryHref = (value: string) => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (value) next.set('category', value)
    const qs = next.toString()
    return qs ? `/clubs?${qs}` : '/clubs'
  }

  return (
    <Container>
      <PageHeader title="Clubs" description="Every active club, in one place." />
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form className="flex max-w-sm flex-1 gap-2">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="club-search" className="sr-only">
            Search clubs
          </label>
          <Input
            id="club-search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or topic"
          />
          <button
            type="submit"
            className="rounded-lg border border-line bg-surface px-4 text-sm font-semibold"
          >
            Search
          </button>
        </form>
        {categories.length > 1 ? (
          <nav aria-label="Filter by category" className="flex flex-wrap gap-1.5">
            {['', ...categories].map((value) => (
              <Link
                key={value || 'all'}
                href={categoryHref(value)}
                aria-current={category === value ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm',
                  category === value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-slate hover:text-ink',
                )}
              >
                {value || 'All'}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      {clubs.length === 0 ? (
        <EmptyState title={query || category ? 'No clubs match' : 'No clubs yet'}>
          {query || category ? (
            <Link href="/clubs" className="text-cobalt hover:underline">
              Clear the filters
            </Link>
          ) : (
            'Clubs appear here once the admin creates them.'
          )}
        </EmptyState>
      ) : (
        <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {clubs.map((club) => (
            <li key={club.id}>
              <ClubCard club={club} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
