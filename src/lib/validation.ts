import { z } from 'zod'

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

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional()

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
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
})
export type ClubProfileInput = z.infer<typeof clubProfileSchema>

export const createClubSchema = clubProfileSchema.extend({
  slug: slugSchema,
  presidentEmail: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value.toLowerCase()))
    .pipe(z.email('Enter a valid email').nullable())
    .optional(),
})
export type CreateClubInput = z.infer<typeof createClubSchema>

export const postSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().min(1, 'Write something').max(20_000),
  visibility: z.enum(['PUBLIC', 'MEMBERS']).default('PUBLIC'),
})
export type PostInput = z.infer<typeof postSchema>

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(10_000).default(''),
    startsAt: z.coerce.date({ error: 'Pick a start time' }),
    endsAt: z
      .union([z.literal(''), z.coerce.date()])
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    venue: z.string().trim().max(200).default(''),
    coverUrl: optionalUrl,
  })
  .refine((event) => !event.endsAt || event.endsAt >= event.startsAt, {
    message: 'End time must be after the start',
    path: ['endsAt'],
  })
export type EventInput = z.infer<typeof eventSchema>

export const galleryImageSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  caption: z.string().trim().max(300).default(''),
})
export type GalleryImageInput = z.infer<typeof galleryImageSchema>
