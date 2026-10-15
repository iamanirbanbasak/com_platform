import Link from 'next/link'

import { Container } from '@/components/ui/misc'
import { SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 text-sm text-slate">
      <Container className="flex flex-wrap items-center justify-between gap-4">
        <p>{SITE_NAME}</p>
        <nav className="flex gap-5">
          <Link href="/clubs" className="hover:text-ink">
            Clubs
          </Link>
          <Link href="/events" className="hover:text-ink">
            Events
          </Link>
          <Link href="/join" className="hover:text-ink">
            Have an invite code?
          </Link>
        </nav>
      </Container>
    </footer>
  )
}
