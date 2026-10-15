import type { GalleryImage } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import type { GalleryImageInput } from '@/lib/validation'
import { requireClubManager } from '@/server/access'
import { isAdmin, type Actor } from '@/server/actor'
import { fail, ok, type Result } from '@/server/result'

export async function listGallery(clubId: string) {
  return db.galleryImage.findMany({
    where: { clubId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function addGalleryImage(
  actor: Actor | null,
  clubId: string,
  input: GalleryImageInput,
): Promise<Result<GalleryImage>> {
  const access = await requireClubManager(actor, clubId)
  if (!access.ok) return access
  return ok(
    await db.galleryImage.create({
      data: { ...input, clubId, uploadedById: access.value.actor.id },
    }),
  )
}

export async function deleteGalleryImage(
  actor: Actor | null,
  imageId: string,
): Promise<Result<null>> {
  const image = await db.galleryImage.findUnique({
    where: { id: imageId },
    select: { clubId: true },
  })
  if (!image) return fail('NOT_FOUND', 'Image not found.')
  const access = await requireClubManager(actor, image.clubId)
  if (!access.ok) return access
  await db.galleryImage.delete({ where: { id: imageId } })
  return ok(null)
}

export async function listRecentImagesForAdmin(actor: Actor | null) {
  if (!isAdmin(actor)) return []
  return db.galleryImage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: { club: { select: { name: true, slug: true } } },
  })
}
