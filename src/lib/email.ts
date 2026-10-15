import 'server-only'

import { Resend } from 'resend'

import { env } from '@/lib/env'

type Email = {
  to: string
  subject: string
  text: string
}

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null

export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  if (!resend) {
    console.info(`[email] to=${to} subject="${subject}"\n${text}`)
    return
  }

  const { error } = await resend.emails.send({ from: env.emailFrom, to, subject, text })
  if (error) {
    console.error('[email] send failed', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
