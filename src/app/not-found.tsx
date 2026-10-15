import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

export default function NotFound() {
  return (
    <Container className="max-w-xl py-10">
      <h1 className="font-display text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-slate">
        The page may have moved, or the club may no longer be active.
      </p>
      <ButtonLink href="/clubs" className="mt-6">
        Browse clubs
      </ButtonLink>
    </Container>
  )
}
