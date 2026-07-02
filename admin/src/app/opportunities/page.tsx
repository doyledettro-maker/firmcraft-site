import { CalendarClock, CircleDollarSign, Flame, Target } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { OpportunityBoard } from '@/components/opportunities/OpportunityBoard'
import { getCompanies } from '@/lib/db/companies'
import { getLatestTouchByCompany } from '@/lib/db/correspondence'
import { getOpportunities } from '@/lib/db/opportunities'
import { formatCurrency, formatNumber } from '@/lib/format'
import { CLOSING_SOON_DAYS, pipelineSummary } from '@/lib/opportunity-signals'

export const metadata = { title: 'Opportunities · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: { opp?: string }
}) {
  const [opportunities, companies] = await Promise.all([getOpportunities(), getCompanies()])
  const lastTouch = await getLatestTouchByCompany(
    Array.from(new Set(opportunities.map((o) => o.companyId))),
  )
  const withTouch = opportunities.map((o) => ({
    ...o,
    lastTouchAt: lastTouch[o.companyId] ?? null,
  }))
  const summary = pipelineSummary(withTouch)

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow">Pipeline</div>
          <h1 className="font-sans font-semibold text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
            Opportunity <em className="text-signal not-italic">board</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
            Qualified outreach becomes pipeline here — companies, contacts, and correspondence
            stay attached underneath.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi
          icon={Target}
          label="Open opportunities"
          value={formatNumber(summary.openCount)}
          sub={`${formatNumber(opportunities.length - summary.openCount)} closed / parked`}
        />
        <Kpi
          icon={Flame}
          label="Special attention"
          value={formatNumber(summary.specialAttentionCount)}
          sub="high-focus deals"
        />
        <Kpi
          icon={CalendarClock}
          label={`Closing ≤ ${CLOSING_SOON_DAYS}d`}
          value={formatNumber(summary.closingSoonCount)}
          sub="inside the close window"
        />
        <Kpi
          icon={CircleDollarSign}
          label="Pipeline value"
          value={formatCurrency(summary.pipelineValue)}
          sub={`${formatCurrency(summary.weightedValue)} weighted`}
        />
      </div>

      <OpportunityBoard
        opportunities={withTouch}
        companies={companies}
        initialOpenId={searchParams?.opp ?? null}
      />
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
          <div className="font-mono text-[11px] uppercase tracking-[0.16em]">{label}</div>
        </div>
        <div className="font-sans font-semibold text-[32px] tracking-[-0.02em] mt-2 leading-none">{value}</div>
        <div className="text-[12.5px] text-ink-2 mt-2">{sub}</div>
      </CardBody>
    </Card>
  )
}
