import Link from 'next/link'
import { ExternalLink, Handshake, Plus } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, Badge } from '@/components/ui'
import {
  mockPartners,
  partnerClientCount,
  partnerTotalCommission,
} from '@/lib/mock-partners'
import { formatCurrency, formatDate } from '@/lib/format'

export const metadata = { title: 'Partners · Firmcraft Admin' }

export default function PartnersPage() {
  const rows = mockPartners.map((partner) => ({
    partner,
    clientCount: partnerClientCount(partner.id),
    commission: partnerTotalCommission(partner.id),
  }))

  const totals = rows.reduce(
    (acc, r) => ({
      clients: acc.clients + r.clientCount,
      commission: acc.commission + r.commission.total,
    }),
    { clients: 0, commission: 0 },
  )

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
        <div>
          <div className="eyebrow">Partners</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            Resellers &amp; <em className="text-accent italic">referral partners</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[640px]">
            {mockPartners.length} partners — managing {totals.clients} clients,{' '}
            {formatCurrency(totals.commission)}/mo in commissions this period.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          New partner
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <Th>Partner</Th>
                <Th>Status</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Clients</Th>
                <Th className="text-right">Commission / mo</Th>
                <Th>Joined</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ partner, clientCount, commission }) => (
                <tr key={partner.id} className="hover:bg-paper-2 transition-colors">
                  <td className="px-4 py-3 border-t border-line">
                    <Link href={`/partners/${partner.id}`} className="block">
                      <div className="font-medium text-ink flex items-center gap-2">
                        <Handshake className="w-3.5 h-3.5 text-accent-2" />
                        {partner.name}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {partner.contactName} · {partner.contactEmail}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <Badge tone={partner.status === 'active' ? 'green' : 'amber'}>
                      {partner.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums font-mono-warm text-[12.5px] text-ink-2">
                    {Math.round(partner.commissionRate * 100)}%
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                    {clientCount}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                    {clientCount > 0 ? formatCurrency(commission.total) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">
                    {formatDate(partner.createdAt)}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right">
                    <Link
                      href={`/partners/${partner.id}`}
                      className="inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink"
                    >
                      Detail
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}>
      {children}
    </th>
  )
}
