import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { EmployeeCodesCard } from '@/components/EmployeeCodesCard'

export const metadata = { title: 'Settings · Firmcraft Admin' }

export default function GlobalSettingsPage() {
  return (
    <AppShell>
      <div className="mb-7">
        <div className="eyebrow">Settings</div>
        <h1 className="font-sans font-semibold text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Workspace <em className="text-signal not-italic">settings</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[560px]">
          Global Firmcraft admin settings — mobile sign-in, auth, billing, model routing, branding.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <EmployeeCodesCard />

        <Card>
          <CardBody className="p-10 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">More to come</p>
            <p className="font-sans font-semibold text-[24px] mt-2 tracking-[-0.01em]">
              The rest lands once we wire the <em className="text-signal not-italic">backend</em>.
            </p>
            <p className="text-ink-2 mt-3 max-w-[420px] mx-auto">
              Stripe billing, LiteLLM model routing, and white-label branding controls live here next.
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
