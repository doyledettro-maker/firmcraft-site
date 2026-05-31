import { Badge } from '@/components/ui'
import type { ProspectStatus } from '@/lib/db/prospects'

const TONE: Record<ProspectStatus, 'neutral' | 'amber' | 'green' | 'red' | 'blue'> = {
  draft: 'neutral',
  queued: 'amber',
  sent: 'blue',
  opened: 'blue',
  clicked: 'green',
  replied: 'green',
  bounced: 'red',
  unsubscribed: 'red',
}

const LABEL: Record<ProspectStatus, string> = {
  draft: 'Draft',
  queued: 'Queued',
  sent: 'Sent',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
  bounced: 'Bounced',
  unsubscribed: 'Unsubscribed',
}

export function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  return <Badge tone={TONE[status]}>● {LABEL[status]}</Badge>
}
