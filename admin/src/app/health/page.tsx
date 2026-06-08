import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui'
import { ClientHealthGrid } from '@/components/ClientHealthGrid'
import { ServiceStatusList } from '@/components/ServiceStatusList'

export const metadata = { title: 'Client Health · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

export default function HealthPage() {
  return (
    <AppShell>
      <div className="mb-7">
        <div className="eyebrow">Monitoring</div>
        <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Client <em className="text-accent italic">health</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[640px]">
          Live heartbeats from every client Hermes VPS — container state, disk, memory, gateway
          and token spend. Each instance beacons every 5 minutes; red means no heartbeat in 15
          minutes or the container is down.
        </p>
      </div>

      <Card className="px-5 py-5 mb-8">
        <ClientHealthGrid intervalMs={60_000} />
      </Card>

      <div className="mb-3">
        <h2 className="font-serif-warm text-[22px] tracking-[-0.01em]">Platform services</h2>
        <p className="text-ink-2 text-[13.5px] mt-1">
          Admin-side URL probes for shared Firmcraft infrastructure.
        </p>
      </div>
      <Card className="px-5 py-5">
        <ServiceStatusList intervalMs={60_000} showOverall />
      </Card>
    </AppShell>
  )
}
