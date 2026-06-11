import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink, Mail } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody, Badge } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import {
  mockPartners,
  getPartner,
  commissionRowsForPartner,
  partnerTotalCommission,
  partnerPlanMix,
} from '@/lib/mock-partners'
import { planMeta } from '@/lib/survey'
import { PLAN_PRICING } from '@/lib/pricing'
import { formatCurrency, formatDate } from '@/lib/format'

export function generateStaticParams() {
  return mockPartners.map((p) => ({ id: p.id }))
}

export default function PartnerDetailPage({ params }: { params: { id: string } }) {
  const partner = getPartner(params.id)
  if (!partner) notFound()

  const rows = commissionRowsForPartner(partner.id)
  const totals = partnerTotalCommission(partner.id)
  const planMix = partnerPlanMix(partner.id)
  const activeRows = rows.filter((r) => r.breakdown !== null)

  return (
    <AppShell>
      <Link
        href="/partners"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> All partners
      </Link>

      <div className="flex items-start justify-between gap-6 mb-7 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-sans font-semibold text-[40px] leading-[1.05] tracking-[-0.02em]">
              {partner.name}
            </h1>
            <Badge tone={partner.status === 'active' ? 'green' : 'amber'}>{partner.status}</Badge>
          </div>
          <p className="text-ink-2 mt-2">
            {partner.contactName} ·{' '}
            <a
              className="hover:text-ink underline-offset-2 hover:underline"
              href={`mailto:${partner.contactEmail}`}
            >
              {partner.contactEmail}
            </a>
          </p>
          {partner.notes ? (
            <p className="text-ink-2 mt-2 max-w-[560px] text-[14px]">{partner.notes}</p>
          ) : null}
        </div>
        <a
          href={`https://partners.firmcraft.ai/${partner.slug}`}
          className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="w-4 h-4" />
          Open partner portal
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Clients" value={String(rows.length)} sub={`${activeRows.length} billable`} />
        <Stat
          label="Commission / mo"
          value={formatCurrency(totals.total)}
          sub={`@ ${Math.round(partner.commissionRate * 100)}% rate`}
        />
        <Stat
          label="Joined"
          value={formatDate(partner.createdAt)}
          sub={`partner id: ${partner.id}`}
        />
        <Stat
          label="Plan mix"
          value={planMix.map((p) => p.count).join(' / ')}
          sub={planMix.map((p) => p.tier).join(' / ')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="grid gap-6">
          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Commission breakdown</div>
              <h3 className="font-sans font-semibold text-[22px] mt-1 tracking-[-0.01em]">
                This month, by client
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <Th>Client</Th>
                    <Th>Plan</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Subscription</Th>
                    <Th className="text-right">Token margin</Th>
                    <Th className="text-right">Overage margin</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ client, breakdown }) => (
                    <tr key={client.id} className="hover:bg-paper-2 transition-colors">
                      <td className="px-4 py-3 border-t border-line">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium text-ink hover:underline underline-offset-2"
                        >
                          {client.name}
                        </Link>
                        <div className="text-[12.5px] text-muted">{client.industry}</div>
                      </td>
                      <td className="px-4 py-3 border-t border-line font-mono text-[12px] uppercase tracking-[0.12em] text-ink-2">
                        {client.planTier}
                      </td>
                      <td className="px-4 py-3 border-t border-line">
                        <StatusBadge status={client.status} />
                      </td>
                      {breakdown ? (
                        <>
                          <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                            {formatCurrency(breakdown.nonTokenCommission)}
                          </td>
                          <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                            {formatCurrency(breakdown.inclusionMarginCommission)}
                          </td>
                          <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                            {formatCurrency(breakdown.overageMarginCommission)}
                          </td>
                          <td className="px-4 py-3 border-t border-line text-right tabular-nums font-medium">
                            {formatCurrency(breakdown.total)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 border-t border-line text-right text-muted">—</td>
                          <td className="px-4 py-3 border-t border-line text-right text-muted">—</td>
                          <td className="px-4 py-3 border-t border-line text-right text-muted">—</td>
                          <td className="px-4 py-3 border-t border-line text-right text-muted">—</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted border-t border-line">
                        No clients assigned to this partner yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
                {rows.length > 0 ? (
                  <tfoot>
                    <tr className="bg-paper-2/60">
                      <td colSpan={3} className="px-4 py-3 border-t border-line font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                        Totals
                      </td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                        {formatCurrency(totals.nonTokenCommission)}
                      </td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                        {formatCurrency(totals.inclusionMarginCommission)}
                      </td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                        {formatCurrency(totals.overageMarginCommission)}
                      </td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums font-medium">
                        {formatCurrency(totals.total)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 content-start">
          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Plan mix</div>
              <h3 className="font-sans font-semibold text-[20px] mt-1 tracking-[-0.01em]">Book of business</h3>
            </div>
            <CardBody className="grid gap-3">
              {planMix.map(({ tier, count }) => {
                const meta = planMeta[tier]
                const price = PLAN_PRICING[tier]
                return (
                  <div key={tier} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-medium text-ink">{meta.name}</div>
                      <div className="text-[12px] text-muted">
                        {meta.price} · ${price.tokenInclusion} tokens
                      </div>
                    </div>
                    <div className="font-sans font-semibold text-[24px] tracking-[-0.01em] tabular-nums text-ink">
                      {count}
                    </div>
                  </div>
                )
              })}
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Contact</div>
            </div>
            <CardBody className="grid gap-2 text-[14px]">
              <div className="flex items-center gap-2 text-ink">
                <Mail className="w-4 h-4 text-muted" />
                <a className="hover:underline" href={`mailto:${partner.contactEmail}`}>
                  {partner.contactEmail}
                </a>
              </div>
              <div className="text-[12.5px] text-muted">
                Portal slug: <code className="font-mono">{partner.slug}</code>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardBody className="px-5 py-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="font-sans font-semibold text-[26px] tracking-[-0.02em] mt-1.5 leading-none">{value}</div>
        <div className="text-[12px] text-muted mt-2 truncate">{sub}</div>
      </CardBody>
    </Card>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}>
      {children}
    </th>
  )
}
