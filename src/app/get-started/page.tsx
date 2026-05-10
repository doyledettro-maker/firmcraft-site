import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { GetStartedClient } from './GetStartedClient'

export const metadata: Metadata = {
  title: 'Get started · Firmcraft',
  description:
    'Tell us about your business so we can scope your AI operator. Two ways: a guided conversation, or a markdown template you can fill out offline.',
}

export default function GetStartedPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-8">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#F4D9B7,transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,#DEEAD2,transparent 60%)' }}
        />

        <div className="relative max-w-[1080px] mx-auto px-8">
          <div className="font-mono-warm text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-accent hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Get started
          </div>
          <div className="eyebrow">Client onboarding survey</div>
          <h1 className="font-serif-warm font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] tracking-[-0.022em] mt-3 mb-4 text-balance serif-h">
            Tell us about your <em>business.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0 mb-2">
            Ten short sections. We use this to scope your operator, write the
            playbooks, and have something running by the end of week one. Pick
            the way that fits how you like to work.
          </p>
          <p className="text-[13.5px] text-muted leading-[1.5] max-w-[640px] m-0 mb-6">
            Every answer is freeform — paragraphs welcome, nothing required, you can
            edit everything before submitting. If you&apos;d rather walk through it
            with a person,{' '}
            <a
              href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
              className="text-accent hover:underline underline-offset-[3px]"
            >
              book a 20-minute call
            </a>
            .
          </p>
        </div>
      </section>

      {/* CLIENT */}
      <section
        className="pb-24"
        style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          <GetStartedClient />
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
