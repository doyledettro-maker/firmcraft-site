import { redirect } from 'next/navigation'
import { PartnerShell } from '@/components/PartnerShell'
import { Card, CardBody } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getSessionPartner } from '@/lib/session'
import {
  commissionRowsForPartner,
  partnerTotalCommission,
} from '@/lib/mock-partners'
import { formatCurrency } from '@/lib/format'
import { PLAN_PRICING } from '@/lib/pricing'

export const metadata = { title: 'Commissions · Firmcraft Partners' }

export default function CommissionsPage() {
  const partner = getSessionPartner()
  if (!partner) redirect('/login')

  const rows = commissionRowsForPartner(partner.id)
  const totals = partnerTotalCommission(partner.id)
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <PartnerShell partnerName={partner.name}>
      <div className="mb-7">
        <div className="eyebrow">Commissions · {month}</div>
        <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Your <em className="text-accent italic">earnings</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[640px]">
          {Math.round(partner.commissionRate * 100)}% of every recurring dollar
          plus your share of the AI-token margin. Final invoice numbers may
          shift slightly based on actual usage at month-end.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Subscription" value={formatCurrency(totals.nonTokenCommission)} sub="net of inclusion" />
        <Stat label="Token margin" value={formatCurrency(totals.inclusionMarginCommission)} sub="unused inclusion" />
        <Stat label="Overage margin" value={formatCurrency(totals.overageMarginCommission)} sub="20% markup share" />
        <Stat label="Total" value={formatCurrency(totals.total)} sub="this month, estimated" highlight />
      </div>

      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">By client</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">Per-client breakdown</h3>
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
              {rows.map(({ client, breakdown, tokenCost, tokenOverageCharge }) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 border-t border-line">
                    <div className="font-medium text-ink">{client.name}</div>
                    <div className="text-[12.5px] text-muted">
                      tokens: {formatCurrency(tokenCost)} cost
                      {tokenOverageCharge > 0 ? ` · ${formatCurrency(tokenOverageCharge)} overage billed` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">
                    {client.planTier} · ${PLAN_PRICING[client.planTier].tokenInclusion} incl.
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <StatusBadge status={client.status} />
                  </td>
                  {breakdown ? (
                    <>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(breakdown.nonTokenCommission)}</td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(breakdown.inclusionMarginCommission)}</td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(breakdown.overageMarginCommission)}</td>
                      <td className="px-4 py-3 border-t border-line text-right tabular-nums font-medium">{formatCurrency(breakdown.total)}</td>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted border-t border-line">
                    No clients yet. Once a client you submit goes active,
                    commission will start accruing here.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {rows.length > 0 ? (
              <tfoot>
                <tr className="bg-paper-2/60">
                  <td colSpan={3} className="px-4 py-3 border-t border-line font-mono-warm text-[11px] uppercase tracking-[0.14em] text-muted">
                    Totals
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(totals.nonTokenCommission)}</td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(totals.inclusionMarginCommission)}</td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(totals.overageMarginCommission)}</td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums font-medium">{formatCurrency(totals.total)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </Card>

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">How it&rsquo;s calculated</div>
          <h3 className="font-serif-warm text-[20px] mt-1 tracking-[-0.01em]">Three commission streams</h3>
        </div>
        <CardBody>
          <ol className="grid gap-4 text-[14px] leading-relaxed text-ink-2">
            <li>
              <span className="font-medium text-ink">Subscription (net of token inclusion).</span>{' '}
              ({Math.round(partner.commissionRate * 100)}% × (monthly price − token inclusion). Spark gives you{' '}
              {formatCurrency((PLAN_PRICING.spark.monthlyPrice - PLAN_PRICING.spark.tokenInclusion) * partner.commissionRate)} /mo.
            </li>
            <li>
              <span className="font-medium text-ink">Token-inclusion margin.</span>{' '}
              When a client uses less than their monthly token allowance, the
              unused dollars are margin — you keep {Math.round(partner.commissionRate * 100)}% of the
              difference.
            </li>
            <li>
              <span className="font-medium text-ink">Overage margin.</span>{' '}
              Token overages are billed at 1.2× cost. You earn{' '}
              {Math.round(partner.commissionRate * 100)}% of the 20% markup
              (≈{(partner.commissionRate * (0.2 / 1.2) * 100).toFixed(1)}% of every overage dollar).
            </li>
          </ol>
        </CardBody>
      </Card>
    </PartnerShell>
  )
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-ink' : ''}>
      <CardBody className="px-5 py-5">
        <div className="font-mono-warm text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="font-serif-warm text-[26px] tracking-[-0.02em] mt-1.5 leading-none">{value}</div>
        <div className="text-[12px] text-muted mt-2">{sub}</div>
      </CardBody>
    </Card>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}>
      {children}
    </th>
  )
}
