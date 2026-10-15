import { Badge } from '@/components/ui/misc'
import type { InviteStatus } from '@/server/invites'

const TONES = { ACTIVE: 'ok', USED: 'cobalt', REVOKED: 'danger', EXPIRED: 'neutral' } as const
const LABELS = { ACTIVE: 'Open', USED: 'Used', REVOKED: 'Revoked', EXPIRED: 'Expired' } as const

export function InviteStatusBadge({ status }: { status: InviteStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>
}
