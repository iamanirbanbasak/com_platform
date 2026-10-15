'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Container className="max-w-xl py-10">
      <h1 className="font-display text-4xl font-extrabold">Something went wrong</h1>
      <p className="mt-3 text-slate">
        The page could not load. Try again, and if it keeps happening, contact the site admin
        {error.digest ? ` with reference ${error.digest}` : ''}.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </Container>
  )
}
