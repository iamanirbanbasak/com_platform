'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'

import { followAction, unfollowAction } from '@/app/clubs/[slug]/actions'
import { Button } from '@/components/ui/button'

type FollowButtonProps = {
  clubId: string
  slug: string
  following: boolean
  signedIn: boolean
}

export function FollowButton({ clubId, slug, following, signedIn }: FollowButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(following)

  function toggle() {
    if (!signedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(`/clubs/${slug}`)}`)
      return
    }
    startTransition(async () => {
      setOptimistic(!optimistic)
      const result = optimistic
        ? await unfollowAction(clubId, slug)
        : await followAction(clubId, slug)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <Button
      type="button"
      variant={optimistic ? 'secondary' : 'primary'}
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic}
    >
      {optimistic ? 'Following' : 'Follow'}
    </Button>
  )
}
