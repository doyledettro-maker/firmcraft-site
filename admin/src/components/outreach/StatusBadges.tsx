import { Badge } from '@/components/ui'
import type { ContactStatus } from '@/lib/db/contacts'
import type { CompanyStatus } from '@/lib/db/companies'

const CONTACT_TONE: Record<ContactStatus, 'neutral' | 'amber' | 'green' | 'red' | 'blue' | 'teal'> = {
  targeted: 'teal',
  draft: 'neutral',
  queued: 'amber',
  sent: 'blue',
  opened: 'blue',
  clicked: 'green',
  replied: 'green',
  bounced: 'red',
  unsubscribed: 'red',
}

const CONTACT_LABEL: Record<ContactStatus, string> = {
  targeted: 'Targeted',
  draft: 'Draft',
  queued: 'Queued',
  sent: 'Sent',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
  bounced: 'Bounced',
  unsubscribed: 'Unsubscribed',
}

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return <Badge tone={CONTACT_TONE[status]}>● {CONTACT_LABEL[status]}</Badge>
}

const COMPANY_TONE: Record<CompanyStatus, 'neutral' | 'amber' | 'green' | 'red' | 'blue'> = {
  active: 'neutral',
  engaged: 'blue',
  customer: 'green',
  archived: 'red',
}

const COMPANY_LABEL: Record<CompanyStatus, string> = {
  active: 'Active',
  engaged: 'Engaged',
  customer: 'Customer',
  archived: 'Archived',
}

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return <Badge tone={COMPANY_TONE[status]}>● {COMPANY_LABEL[status]}</Badge>
}
