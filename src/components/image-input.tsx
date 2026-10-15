'use client'

import { useEffect, useState } from 'react'

type ImageInputProps = {
  /** Form field prefix: sends `${name}File` and `${name}Remove`. */
  name: string
  label: string
  currentUrl?: string | null
  hint?: string
}

export function ImageInput({ name, label, currentUrl, hint }: ImageInputProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [remove, setRemove] = useState(false)

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const shown = preview ?? (remove ? null : currentUrl)
  const id = `field-${name}`

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-paper text-xs text-slate">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            'None'
          )}
        </div>
        <div className="space-y-2 text-sm">
          <input
            id={id}
            name={`${name}File`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
              if (file) setRemove(false)
            }}
            className="block text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:font-semibold"
          />
          {currentUrl && !preview ? (
            <label className="flex items-center gap-2 text-slate">
              <input
                type="checkbox"
                name={`${name}Remove`}
                checked={remove}
                onChange={(event) => setRemove(event.target.checked)}
              />
              Remove current image
            </label>
          ) : null}
          <p className="text-slate">{hint ?? 'JPEG, PNG, WebP or GIF, up to 4 MB.'}</p>
        </div>
      </div>
    </div>
  )
}
