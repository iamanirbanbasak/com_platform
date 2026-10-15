import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth-forms'

export const metadata: Metadata = { title: 'Reset password' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Reset your password</h1>
      <p className="mt-1 mb-6 text-slate">We will email you a link to choose a new one.</p>
      <ForgotPasswordForm />
    </>
  )
}
