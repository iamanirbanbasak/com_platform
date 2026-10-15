import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { NavLink } from '@/components/nav-link'
import { Container } from '@/components/ui/misc'
import { requirePageUser } from '@/lib/require-user'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser('/admin')
  if (user.role !== 'admin') notFound()

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-4">
        <h1 className="font-display text-2xl font-extrabold">Admin console</h1>
        <nav aria-label="Admin" className="flex flex-wrap gap-1">
          <NavLink href="/admin" exact>
            Overview
          </NavLink>
          <NavLink href="/admin/clubs">Clubs</NavLink>
          <NavLink href="/admin/users">Users</NavLink>
          <NavLink href="/admin/invites">Invites</NavLink>
          <NavLink href="/admin/content">Content</NavLink>
        </nav>
      </div>
      {children}
    </Container>
  )
}
