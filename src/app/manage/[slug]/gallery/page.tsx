import Image from 'next/image'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { ConfirmAction } from '@/components/confirm-action'
import { Field, TextField } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/misc'
import { listGallery } from '@/server/gallery'

import { deletePhotoAction, uploadPhotoAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ManageGalleryPage({ params }: PageProps<'/manage/[slug]/gallery'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)
  const images = await listGallery(club.id)

  return (
    <div className="space-y-8">
      <section className="max-w-xl">
        <h2 className="mb-4 font-display text-xl font-bold">Add a photo</h2>
        <ActionForm action={uploadPhotoAction.bind(null, club.id, club.slug)} resetOnSuccess>
          <Field name="photo" label="Photo" hint="JPEG, PNG, WebP or GIF, up to 5 MB.">
            <input
              id="field-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              className="block text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:font-semibold"
            />
          </Field>
          <TextField name="caption" label="Caption (optional)" maxLength={300} />
          <SubmitButton pendingLabel="Uploading…">Upload photo</SubmitButton>
        </ActionForm>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Gallery</h2>
        {images.length === 0 ? (
          <EmptyState title="No photos yet">Uploaded photos appear on the club page.</EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {images.map((image) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-xl border border-line bg-surface"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={image.url}
                    alt={image.caption || 'Club photo'}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 p-2">
                  <p className="min-w-0 flex-1 truncate text-sm text-slate">
                    {image.caption || 'No caption'}
                  </p>
                  <ConfirmAction
                    action={deletePhotoAction.bind(null, image.id, club.slug)}
                    label="Remove"
                    confirm="Remove this photo?"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
