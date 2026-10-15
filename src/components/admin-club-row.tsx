'use client'

import { useState } from 'react'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { Input } from '@/components/ui/field'
import type { ActionState } from '@/lib/action-state'

/** Inline "set president" form; collapsed until the admin wants to change it. */
export function PresidentEditor({
  action,
  currentEmail,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  currentEmail: string | null
}) {
  const [editing, setEditing] = useState(false)
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-semibold text-cobalt hover:underline"
      >
        {currentEmail ? 'Change' : 'Assign'}
      </button>
    )
  }
  return (
    <ActionForm action={action} className="flex items-center gap-2 space-y-0">
      <label htmlFor="presidentEmail" className="sr-only">
        President email
      </label>
      <Input
        id="presidentEmail"
        name="presidentEmail"
        type="email"
        defaultValue={currentEmail ?? ''}
        placeholder="Leave empty to remove"
        className="h-8 w-56 text-sm"
        autoFocus
      />
      <SubmitButton size="sm">Save</SubmitButton>
      <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate">
        Cancel
      </button>
    </ActionForm>
  )
}
