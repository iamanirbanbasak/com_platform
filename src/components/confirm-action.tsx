'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/action-state'

type ConfirmActionProps = {
  action: () => Promise<ActionState>
  label: string
  confirm?: string
  variant?: 'danger' | 'secondary' | 'ghost'
}

/** A one-click server action (delete, revoke, ban) with an optional confirmation. */
export function ConfirmAction({ action, label, confirm, variant = 'danger' }: ConfirmActionProps) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return
        startTransition(async () => {
          const result = await action()
          if (result?.ok) {
            if (result.message) toast.success(result.message)
          } else if (result?.message) {
            toast.error(result.message)
          }
        })
      }}
    >
      {pending ? 'Working…' : label}
    </Button>
  )
}
