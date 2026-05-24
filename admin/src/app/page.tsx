import Link from 'next/link'
import { ArrowRight, ClipboardList, Users, DollarSign, Activity } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, CardBody } from '@/components/ui'
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
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow">Overview</div>
          <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
            Firmcraft <em className="text-accent italic">control room</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
            Manage tenants, monitor usage, and onboard new clients.
          </p>
        </div>
        <div className="flex gap-2 flex-none">
          <Link href="/clients">
            <Button variant="ghost">All clients</Button>
          </Link>
          <Link href="/onboarding">
            <Button>
              <ClipboardList className="w-4 h-4" />
              Review submissions
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Users} label="Total clients" value={String(total)} sub={`${active} active · ${onboarding} onboarding`} />
        <Kpi icon={DollarSign} label="MRR" value={formatCurrency(mrr)} sub="across active clients" />
        <Kpi icon={Users} label="Active users" value={formatNumber(totalUsers)} sub="across all tenants" />
        <Kpi icon={Activity} label="AI spend / mo" value={spendDisplay} sub={callsSub} />
      </div>

      <Card>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="eyebrow">Recent activity</div>
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">Recently added clients</h3>
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
                  <span className="font-mono-warm text-[12px] text-muted uppercase tracking-[0.12em] hidden sm:inline">
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

