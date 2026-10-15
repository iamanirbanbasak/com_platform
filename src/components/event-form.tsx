import { SubmitButton } from '@/components/action-form'
import { ImageInput } from '@/components/image-input'
import { TextAreaField, TextField } from '@/components/ui/field'
import { APP_TIMEZONE, toLocalDateTimeInput } from '@/lib/dates'

type EventFormFieldsProps = {
  defaults?: {
    title: string
    description: string
    startsAt: Date
    endsAt: Date | null
    venue: string
    coverUrl: string | null
  }
  submitLabel: string
}

export function EventFormFields({ defaults, submitLabel }: EventFormFieldsProps) {
  return (
    <>
      <TextField
        name="title"
        label="Event name"
        defaultValue={defaults?.title}
        required
        maxLength={200}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="startsAt"
          label="Starts"
          type="datetime-local"
          defaultValue={toLocalDateTimeInput(defaults?.startsAt)}
          required
        />
        <TextField
          name="endsAt"
          label="Ends (optional)"
          type="datetime-local"
          defaultValue={toLocalDateTimeInput(defaults?.endsAt)}
        />
      </div>
      <p className="-mt-3 text-sm text-slate">Times are in {APP_TIMEZONE}.</p>
      <TextField
        name="venue"
        label="Where"
        defaultValue={defaults?.venue}
        maxLength={200}
        placeholder="Room, building or link"
      />
      <TextAreaField
        name="description"
        label="Details"
        defaultValue={defaults?.description}
        rows={5}
      />
      <ImageInput name="cover" label="Cover image (optional)" currentUrl={defaults?.coverUrl} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </>
  )
}
