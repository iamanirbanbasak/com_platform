import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

// Optimistic check only: real authorization happens in pages and services.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  const signIn = new URL('/sign-in', request.url)
  signIn.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(signIn)
}

export const config = {
  matcher: ['/feed', '/me', '/manage', '/manage/:path*', '/admin', '/admin/:path*', '/join/:path+'],
}
