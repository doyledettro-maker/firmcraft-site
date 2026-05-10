import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Users, DollarSign, FilePlus } from 'lucide-react'
import { PartnerShell } from '@/components/PartnerShell'
import { Card, CardBody, Button } from '@/components/ui'
import { getSessionPartner } from '@/lib/session'
import {
  getClientsForPartner,
  partnerTotalCommission,
  partnerPlanMix,
} from '@/lib/mock-partners'
import { planMeta } from '@/lib/survey'
import { formatCurrency } from '@/lib/format'

export default function PartnerHome() {
  const partner = getSessionPartner()
  if (!partner) redirect('/login')

  const clients = getClientsForPartner(partner.id)
  const totals = partnerTotalCommission(partner.id)
  const planMix = partnerPlanMix(partner.id)
  const activeClients = clients.filter((c) => c.status === 'active').length

  return (
    <PartnerShell partnerName={partner.name}>
      <div className="mb-7">
        <div className="eyebrow">Welcome back</div>
        <h1 className="font-serif-warm text-[40px] leading-[1.05] tracking-[-0.02em] mt-1">
          Hello, <em className="text-accent italic">{partner.contactName.split(' ')[0]}</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[560px]">
          Snapshot of your book of business with Firmcraft.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Stat
          label="Clients"
          value={String(clients.length)}
          sub={`${activeClients} active`}
        />
        <Stat
          label="This month"
          value={formatCurrency(totals.total)}
          sub="estimated commission"
        />
        <Stat
          label="Commission rate"
          value={`${Math.round(partner.commissionRate * 100)}%`}
          sub="standard reseller share"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <ActionCard
          icon={Users}
          title="My clients"
          description="See the firms you've referred to Firmcraft and their current status."
          href="/clients"
        />
        <ActionCard
          icon={DollarSign}
          title="Commissions"
          description="Per-client breakdown and monthly totals for the current period."
          href="/commissions"
        />
        <ActionCard
          icon={FilePlus}
          title="Submit a client"
          description="Send a new onboarding survey to Firmcraft on a client's behalf."
          href="/submit"
        />
      </div>

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Plan mix</div>
          <h3 className="font-serif-warm text-[20px] mt-1 tracking-[-0.01em]">Your book by tier</h3>
        </div>
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            {planMix.map(({ tier, count }) => {
              const meta = planMeta[tier]
              return (
                <div key={tier} className="border border-line rounded-xl p-4">
                  <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {meta.name}
                  </div>
                  <div className="font-serif-warm text-[28px] tracking-[-0.02em] mt-1 leading-none">
                    {count}
                  </div>
                  <div className="text-[12px] text-muted mt-1">{meta.price}</div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </PartnerShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardBody className="px-5 py-5">
        <div className="font-mono-warm text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="font-serif-warm text-[28px] tracking-[-0.02em] mt-1.5 leading-none">{value}</div>
        <div className="text-[12px] text-muted mt-2">{sub}</div>
      </CardBody>
    </Card>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Users
  title: string
  description: string
  href: string
}) {
  return (
    <Card className="hover:border-ink transition-colors">
      <Link href={href} className="block">
        <CardBody>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-paper-2 grid place-items-center">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-serif-warm text-[19px] tracking-[-0.01em] m-0">{title}</h3>
          </div>
          <p className="text-[13.5px] text-ink-2 leading-relaxed">{description}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-accent">
            Open <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </CardBody>
      </Link>
    </Card>
  )
}
