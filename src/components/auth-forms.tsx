'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { authClient } from '@/lib/auth-client'
import { safeRedirect } from '@/lib/safe-redirect'

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
    </label>
  )
}

function Notice({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const styles = tone === 'error' ? 'bg-danger-soft text-danger' : 'bg-ok-soft text-ok'
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </p>
  )
}

export function GoogleButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false)
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        await authClient.signIn.social({ provider: 'google', callbackURL: safeRedirect(next) })
        setPending(false)
      }}
    >
      Continue with Google
    </Button>
  )
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-sm text-slate">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

export function SignInForm({ next, googleEnabled }: { next?: string; googleEnabled: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    setInfo(null)
    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setPending(false)
    if (signInError) {
      if (signInError.code === 'EMAIL_NOT_VERIFIED') {
        setInfo('Verify your email first. We just sent you a new link.')
      } else {
        setError(signInError.message ?? 'Sign-in failed. Check your email and password.')
      }
      return
    }
    router.push(safeRedirect(next))
    router.refresh()
  }

  return (
    <>
      {googleEnabled ? (
        <>
          <GoogleButton next={next} />
          <Divider />
        </>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {info ? <Notice tone="ok">{info}</Notice> : null}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-cobalt hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

export function SignUpForm({ next, googleEnabled }: { next?: string; googleEnabled: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    setPending(true)
    setError(null)
    const { data, error: signUpError } = await authClient.signUp.email({
      name: String(form.get('name')),
      email,
      password: String(form.get('password')),
      callbackURL: safeRedirect(next),
    })
    setPending(false)
    if (signUpError) {
      setError(signUpError.message ?? 'Could not create your account.')
      return
    }
    // With email verification on there is no session yet: ask them to check their inbox.
    if (!data?.token) {
      setSentTo(email)
      return
    }
    router.push(safeRedirect(next))
    router.refresh()
  }

  if (sentTo) {
    return (
      <Notice tone="ok">
        We sent a verification link to {sentTo}. Open it to finish creating your account.
      </Notice>
    )
  }

  return (
    <>
      {googleEnabled ? (
        <>
          <GoogleButton next={next} />
          <Divider />
        </>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required maxLength={80} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1 text-sm text-slate">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  )
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    const { error: requestError } = await authClient.requestPasswordReset({
      email: String(form.get('email')),
      redirectTo: '/reset-password',
    })
    setPending(false)
    if (requestError) {
      setError(requestError.message ?? 'Could not send the reset email.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Notice tone="ok">
        If an account uses that email, a reset link is on its way. It expires in 1 hour.
      </Notice>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    const { error: resetError } = await authClient.resetPassword({
      newPassword: String(form.get('password')),
      token,
    })
    setPending(false)
    if (resetError) {
      setError(resetError.message ?? 'This reset link is invalid or has expired.')
      return
    }
    router.push('/sign-in?reset=1')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  )
}
