import type { Metadata } from 'next'
import Link from 'next/link'

import { ResetPasswordForm } from '@/components/auth-forms'

export const metadata: Metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token, error } = await searchParams
  if (typeof token !== 'string' || error) {
    return (
      <>
        <h1 className="font-display text-2xl font-extrabold">Link expired</h1>
        <p className="mt-2 text-slate">
          This reset link is invalid or has expired.{' '}
          <Link href="/forgot-password" className="font-semibold text-cobalt hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </>
    )
  }
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Choose a new password</h1>
      <p className="mt-1 mb-6 text-slate">You will be signed out everywhere else.</p>
      <ResetPasswordForm token={token} />
    </>
  )
}
