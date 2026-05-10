import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { ClientsTable } from '@/components/ClientsTable'
import { mockClients } from '@/lib/mock-clients'

export const metadata = { title: 'Clients · Firmcraft Admin' }

export default function ClientsPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <div className="eyebrow">Clients</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            All <em className="text-accent italic">tenants</em>
          </h1>
          <p className="text-ink-2 mt-2">
            {mockClients.length} clients — {mockClients.filter((c) => c.status === 'active').length} active.
          </p>
        </div>
        <Link href="/onboarding">
          <Button>
            <ClipboardList className="w-4 h-4" />
            Review submissions
          </Button>
        </Link>
      </div>

      <Card>
        <ClientsTable clients={mockClients} />
      </Card>
    </AppShell>
  )
}
