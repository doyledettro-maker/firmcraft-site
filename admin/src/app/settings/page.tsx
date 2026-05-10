import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'

export const metadata = { title: 'Settings · Firmcraft Admin' }

export default function GlobalSettingsPage() {
  return (
    <AppShell>
      <div className="mb-7">
        <div className="eyebrow">Settings</div>
        <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Workspace <em className="text-accent italic">settings</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[560px]">
          Global Firmcraft admin settings — auth, billing, model routing, branding. UI stub for now.
        </p>
      </div>

      <Card>
        <CardBody className="p-10 text-center">
          <p className="font-mono-warm text-[12px] uppercase tracking-[0.14em] text-muted">Not built yet</p>
          <p className="font-serif-warm text-[24px] mt-2 tracking-[-0.01em]">
            Coming once we wire the <em className="text-accent italic">backend</em>.
          </p>
          <p className="text-ink-2 mt-3 max-w-[420px] mx-auto">
            Auth (Cognito or Clerk), Stripe billing, LiteLLM model routing, white-label branding controls live here.
          </p>
        </CardBody>
      </Card>
    </AppShell>
  )
}
