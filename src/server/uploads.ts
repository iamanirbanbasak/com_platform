import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { put } from '@vercel/blob'

import { env } from '@/lib/env'
import { fail, ok, type Result } from '@/server/result'

const MAX_BYTES = 5 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * Stores an uploaded image and returns its public URL. Uses Vercel Blob when
 * configured; otherwise writes to public/uploads, which only works in development.
 */
export async function storeImage(file: File, folder: string): Promise<Result<string>> {
  const extension = EXTENSIONS[file.type]
  if (!extension) return fail('VALIDATION', 'Upload a JPEG, PNG, WebP or GIF image.')
  if (file.size > MAX_BYTES) return fail('VALIDATION', 'Images must be 5 MB or smaller.')
  if (file.size === 0) return fail('VALIDATION', 'That file is empty.')

  const name = `${folder}/${randomUUID()}.${extension}`

  if (env.blobToken) {
    const blob = await put(name, file, { access: 'public', contentType: file.type })
    return ok(blob.url)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for uploads in production')
  }

  const target = path.join(process.cwd(), 'public', 'uploads', name)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, Buffer.from(await file.arrayBuffer()))
  return ok(`/uploads/${name}`)
}

/** Reads an optional image field from a form: a new upload wins over the existing URL. */
export async function imageFromForm(
  formData: FormData,
  field: string,
  folder: string,
): Promise<Result<string | null | undefined>> {
  const file = formData.get(`${field}File`)
  if (file instanceof File && file.size > 0) return storeImage(file, folder)
  if (formData.get(`${field}Remove`) === 'on') return ok(null)
  return ok(undefined)
}
