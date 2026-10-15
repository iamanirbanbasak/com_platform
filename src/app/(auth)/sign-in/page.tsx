import type { Metadata } from 'next'
import Link from 'next/link'

import { SignInForm } from '@/components/auth-forms'
import { isGoogleEnabled } from '@/lib/env'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const { next, reset } = await searchParams
  const nextPath = typeof next === 'string' ? next : undefined
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Sign in</h1>
      <p className="mt-1 mb-6 text-slate">
        {reset ? 'Password updated. Sign in with your new password.' : 'Welcome back.'}
      </p>
      <SignInForm next={nextPath} googleEnabled={isGoogleEnabled} />
      <p className="mt-6 text-sm text-slate">
        New here?{' '}
        <Link
          href={nextPath ? `/sign-up?next=${encodeURIComponent(nextPath)}` : '/sign-up'}
          className="font-semibold text-cobalt hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  )
}
