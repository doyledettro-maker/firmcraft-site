import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact | Firmcraft',
  description:
    'Talk to Firmcraft about putting an AI operator to work in your firm. Twenty minutes on a call, a funded roadmap by month’s end.',
}

const POINTS: [string, string][] = [
  ['Discovery call', 'Twenty minutes to understand your firm and where AI actually fits.'],
  ['Fixed-fee assessment', 'Two to three weeks, scoped on the call. A funded roadmap at the end.'],
  ['No fit, no bill', 'If we don’t think AI fits your business, we’ll say so — and bill nothing.'],
]

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-10">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />

        <div className="relative max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Contact
          </div>
          <div className="eyebrow">Start here</div>
          <h1 className="font-sans font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] tracking-[-0.022em] mt-3 mb-4 text-balance">
            Let&apos;s talk about your <em>firm.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0">
            Tell us a little about what you do and what you&apos;re hoping AI can take off your
            plate. Doyle reads every message personally and replies within one business day.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="font-sans font-medium text-[clamp(30px,3.2vw,44px)] leading-[1.05] tracking-[-0.02em] mt-2 mb-4 text-balance">
                Twenty minutes to <em>a roadmap.</em>
              </h2>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-6 max-w-[440px]">
                No pressure, no jargon. Just an honest conversation about whether an AI operator
                belongs in your business.
              </p>
              <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm text-ink-2 leading-[1.5]">
                {POINTS.map(([k, v], i, arr) => (
                  <li
                    key={k}
                    className="flex flex-col gap-1 pb-3"
                    style={{
                      borderBottom: i === arr.length - 1 ? 'none' : '1px dashed var(--color-line)',
                    }}
                  >
                    <b className="text-ink font-medium font-mono text-[11px] tracking-[0.1em] uppercase">
                      {k}
                    </b>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ContactForm source="contact" submitLabel="Book the discovery call →" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
