import { AppShell } from '@/components/AppShell'
import { RoadmapViewer } from '@/components/roadmap/RoadmapViewer'

export const metadata = { title: 'Roadmap & Docs · Firmcraft Admin' }

export default function RoadmapPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="eyebrow">Product documentation</div>
        <h1 className="font-sans font-semibold text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Roadmap &amp; <em className="text-signal not-italic">docs</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[620px] leading-relaxed">
          The master roadmap and every product, market, and ops doc — searchable and rendered in one place.
        </p>
      </div>
      <RoadmapViewer />
    </AppShell>
  )
}
