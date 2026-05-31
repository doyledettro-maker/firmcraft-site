import { Building2, Mail, MailOpen, MousePointerClick, Send } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { OutreachWorkspace } from '@/components/outreach/OutreachWorkspace'
import { getCompanies } from '@/lib/db/companies'
import { getContacts, getContactStats } from '@/lib/db/contacts'
import { formatNumber } from '@/lib/format'

export const metadata = { title: 'Outreach · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

function formatPct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export default async function OutreachPage() {
  const [companies, contacts, stats] = await Promise.all([
    getCompanies(),
    getContacts(),
    getContactStats(),
  ])

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow">Outreach</div>
          <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
            Cold <em className="text-accent italic">outbound</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
            Companies, contacts, and every touch — all in one place.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Kpi
          icon={Building2}
          label="Companies"
          value={formatNumber(companies.length)}
          sub={`${stats.total} contacts`}
        />
        <Kpi icon={Mail} label="Total contacts" value={formatNumber(stats.total)} sub={`${stats.sent} sent`} />
        <Kpi icon={Send} label="Sent" value={formatNumber(stats.sent)} sub={`${stats.bounced} bounced`} />
        <Kpi icon={MailOpen} label="Open rate" value={formatPct(stats.openRate)} sub={`${stats.opened} opens`} />
        <Kpi icon={MousePointerClick} label="Click rate" value={formatPct(stats.clickRate)} sub={`${stats.clicked} clicks`} />
      </div>

      <Card>
        <OutreachWorkspace companies={companies} contacts={contacts} />
      </Card>
    </AppShell>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardBody className="px-5 py-5">
        <div className="flex items-center gap-2 text-muted">
          <Icon className="w-4 h-4" />
          <div className="font-mono-warm text-[11px] uppercase tracking-[0.16em]">{label}</div>
        </div>
        <div className="font-serif-warm text-[32px] tracking-[-0.02em] mt-2 leading-none">{value}</div>
        <div className="text-[12.5px] text-ink-2 mt-2">{sub}</div>
      </CardBody>
    </Card>
  )
}
