import { Inbox, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui'
import { LeadsTable } from '@/components/LeadsTable'
import { getLeads, getLeadStats } from '@/lib/db'
import { formatNumber } from '@/lib/format'

export const metadata = { title: 'Leads · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const leads = await getLeads()
  const stats = getLeadStats(leads)

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow">Leads</div>
          <h1 className="font-sans font-semibold text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
            Inbound <em className="text-signal not-italic">leads</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
            Everyone who reached out through the site — contact form, support, and CTAs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Inbox} label="New" value={formatNumber(stats.byStatus.new)} sub={`${stats.total} total`} />
        <Kpi
          icon={UserCheck}
          label="Contacted"
          value={formatNumber(stats.byStatus.contacted)}
        />
        <Kpi
          icon={Sparkles}
          label="Qualified"
          value={formatNumber(stats.byStatus.qualified)}
        />
        <Kpi
          icon={CheckCircle2}
          label="Converted"
          value={formatNumber(stats.byStatus.converted)}
        />
      </div>

      <Card>
        <LeadsTable leads={leads} />
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
  sub?: string
}) {
  return (
    <Card className="px-4 py-4">
      <div className="flex items-center gap-2 text-muted mb-2">
        <Icon className="w-4 h-4" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="text-[26px] font-sans font-semibold leading-none text-ink tabular-nums">{value}</div>
      {sub ? <div className="text-[12.5px] text-muted mt-1">{sub}</div> : null}
    </Card>
  )
}
