import 'server-only'

function optional(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export const env = {
  appUrl: optional('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000',
  googleClientId: optional('GOOGLE_CLIENT_ID'),
  googleClientSecret: optional('GOOGLE_CLIENT_SECRET'),
  resendApiKey: optional('RESEND_API_KEY'),
  emailFrom: optional('EMAIL_FROM') ?? 'Clubs <onboarding@resend.dev>',
  blobToken: optional('BLOB_READ_WRITE_TOKEN'),
  // Lets local e2e runs skip the inbox round-trip; always on in production.
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
}

export const isGoogleEnabled = Boolean(env.googleClientId && env.googleClientSecret)
