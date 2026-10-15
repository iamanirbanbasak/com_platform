'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string
  children: ReactNode
  exact?: boolean
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium text-slate hover:text-ink',
        active && 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]',
      )}
    >
      {children}
    </Link>
  )
}
