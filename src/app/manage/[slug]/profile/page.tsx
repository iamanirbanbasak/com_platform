import { ActionForm, SubmitButton } from '@/components/action-form'
import { ImageInput } from '@/components/image-input'
import { Field, Select, TextAreaField, TextField } from '@/components/ui/field'
import { CLUB_CATEGORIES } from '@/lib/validation'

import { updateProfileAction } from '../actions'
import { loadManagedClub } from '../load-club'

export default async function ProfilePage({ params }: PageProps<'/manage/[slug]/profile'>) {
  const { slug } = await params
  const { club } = await loadManagedClub(slug)

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 font-display text-xl font-bold">Club profile</h2>
      <ActionForm action={updateProfileAction.bind(null, club.id, club.slug)}>
        <TextField name="name" label="Club name" defaultValue={club.name} required />
        <Field name="category" label="Category">
          <Select name="category" defaultValue={club.category}>
            {CLUB_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <TextAreaField
          name="description"
          label="About the club"
          defaultValue={club.description}
          rows={6}
          hint="Shown on the club page. What you do, when you meet, who should join."
        />
        <ImageInput name="logo" label="Logo" currentUrl={club.logoUrl} />
        <ImageInput
          name="cover"
          label="Cover image"
          currentUrl={club.coverUrl}
          hint="A wide photo works best. JPEG, PNG, WebP or GIF, up to 5 MB."
        />
        <SubmitButton>Save profile</SubmitButton>
      </ActionForm>
    </div>
  )
}
