import { Badge } from './ui'
import type { ClientStatus } from '@/lib/mock-clients'

export function StatusBadge({ status }: { status: ClientStatus }) {
  if (status === 'active') return <Badge tone="green">● Active</Badge>
  if (status === 'onboarding') return <Badge tone="amber">● Onboarding</Badge>
  return <Badge tone="red">● Suspended</Badge>
}
