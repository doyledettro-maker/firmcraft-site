import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact — Firmcraft',
  alternates: { canonical: '/contact' },
  description:
    'Contact Firmcraft about artificial intelligence advisory, managed services, and infrastructure.',
}

const POINTS: [string, string][] = [
  ['Initial conversation', 'An initial conversation carries no cost and no obligation.'],
  [
    'Assessment',
    'Firmcraft establishes the current landscape and the roadmap before implementation.',
  ],
  ['Fit first', 'If artificial intelligence is not the right investment for the problem, Firmcraft will say so.'],
]

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden pt-16 pb-10">
        <div className="relative max-w-[1080px] mx-auto px-8">
          <h1 className="font-sans font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] mt-3 mb-4 text-balance">
            Contact Firmcraft
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0">
            Tell Firmcraft about the organization, the systems in place, and the problem artificial
            intelligence or technology strategy may need to address.
          </p>
          <p className="text-[16px] leading-[1.55] text-ink-2 max-w-[640px] mt-4 mb-0">
            Call{' '}
            <a
              href="tel:+12173038319"
              className="text-signal hover:underline underline-offset-[3px]"
            >
              (217) 303-8319
            </a>{' '}
            or email{' '}
            <a
              href="mailto:hello@firmcraft.ai"
              className="text-signal hover:underline underline-offset-[3px]"
            >
              hello@firmcraft.ai
            </a>
            .
          </p>
        </div>
      </section>

      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <h2 className="font-sans font-medium text-[clamp(30px,3.2vw,44px)] leading-[1.05] mt-2 mb-4 text-balance">
                Start a conversation
              </h2>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-6 max-w-[440px]">
                An initial conversation carries no cost and no obligation. If artificial
                intelligence is not the right investment for the problem, Firmcraft will say so.
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
            <ContactForm source="contact" submitLabel="Contact Firmcraft" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
