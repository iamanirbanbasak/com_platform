'use client'

import { createContext, use, type ComponentProps, type ReactNode } from 'react'

import type { FieldErrors } from '@/lib/action-state'
import { cn } from '@/lib/utils'

export const FieldErrorsContext = createContext<FieldErrors>({})

const control =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-slate/70 focus:border-cobalt focus:outline-none aria-invalid:border-danger'

type FieldProps = {
  name: string
  label: string
  hint?: ReactNode
  children: (props: { id: string; invalid: boolean }) => ReactNode
}

export function Field({ name, label, hint, children }: FieldProps) {
  const errors = use(FieldErrorsContext)[name]
  const id = `field-${name}`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children({ id, invalid: Boolean(errors?.length) })}
      {hint && !errors?.length ? <p className="text-sm text-slate">{hint}</p> : null}
      {errors?.map((error) => (
        <p key={error} className="text-sm text-danger">
          {error}
        </p>
      ))}
    </div>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-28', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-10', className)} {...props} />
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'name' | 'children'> & {
  name: string
  label: string
  hint?: ReactNode
}

export function TextField({ name, label, hint, ...props }: TextFieldProps) {
  return (
    <Field name={name} label={label} hint={hint}>
      {({ id, invalid }) => <Input id={id} name={name} aria-invalid={invalid} {...props} />}
    </Field>
  )
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'name' | 'children'> & {
  name: string
  label: string
  hint?: ReactNode
}

export function TextAreaField({ name, label, hint, ...props }: TextAreaFieldProps) {
  return (
    <Field name={name} label={label} hint={hint}>
      {({ id, invalid }) => <Textarea id={id} name={name} aria-invalid={invalid} {...props} />}
    </Field>
  )
}
