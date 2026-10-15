'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/action-state'

type InviteGeneratorProps = {
  createInvite: () => Promise<NonNullable<ActionState> & { code?: string }>
  baseUrl: string
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          toast.success(`${label} copied.`)
        } catch {
          toast.error('Copy failed. Select the text and copy it manually.')
        }
      }}
    >
      Copy {label.toLowerCase()}
    </Button>
  )
}

export function InviteGenerator({ createInvite, baseUrl }: InviteGeneratorProps) {
  const [code, setCode] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const link = code ? `${baseUrl}/join/${code}` : ''

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Invite an official member</h2>
      <p className="mt-1 max-w-prose text-slate">
        Each invite is for one person. It works once and expires after 7 days. Share the link, or
        read out the code so they can enter it on the join page.
      </p>
      <Button
        type="button"
        className="mt-4"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createInvite()
            if (result?.ok && result.code) setCode(result.code)
            else toast.error(result?.message ?? 'Could not create an invite.')
          })
        }
      >
        {pending ? 'Generating…' : code ? 'Generate another invite' : 'Generate invite'}
      </Button>

      {code ? (
        <div className="mt-5 space-y-4 rounded-xl bg-cobalt-soft p-4" aria-live="polite">
          <div>
            <p className="text-sm font-semibold">Code</p>
            <p className="font-mono text-3xl font-bold tracking-widest select-all">{code}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Link</p>
            <p className="font-mono text-sm break-all select-all">{link}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={link} label="Link" />
            <CopyButton value={code} label="Code" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
