import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'

import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { env, isGoogleEnabled } from '@/lib/env'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.requireEmailVerification,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Hi ${user.name},\n\nReset your password here: ${url}\n\nThis link expires in 1 hour.`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        text: `Hi ${user.name},\n\nConfirm your email address: ${url}`,
      })
    },
  },
  socialProviders: isGoogleEnabled
    ? {
        google: {
          clientId: env.googleClientId as string,
          clientSecret: env.googleClientSecret as string,
        },
      }
    : undefined,
  // nextCookies must stay last so cookies set by other plugins reach Server Actions.
  plugins: [admin(), nextCookies()],
})

export type Session = typeof auth.$Infer.Session
