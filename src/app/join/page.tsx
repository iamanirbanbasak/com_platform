import type { Metadata } from 'next'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { TextField } from '@/components/ui/field'
import { Container } from '@/components/ui/misc'

import { lookUpInviteAction } from './actions'

export const metadata: Metadata = { title: 'Join a club' }

export default function JoinPage() {
  return (
    <Container className="max-w-md">
      <h1 className="font-display text-3xl font-extrabold">Join a club</h1>
      <p className="mt-2 mb-6 text-slate">
        Enter the invite code your club president gave you. Each code works once.
      </p>
      <ActionForm action={lookUpInviteAction}>
        <TextField
          name="code"
          label="Invite code"
          placeholder="ABCD-EFGH-JK"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className="h-12 font-mono text-lg tracking-widest uppercase"
        />
        <SubmitButton className="w-full" pendingLabel="Checking…">
          Continue
        </SubmitButton>
      </ActionForm>
    </Container>
  )
}
