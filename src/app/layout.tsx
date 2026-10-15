import type { Metadata } from 'next'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import { Toaster } from 'sonner'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SITE_NAME } from '@/lib/site'

import './globals.css'

const display = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'] })
const body = Instrument_Sans({ variable: '--font-instrument', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'Find clubs, follow what they are up to, and join as an official member.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1 pt-8 pb-20">{children}</main>
        <SiteFooter />
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  )
}
