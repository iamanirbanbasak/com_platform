'use client'

import { useState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { slugify } from '@/lib/utils'

/** Club name plus a URL slug that follows the name until edited by hand. */
export function NameAndSlugFields() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)

  return (
    <>
      <Field name="name" label="Club name">
        {({ id, invalid }) => (
          <Input
            id={id}
            name="name"
            required
            maxLength={80}
            aria-invalid={invalid}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (!touched) setSlug(slugify(event.target.value))
            }}
          />
        )}
      </Field>
      <Field name="slug" label="Page address" hint={`/clubs/${slug || 'your-club'}`}>
        {({ id, invalid }) => (
          <Input
            id={id}
            name="slug"
            required
            aria-invalid={invalid}
            value={slug}
            onChange={(event) => {
              setTouched(true)
              setSlug(event.target.value)
            }}
          />
        )}
      </Field>
    </>
  )
}
