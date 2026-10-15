import { z } from 'zod'

import { parseLocalDateTime } from '@/lib/dates'

export const CLUB_CATEGORIES = [
  'Academic',
  'Arts',
  'Cultural',
  'General',
  'Social',
  'Sports',
  'Technology',
  'Volunteering',
] as const

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'At least 2 characters')
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes')

export const clubProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  description: z.string().trim().max(5000).default(''),
  category: z.enum(CLUB_CATEGORIES),
})

/** Image URLs come from server-side uploads, never from form fields. `undefined` = unchanged. */
export type ImageFields = { logoUrl?: string | null; coverUrl?: string | null }
export type ClubProfileInput = z.infer<typeof clubProfileSchema> & ImageFields

export const createClubSchema = clubProfileSchema.extend({
  slug: slugSchema,
  presidentEmail: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value.toLowerCase()))
    .pipe(z.email('Enter a valid email').nullable())
    .optional(),
})
export type CreateClubInput = z.infer<typeof createClubSchema> & ImageFields

export const postSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().min(1, 'Write something').max(20_000),
  visibility: z.enum(['PUBLIC', 'MEMBERS']).default('PUBLIC'),
})
export type PostInput = z.infer<typeof postSchema>

const localDateTime = z.string().transform((value) => parseLocalDateTime(value) ?? undefined)

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(10_000).default(''),
    startsAt: localDateTime.pipe(z.date({ error: 'Pick a start time' })),
    endsAt: z
      .string()
      .optional()
      .transform((value) => (value ? parseLocalDateTime(value) : null))
      .pipe(z.date({ error: 'Pick a valid end time' }).nullable()),
    venue: z.string().trim().max(200).default(''),
  })
  .refine((event) => !event.endsAt || event.endsAt >= event.startsAt, {
    message: 'End time must be after the start',
    path: ['endsAt'],
  })
export type EventInput = z.infer<typeof eventSchema> & { coverUrl?: string | null }

export const galleryCaptionSchema = z.object({
  caption: z.string().trim().max(300, 'Keep captions under 300 characters').default(''),
})
export type GalleryImageInput = { url: string; caption: string }
