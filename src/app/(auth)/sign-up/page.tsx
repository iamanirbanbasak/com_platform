import type { Metadata } from 'next'
import Link from 'next/link'

import { SignUpForm } from '@/components/auth-forms'
import { isGoogleEnabled } from '@/lib/env'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignUpPage({ searchParams }: PageProps<'/sign-up'>) {
  const { next } = await searchParams
  const nextPath = typeof next === 'string' ? next : undefined
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Create your account</h1>
      <p className="mt-1 mb-6 text-slate">Follow clubs and get their news in one feed.</p>
      <SignUpForm next={nextPath} googleEnabled={isGoogleEnabled} />
      <p className="mt-6 text-sm text-slate">
        Already have an account?{' '}
        <Link
          href={nextPath ? `/sign-in?next=${encodeURIComponent(nextPath)}` : '/sign-in'}
          className="font-semibold text-cobalt hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
