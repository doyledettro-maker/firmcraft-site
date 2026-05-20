import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card } from '@/components/ui'
import { ClientsTable } from '@/components/ClientsTable'
import { getClients } from '@/lib/db'

export const metadata = { title: 'Clients · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await getClients()
  const activeCount = clients.filter((c) => c.status === 'active').length

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <div className="eyebrow">Clients</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            All <em className="text-accent italic">tenants</em>
          </h1>
          <p className="text-ink-2 mt-2">
            {clients.length} clients — {activeCount} active.
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
        <ClientsTable clients={clients} />
      </Card>
    </AppShell>
  )
}
