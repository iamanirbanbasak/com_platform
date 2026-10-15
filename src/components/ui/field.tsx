import type { ComponentProps, ReactNode } from 'react'

import { FieldMessages, Input, Textarea } from '@/components/ui/field-controls'
import { fieldId } from '@/components/ui/field-id'

export { FieldErrorsContext, Input, Select, Textarea } from '@/components/ui/field-controls'

type FieldProps = {
  name: string
  label: string
  hint?: ReactNode
  /** The control; give it the same `name` so it picks up the label and errors. */
  children: ReactNode
}

export function Field({ name, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId(name)} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      <FieldMessages name={name} hint={hint} />
    </div>
  )
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'name' | 'children'> & {
  name: string
  label: string
  hint?: ReactNode
}

export function TextField({ name, label, hint, ...props }: TextFieldProps) {
  return (
    <Field name={name} label={label} hint={hint}>
      <Input name={name} {...props} />
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
      <Textarea name={name} {...props} />
    </Field>
  )
}
