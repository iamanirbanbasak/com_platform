import Link from 'next/link'

import { NavLink } from '@/components/nav-link'
import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'
import { UserMenu } from '@/components/user-menu'
import { SITE_NAME } from '@/lib/site'
import { listClubsPresidedBy } from '@/server/clubs'
import { getCurrentUser } from '@/server/session'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const presided = user ? await listClubsPresidedBy(user.id) : []

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink href="/clubs">Clubs</NavLink>
          <NavLink href="/events">Events</NavLink>
          {user ? <NavLink href="/feed">My feed</NavLink> : null}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              isAdmin={user.role === 'admin'}
              managedClubs={presided.map((club) => ({ name: club.name, slug: club.slug }))}
            />
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" size="sm">
                Create account
              </ButtonLink>
            </>
          )}
        </div>
      </Container>
      <nav className="flex gap-1 border-t border-line px-4 py-1.5 sm:hidden">
        <NavLink href="/clubs">Clubs</NavLink>
        <NavLink href="/events">Events</NavLink>
        {user ? <NavLink href="/feed">My feed</NavLink> : null}
      </nav>
    </header>
  )
}
