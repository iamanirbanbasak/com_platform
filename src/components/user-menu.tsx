'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { initials } from '@/lib/utils'

type UserMenuProps = {
  name: string
  email: string
  isAdmin: boolean
  managedClubs: { name: string; slug: string }[]
}

export function UserMenu({ name, email, isAdmin, managedClubs }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !ref.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  async function signOut() {
    await authClient.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const item = 'block rounded-md px-3 py-2 text-sm hover:bg-paper'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-paper"
      >
        <span className="sr-only">Open account menu</span>
        {initials(name)}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
          onClick={() => setOpen(false)}
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-sm text-slate">{email}</p>
          </div>
          <hr className="my-1 border-line" />
          <Link role="menuitem" href="/feed" className={item}>
            My feed
          </Link>
          <Link role="menuitem" href="/me" className={item}>
            My clubs
          </Link>
          <Link role="menuitem" href="/join" className={item}>
            Enter an invite code
          </Link>
          {managedClubs.length > 0 ? (
            <>
              <hr className="my-1 border-line" />
              <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-slate">Clubs you run</p>
              {managedClubs.map((club) => (
                <Link
                  key={club.slug}
                  role="menuitem"
                  href={`/manage/${club.slug}`}
                  className={item}
                >
                  {club.name}
                </Link>
              ))}
            </>
          ) : null}
          {isAdmin ? (
            <>
              <hr className="my-1 border-line" />
              <Link role="menuitem" href="/admin" className={item}>
                Admin console
              </Link>
            </>
          ) : null}
          <hr className="my-1 border-line" />
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            className={`${item} w-full text-left`}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
