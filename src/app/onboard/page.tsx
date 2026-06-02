import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { OnboardForm } from './OnboardForm'

export const metadata: Metadata = {
  title: 'Onboarding | Firmcraft',
  description:
    'Tell us about your business, your team, and the work you want your Firmcraft AI operator to pick up. Six quick steps — about 10 minutes.',
}

export default function OnboardPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-10">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />

        <div className="relative max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Onboarding
          </div>
          <div className="eyebrow">New client intake</div>
          <h1 className="font-sans font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] tracking-[-0.022em] mt-3 mb-4 text-balance ">
            Tell us about your <em>business.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0 mb-2">
            Six quick steps — about 10 minutes. We use this to scope your operator,
            write the playbooks, and have something running by the end of week one.
          </p>
          <p className="text-[13.5px] text-muted leading-[1.5] max-w-[640px] m-0 mb-8">
            Filling this out before our discovery call is great — but if you&apos;d
            rather walk through it together, just{' '}
            <a
              href="/contact"
              className="text-signal hover:underline underline-offset-[3px]"
            >
              book a call
            </a>{' '}
            and we&apos;ll do it live.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section
        className="pb-24"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          <OnboardForm />
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
