import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { StatusBanner } from './StatusBanner'
import { SupportForm } from './SupportForm'

export const metadata: Metadata = {
  title: 'Support | Firmcraft',
  description:
    'Get help with your Firmcraft AI operator — system status, common questions, and a direct line to our team.',
}

const FAQ: { q: React.ReactNode; a: React.ReactNode }[] = [
  {
    q: <>How do I talk to my operator?</>,
    a: (
      <>
        Your operator lives on the channel we configured during onboarding — usually Microsoft Teams
        or Slack, occasionally email or SMS. Mention it by name (or post in its dedicated channel)
        and write what you want in plain English. No commands to memorize, no syntax. It will ask
        clarifying questions when it needs them and confirm before doing anything irreversible.
      </>
    ),
  },
  {
    q: <>How do I add a team member?</>,
    a: (
      <>
        Send us a note through this page or email{' '}
        <a
          href="mailto:hello@firmcraft.ai"
          className="text-accent hover:underline underline-offset-[3px]"
        >
          hello@firmcraft.ai
        </a>
        . We&apos;ll configure access, scope their role, write their{' '}
        <code className="font-mono-warm text-[13px] bg-paper px-1.5 py-px rounded">USER.md</code>{' '}
        (the file that tells the operator who they are and what they can approve), and have them
        live within one business day.
      </>
    ),
  },
  {
    q: <>What happens if my operator goes down?</>,
    a: (
      <>
        We monitor every deployment 24/7. The runtime auto-restarts on most failures, and we&apos;re
        paged on anything it can&apos;t recover from on its own. If you ever can&apos;t reach your
        operator, file an urgent request on this page or text Doyle directly at (217) 206-5142 —
        we&apos;ll have eyes on it within the hour, regardless of time of day.
      </>
    ),
  },
  {
    q: <>How does billing work?</>,
    a: (
      <>
        Flat monthly subscription per the plan you signed for, billed on the first. Each plan
        includes a monthly AI token allowance; usage is tracked in real time and visible to you.
        Anything past the included allowance is billed at the published per-token rates — no
        markups, no surprise minimums. See the{' '}
        <Link href="/pricing" className="text-accent hover:underline underline-offset-[3px]">
          pricing page
        </Link>{' '}
        for current rates.
      </>
    ),
  },
  {
    q: <>Can my operator access my files and tools?</>,
    a: (
      <>
        Only what you explicitly authorized during onboarding. Each integration — your PMS,
        accounting system, document store, calendar, email — is connected with its own credentials,
        scoped to specific actions, and revocable from your end at any time. Nothing is added later
        without your written approval.
      </>
    ),
  },
  {
    q: <>Is my data secure?</>,
    a: (
      <>
        Enterprise-grade by default: encrypted at rest (AES-256) and in transit (TLS 1.3), per-firm
        deployment so your data never crosses with another client&apos;s, and a full audit log of
        every read, write, and send. We never train models on your data, and the runtime is built
        on Hermes Agent — an MIT-licensed open-source platform — so you have no vendor lock-in. See
        our{' '}
        <Link href="/security" className="text-accent hover:underline underline-offset-[3px]">
          security page
        </Link>{' '}
        for the full posture.
      </>
    ),
  },
]

export default function SupportPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-10">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#DEEAD2,transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,#F4D9B7,transparent 60%)' }}
        />

        <div className="relative max-w-[1080px] mx-auto px-8">
          <div className="font-mono-warm text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-accent hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Support
          </div>
          <div className="eyebrow">Client support</div>
          <h1 className="font-serif-warm font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] tracking-[-0.022em] mt-3 mb-4 text-balance serif-h">
            We&apos;re <em>here.</em> Tell us what&apos;s going on.
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0 mb-8">
            Live system status, answers to the questions clients ask most, and a direct line to the
            humans who run your operator. No tickets, no tier-1 maze.
          </p>

          {/* Section 1 — Status */}
          <StatusBanner />
        </div>
      </section>

      {/* Section 2 — FAQ */}
      <section className="py-16 bg-white border-y border-[var(--line)]">
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start mb-10">
            <div>
              <div className="eyebrow">Quick answers</div>
              <h2 className="font-serif-warm font-medium text-[clamp(30px,3.2vw,44px)] leading-[1.05] tracking-[-0.02em] mt-2 m-0 text-balance serif-h">
                The things <em>most</em> clients ask first.
              </h2>
            </div>
            <p className="text-base text-ink-2 leading-[1.55] m-0 max-w-[560px]">
              If your question isn&apos;t here — or the answer raises a follow-up — drop a note in
              the form below. Doyle reads every one personally.
            </p>
          </div>
          <div className="flex flex-col gap-0">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="border-b border-[var(--line)] py-5 first:border-t group"
              >
                <summary className="flex justify-between items-center font-serif-warm font-medium text-[20px] leading-[1.3] tracking-[-0.005em] text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden serif-h">
                  {item.q}
                  <span
                    className="font-serif-warm italic text-[28px] text-accent ml-4 flex-none leading-none"
                    aria-hidden
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div className="mt-3.5 text-[15.5px] leading-[1.6] text-ink-2 max-w-[760px]">
                  <p className="m-0">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Contact form */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <div className="eyebrow">Reach a human</div>
              <h2 className="font-serif-warm font-medium text-[clamp(30px,3.2vw,44px)] leading-[1.05] tracking-[-0.02em] mt-2 mb-4 text-balance serif-h">
                Tell us what you <em>need.</em>
              </h2>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-6 max-w-[440px]">
                Pick the urgency that matches your situation — we&apos;ll respond on that clock.
                Urgent requests page Doyle directly.
              </p>
              <ul className="list-none p-0 m-0 flex flex-col gap-2 text-sm text-ink-2 leading-[1.5]">
                {[
                  ['General', 'Reply within 24 hours · business days'],
                  ['Not working', 'Reply within 4 hours · business hours'],
                  ['Urgent', 'Reply within 1 hour · 24/7'],
                ].map(([k, v], i, arr) => (
                  <li
                    key={k}
                    className="flex gap-2.5 items-start pb-2"
                    style={{
                      borderBottom: i === arr.length - 1 ? 'none' : '1px dashed var(--line)',
                    }}
                  >
                    <b className="text-ink font-medium min-w-[90px] inline-block font-mono-warm text-[11px] tracking-[0.1em] uppercase">
                      {k}
                    </b>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <SupportForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
