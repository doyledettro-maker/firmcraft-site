import { redirect } from 'next/navigation'
import { PartnerShell } from '@/components/PartnerShell'
import { Card } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getSessionPartner } from '@/lib/session'
import { getClientsForPartner } from '@/lib/mock-partners'
import { formatDate } from '@/lib/format'
import { planMeta } from '@/lib/survey'

export const metadata = { title: 'My clients · Firmcraft Partners' }

export default async function ClientsPage() {
  const partner = await getSessionPartner()
  if (!partner) redirect('/login')

  const clients = getClientsForPartner(partner.id)

  return (
    <PartnerShell partnerName={partner.name}>
      <div className="mb-7">
        <div className="eyebrow">My clients</div>
        <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Your <em className="text-accent italic">referrals</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[560px]">
          Read-only view of every firm you&rsquo;ve referred. Box configs and
          technical settings are managed by Firmcraft directly.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <Th>Client</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Onboarded</Th>
                <Th>Primary contact</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 border-t border-line">
                    <div className="font-medium text-ink">{c.name}</div>
                    <div className="text-[12.5px] text-muted">{c.industry}</div>
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <div className="text-[13.5px] text-ink">{planMeta[c.planTier].name}</div>
                    <div className="text-[12px] text-muted">{planMeta[c.planTier].price}</div>
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">
                    <div>{c.contactName}</div>
                    <div className="text-[12px] text-muted">{c.contactEmail}</div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted border-t border-line">
                    No clients yet. Submit your first via the &ldquo;Submit
                    client&rdquo; tab.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[12.5px] text-muted mt-4 max-w-[640px] leading-relaxed">
        Want to see something specific about a client&rsquo;s tenant? Email{' '}
        <a className="text-ink-2 hover:text-ink hover:underline" href="mailto:partners@firmcraft.ai">
          partners@firmcraft.ai
        </a>{' '}
        and we&rsquo;ll pull what you need. Box configs, integration secrets,
        and technical settings stay locked down by design.
      </p>
    </PartnerShell>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium">
      {children}
    </th>
  )
}
