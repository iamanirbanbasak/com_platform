import { Container } from '@/components/ui/misc'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="grid place-items-center py-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        {children}
      </div>
    </Container>
  )
}
