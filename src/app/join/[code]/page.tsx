import type { Metadata } from 'next'
import Link from 'next/link'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { ClubPatch } from '@/components/club-patch'
import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'
import { requirePageUser } from '@/lib/require-user'
import { formatDateTime } from '@/lib/dates'
import { getInvitePreview } from '@/server/invites'
import { isMember } from '@/server/memberships'

import { acceptInviteAction } from '../actions'

export const metadata: Metadata = { title: 'Accept invite' }

const STATUS_COPY = {
  USED: 'This invite has already been used. Each code works for one person only.',
  REVOKED: 'The club president revoked this invite.',
  EXPIRED: 'This invite has expired. Ask the club president for a new one.',
} as const

export default async function AcceptInvitePage({ params }: PageProps<'/join/[code]'>) {
  const { code } = await params
  const user = await requirePageUser(`/join/${code}`)
  const invite = await getInvitePreview(decodeURIComponent(code))

  if (!invite) {
    return (
      <Container className="max-w-md">
        <h1 className="font-display text-3xl font-extrabold">Invite not found</h1>
        <p className="mt-2 text-slate">Check the code for typos and try again.</p>
        <ButtonLink href="/join" className="mt-6">
          Enter a code
        </ButtonLink>
      </Container>
    )
  }

  const { club } = invite
  const alreadyMember = await isMember(user.id, club.id)
  const problem =
    club.status !== 'ACTIVE'
      ? 'This club is no longer active.'
      : invite.status !== 'ACTIVE'
        ? STATUS_COPY[invite.status]
        : alreadyMember
          ? 'You are already an official member of this club.'
          : null

  return (
    <Container className="max-w-md">
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <ClubPatch name={club.name} logoUrl={club.logoUrl} size="lg" />
        <h1 className="mt-5 font-display text-3xl font-extrabold">Join {club.name}</h1>
        {problem ? (
          <>
            <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-danger">{problem}</p>
            <ButtonLink href={`/clubs/${club.slug}`} variant="secondary" className="mt-6">
              Visit the club page
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="mt-2 text-slate">
              You have been invited to become an official member. You will appear on the club roster
              and see members-only posts. Signed in as {user.email}.
            </p>
            <p className="mt-2 text-sm text-slate">
              Code <span className="font-mono">{invite.code}</span>, valid until{' '}
              {formatDateTime(invite.expiresAt)}.
            </p>
            <ActionForm action={acceptInviteAction} className="mt-6">
              <input type="hidden" name="code" value={invite.code} />
              <SubmitButton size="lg" className="w-full" pendingLabel="Joining…">
                Accept and join
              </SubmitButton>
            </ActionForm>
            <p className="mt-4 text-center text-sm text-slate">
              Not you?{' '}
              <Link href="/sign-in" className="text-cobalt hover:underline">
                Use another account
              </Link>
            </p>
          </>
        )}
      </div>
    </Container>
  )
}
