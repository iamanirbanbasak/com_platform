import { SubmitButton } from '@/components/action-form'
import { Field, Select, TextAreaField, TextField } from '@/components/ui/field'

type PostFormFieldsProps = {
  defaults?: { title: string; body: string; visibility: 'PUBLIC' | 'MEMBERS' }
  submitLabel: string
}

export function PostFormFields({ defaults, submitLabel }: PostFormFieldsProps) {
  return (
    <>
      <TextField
        name="title"
        label="Title"
        defaultValue={defaults?.title}
        required
        maxLength={200}
      />
      <TextAreaField
        name="body"
        label="Post"
        defaultValue={defaults?.body}
        rows={8}
        required
        hint="Markdown works: **bold**, _italic_, [links](https://example.com) and lists."
      />
      <Field name="visibility" label="Who can see this?">
        <Select name="visibility" defaultValue={defaults?.visibility ?? 'PUBLIC'}>
          <option value="PUBLIC">Everyone</option>
          <option value="MEMBERS">Official members only</option>
        </Select>
      </Field>
      <SubmitButton pendingLabel="Publishing…">{submitLabel}</SubmitButton>
    </>
  )
}
