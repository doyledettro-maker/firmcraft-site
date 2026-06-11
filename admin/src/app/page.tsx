import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, ConsoleCard, Metric } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClients, getAllUsageTotals } from '@/lib/db'
import { formatCurrency, formatSpend, formatDate, formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

function currentMonthRange(now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const to = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)
  return { from, to }
}

export default async function DashboardPage() {
  const [clients, usageTotals] = await Promise.all([
    getClients(),
    getAllUsageTotals(currentMonthRange()),
  ])
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
