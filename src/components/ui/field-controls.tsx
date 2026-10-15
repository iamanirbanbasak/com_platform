'use client'

import { createContext, use, type ComponentProps, type ReactNode } from 'react'

import { fieldId } from '@/components/ui/field-id'
import type { FieldErrors } from '@/lib/action-state'
import { cn } from '@/lib/utils'

export const FieldErrorsContext = createContext<FieldErrors>({})

const control =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-slate/70 focus:border-cobalt focus:outline-none aria-invalid:border-danger'

/** Wires a control to its label and to the validation errors returned by the form action. */
function useFieldProps(name: string | undefined, id: string | undefined) {
  const errors = use(FieldErrorsContext)
  const invalid = name ? Boolean(errors[name]?.length) : false
  return { id: id ?? (name ? fieldId(name) : undefined), 'aria-invalid': invalid || undefined }
}

export function Input({ className, name, id, ...props }: ComponentProps<'input'>) {
  const field = useFieldProps(name, id)
  return <input name={name} className={cn(control, 'h-10', className)} {...field} {...props} />
}

export function Textarea({ className, name, id, ...props }: ComponentProps<'textarea'>) {
  const field = useFieldProps(name, id)
  return (
    <textarea name={name} className={cn(control, 'min-h-28', className)} {...field} {...props} />
  )
}

export function Select({ className, name, id, ...props }: ComponentProps<'select'>) {
  const field = useFieldProps(name, id)
  return <select name={name} className={cn(control, 'h-10', className)} {...field} {...props} />
}

/** Shows the field's errors from the last submit, or its hint when there are none. */
export function FieldMessages({ name, hint }: { name: string; hint?: ReactNode }) {
  const errors = use(FieldErrorsContext)[name]
  if (errors?.length) {
    return errors.map((error) => (
      <p key={error} className="text-sm text-danger">
        {error}
      </p>
    ))
  }
  return hint ? <p className="text-sm text-slate">{hint}</p> : null
}
