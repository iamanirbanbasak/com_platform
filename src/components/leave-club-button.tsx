'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { leaveClubAction } from '@/app/clubs/[slug]/actions'
import { Button } from '@/components/ui/button'

export function LeaveClubButton({ clubId, slug }: { clubId: string; slug: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm('Leave this club? You will need a new invite to rejoin.')) return
        startTransition(async () => {
          const result = await leaveClubAction(clubId, slug)
          if (result.error) toast.error(result.error)
          else toast.success('You left the club.')
        })
      }}
    >
      Leave club
    </Button>
  )
}
