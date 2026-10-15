'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { FieldErrorsContext } from '@/components/ui/field-controls'
import type { ActionState } from '@/lib/action-state'
import { cn } from '@/lib/utils'

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>

type ActionFormProps = {
  action: ServerAction
  children: ReactNode
  className?: string
  /** Clear inputs after a successful submit (for "add another" forms). */
  resetOnSuccess?: boolean
  /** Navigate here after success. */
  redirectTo?: string
}

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  redirectTo,
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  // Remounting the fields after a successful submit clears controlled inputs and
  // previews, which form.reset() misses. Adjusted during render, keyed by submit time.
  const [resetKey, setResetKey] = useState(0)
  if (resetOnSuccess && state?.ok && state.at && state.at !== resetKey) setResetKey(state.at)

  useEffect(() => {
    if (!state?.at) return
    if (state.ok) {
      if (state.message) toast.success(state.message)
      if (resetOnSuccess) formRef.current?.reset()
      if (redirectTo) router.push(redirectTo)
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message)
    }
  }, [state, resetOnSuccess, redirectTo, router])

  return (
    <FieldErrorsContext value={state?.fieldErrors ?? {}}>
      <form ref={formRef} action={formAction} className={cn('space-y-5', className)}>
        {state && !state.ok && state.message ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.message}
          </p>
        ) : null}
        <Fragment key={resetKey}>{children}</Fragment>
      </form>
    </FieldErrorsContext>
  )
}

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (pendingLabel ?? 'Saving…') : children}
    </Button>
  )
}
