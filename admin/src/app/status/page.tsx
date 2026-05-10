import Link from 'next/link'
import { ServiceStatusList } from '@/components/ServiceStatusList'
import { Logo } from '@/components/Logo'

export const metadata = {
  title: 'Status · Firmcraft',
  description: 'Live operational status for Firmcraft services.',
  robots: { index: true, follow: true },
}

export const dynamic = 'force-dynamic'

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="h-16 border-b border-line bg-paper/85 backdrop-blur flex items-center px-6">
        <Link href="/" className="no-underline">
          <Logo />
        </Link>
        <div className="ml-auto text-[13px] text-muted font-mono-warm uppercase tracking-[0.12em] hidden sm:block">
          status.firmcraft.ai
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-[820px] mx-auto">
          <div className="mb-8">
            <div className="eyebrow">System status</div>
            <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
              Firmcraft <em className="text-accent italic">live status</em>
            </h1>
            <p className="text-ink-2 mt-2 max-w-[560px] leading-relaxed">
              Public health overview for every Firmcraft service. Auto-refreshes every 60 seconds.
            </p>
          </div>

          <div className="bg-paper-2 border border-line rounded-2xl px-6 py-6">
            <ServiceStatusList intervalMs={60_000} />
          </div>

          <div className="mt-8 text-[13px] text-muted leading-relaxed">
            Seeing a problem we’re not? Email{' '}
            <a className="text-ink underline underline-offset-2" href="mailto:support@firmcraft.ai">
              support@firmcraft.ai
            </a>{' '}
            or open the{' '}
            <Link className="text-ink underline underline-offset-2" href="/support">
              support center
            </Link>
            .
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 text-[12px] text-muted font-mono-warm">
        <div className="max-w-[820px] mx-auto flex justify-between">
          <span>firmcraft · status</span>
          <span>updates every 60s</span>
        </div>
      </footer>
    </div>
  )
}
