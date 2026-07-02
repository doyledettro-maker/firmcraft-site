import Link from 'next/link'
import { ArrowRight, ClipboardList, Flame, Target } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, ConsoleCard, Metric } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClients, getAllUsageTotals } from '@/lib/db'
import { getOpportunities } from '@/lib/db/opportunities'
import { formatCurrency, formatSpend, formatDate, formatNumber } from '@/lib/format'
import {
  STAGE_LABELS,
  formatCloseWindow,
  isNextActionOverdue,
  needsAttention,
  pipelineSummary,
} from '@/lib/opportunity-signals'

export const dynamic = 'force-dynamic'

function currentMonthRange(now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const to = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)
  return { from, to }
}

export default async function DashboardPage() {
  const [clients, usageTotals, openOpps] = await Promise.all([
    getClients(),
    getAllUsageTotals(currentMonthRange()),
    getOpportunities({ openOnly: true }),
  ])
  const oppsWithTouch = openOpps.map((o) => ({ ...o, lastTouchAt: null }))
  const pipeline = pipelineSummary(oppsWithTouch)
  const attention = oppsWithTouch
    .filter((o) => o.specialAttention)
    .sort((a, b) => (a.expectedCloseEnd ?? '9999').localeCompare(b.expectedCloseEnd ?? '9999'))
    .slice(0, 4)
  const total = clients.length
  const active = clients.filter((c) => c.status === 'active').length
  const onboarding = clients.filter((c) => c.status === 'onboarding').length
  const mrr = clients.filter((c) => c.status === 'active').reduce((s, c) => s + c.monthlyRevenue, 0)
  const totalUsers = clients.reduce((s, c) => s + c.usage.activeUsers, 0)
  const recent = [...clients].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5)

  const spendDisplay = formatSpend(usageTotals.cost)
  const callsSub = usageTotals.apiCalls > 0
    ? `${formatNumber(usageTotals.apiCalls)} calls this month`
    : 'rolling 30 days'

  return (
    <AppShell>
      {/* Hero — status pill, Geist 600 headline w/ signal emphasis, dual CTA, console card */}
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center mb-10">
        <div>
          <span className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-pill bg-paper border border-line font-mono text-[11px] tracking-[0.06em] text-ink-2">
            <span className="w-[7px] h-[7px] rounded-full bg-ok shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
            admin · live · {active} active {active === 1 ? 'client' : 'clients'}
          </span>
          <h1 className="font-sans font-semibold text-[40px] md:text-[48px] leading-[1.04] tracking-tightest mt-4 text-balance">
            Firmcraft <span className="text-signal">control room</span>
          </h1>
          <p className="text-ink-2 text-[16.5px] mt-3 max-w-[480px] leading-relaxed">
            Manage tenants, monitor usage, and onboard new clients.
          </p>
          <div className="flex gap-2.5 mt-6 flex-wrap">
            <Link href="/onboarding">
              <Button>
                <ClipboardList className="w-4 h-4" />
                Review submissions
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="ghost">All clients</Button>
            </Link>
          </div>
          <div className="flex gap-5 mt-7 flex-wrap font-mono text-[11px] uppercase tracking-eyebrow text-muted">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal flex-none" />
              {total} {total === 1 ? 'tenant' : 'tenants'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal flex-none" />
              {onboarding} onboarding
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal flex-none" />
              {formatNumber(totalUsers)} active users
            </span>
          </div>
        </div>

        <ConsoleCard title={<>firmcraft · <b>ops</b></>} live="live">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Active clients" value={String(active)} sub={`${onboarding} onboarding`} />
            <Metric label="MRR" value={formatCurrency(mrr)} sub="active clients" />
            <Metric label="Active users" value={formatNumber(totalUsers)} sub="all tenants" />
            <Metric label="AI spend / mo" value={spendDisplay} sub={callsSub} />
          </div>
        </ConsoleCard>
      </div>

      {openOpps.length > 0 ? (
        <Card className="mb-8">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <div className="eyebrow">Sales pipeline</div>
              <h3 className="font-sans font-semibold text-[20px] tracking-tight mt-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-signal" />
                {formatNumber(pipeline.openCount)} open · {formatCurrency(pipeline.pipelineValue)} pipeline
                <span className="text-muted font-normal text-[13px] font-mono">
                  ({formatCurrency(pipeline.weightedValue)} weighted · {pipeline.closingSoonCount} closing soon)
                </span>
              </h3>
            </div>
            <Link href="/opportunities">
              <Button variant="ghost" size="sm">
                Open board
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {attention.length > 0 ? (
            <ul className="divide-y divide-line">
              {attention.map((o) => {
                const overdue = isNextActionOverdue(o)
                const flag = needsAttention(o)
                return (
                  <li key={o.id}>
                    <Link
                      href={`/opportunities?opp=${o.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-paper-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-accent-2 flex-none" />
                          {o.company.companyName}
                          {flag ? (
                            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-danger">
                              needs attention
                            </span>
                          ) : null}
                        </div>
                        <div className={`text-[13px] truncate ${overdue ? 'text-danger' : 'text-muted'}`}>
                          {o.nextAction ?? 'No next action set'}
                          {o.nextActionDueAt ? ` · due ${formatDate(o.nextActionDueAt)}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-none">
                        <span className="font-mono text-[11.5px] text-muted whitespace-nowrap hidden sm:inline">
                          closes {formatCloseWindow(o.expectedCloseStart, o.expectedCloseEnd)}
                        </span>
                        <span className="font-mono text-[12px] text-ink-2 uppercase tracking-[0.12em]">
                          {STAGE_LABELS[o.stage]}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="eyebrow">Recent activity</div>
            <h3 className="font-sans font-semibold text-[20px] tracking-tight mt-1">Recently added clients</h3>
          </div>
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-paper-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{c.name}</div>
                  <div className="text-[13px] text-muted truncate">
                    {c.industry} · added {formatDate(c.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-none">
                  <StatusBadge status={c.status} />
                  <span className="font-mono text-[12px] text-muted uppercase tracking-[0.12em] hidden sm:inline">
                    {c.planTier}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  )
}
