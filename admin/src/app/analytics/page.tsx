import { BarChart3, Eye, Users, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui'
import { getAnalyticsSummary } from '@/lib/db'
import { formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics · Firmcraft' }

const WINDOW_DAYS = 30

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary(WINDOW_DAYS)

  const maxDaily = Math.max(1, ...summary.daily.map((d) => d.views))
  const todayViews = summary.daily.at(-1)?.views ?? 0
  const yesterdayViews = summary.daily.at(-2)?.views ?? 0
  const avgDaily = summary.daily.length
    ? Math.round(summary.totalViews / summary.daily.length)
    : 0

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow">firmcraft.ai</div>
          <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
            Site <em className="text-accent italic">analytics</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
            Last {WINDOW_DAYS} days · self-hosted, no third-party trackers.
            Unique visitors estimated from a daily-rotated IP hash.
          </p>
        </div>
      </div>

      {!summary.configured && (
        <Card className="mb-6 px-6 py-5 text-ink-2">
          Supabase is not configured for the admin app, so no data is loaded.
          Set <code className="font-mono-warm">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="font-mono-warm">SUPABASE_SERVICE_ROLE_KEY</code> in the
          admin environment.
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Eye} label="Page views" value={formatNumber(summary.totalViews)} sub={`last ${WINDOW_DAYS} days`} />
        <Kpi icon={Users} label="Unique visitors" value={formatNumber(summary.totalUniques)} sub={`last ${WINDOW_DAYS} days`} />
        <Kpi icon={BarChart3} label="Today" value={formatNumber(todayViews)} sub={`avg ${formatNumber(avgDaily)} / day`} />
        <Kpi icon={ArrowUpRight} label="Yesterday" value={formatNumber(yesterdayViews)} sub="full-day total" />
      </div>

      <Card className="mb-8">
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Daily visitors</div>
          <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">
            {summary.windowDays}-day trend
          </h3>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-end gap-[3px] h-40">
            {summary.daily.map((d) => {
              const h = Math.max(2, Math.round((d.views / maxDaily) * 100))
              return (
                <div
                  key={d.day}
                  title={`${d.day} · ${d.views} views · ${d.uniques} uniques`}
                  className="flex-1 bg-accent/30 hover:bg-accent rounded-t transition-colors min-w-[3px]"
                  style={{ height: `${h}%` }}
                />
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-muted font-mono-warm">
            <span>{summary.daily[0]?.day ?? ''}</span>
            <span>{summary.daily.at(-1)?.day ?? ''}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankedList
          title="Top pages"
          eyebrow="Path"
          rows={summary.topPaths.map((p) => ({ label: p.path, count: p.views }))}
          empty="No views yet."
        />
        <RankedList
          title="Top referrers"
          eyebrow="Source"
          rows={summary.topReferrers.map((r) => ({ label: r.referrer, count: r.views }))}
          empty="No external referrers yet — most traffic is direct."
        />
      </div>
    </AppShell>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub: string
}) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center gap-2 text-ink-2 text-[12px] font-mono-warm uppercase tracking-[0.1em]">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="font-serif-warm text-[32px] leading-none mt-2">{value}</div>
      <div className="text-[12px] text-muted mt-2">{sub}</div>
    </Card>
  )
}

function RankedList({
  title,
  eyebrow,
  rows,
  empty,
}: {
  title: string
  eyebrow: string
  rows: Array<{ label: string; count: number }>
  empty: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <Card>
      <div className="px-6 py-5 border-b border-line">
        <div className="eyebrow">{eyebrow}</div>
        <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">{title}</h3>
      </div>
      <div className="px-6 py-5">
        {rows.length === 0 ? (
          <p className="text-ink-2 text-sm">{empty}</p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((row) => {
              const pct = Math.round((row.count / max) * 100)
              return (
                <li key={row.label} className="text-sm">
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="truncate text-ink" title={row.label}>
                      {row.label}
                    </span>
                    <span className="font-mono-warm text-ink-2 flex-none">
                      {formatNumber(row.count)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-paper overflow-hidden">
                    <div
                      className="h-full bg-accent/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
