import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Firmcraft — How it works. Four steps, then it runs.',
  description:
    'Discovery, deploy, operate, optimize. Four steps from first call to a running AI operator. Days, not quarters.',
}

const STEPS: {
  n: string
  title: string
  body: string
  details: string[]
  timeline: string
}[] = [
  {
    n: '01',
    title: 'Discovery',
    body: 'We assess your business, tools, and workflows. A 20-minute call, not a 90-day SOW.',
    details: [
      'Map your recurring workflows and pain points',
      'Inventory every tool your team touches',
      'Identify the first playbook to deploy',
      'Scope integrations and channel setup',
    ],
    timeline: 'Day 1',
  },
  {
    n: '02',
    title: 'Deploy',
    body: 'Configure your AI operator, connect channels, set up playbooks. Your environment, your data boundary.',
    details: [
      'Provision a dedicated operator environment',
      'Connect to your team chat (Slack, Teams, SMS, email)',
      'Wire integrations to your existing tools',
      'Configure playbooks, approval rules, and roles',
    ],
    timeline: 'Days 2 - 4',
  },
  {
    n: '03',
    title: 'Operate',
    body: 'Your AI operator handles tasks, learns your business, and gets sharper with every interaction.',
    details: [
      'Operator runs your first production workflow',
      'Learns your voice, preferences, and house rules',
      'Handles scheduled and event-driven work automatically',
      'Asks before it does anything sensitive',
    ],
    timeline: 'Day 5 +',
  },
  {
    n: '04',
    title: 'Optimize',
    body: 'Ongoing support, new playbooks, expanding capabilities. The operator gets better because we keep building.',
    details: [
      'Monthly ops reviews with your dedicated lead',
      'New playbooks as your needs evolve',
      'Performance tuning and workflow expansion',
      'Priority support and change requests',
    ],
    timeline: 'Ongoing',
  },
]

const WHAT_YOU_GET: { label: string; desc: string }[] = [
  { label: 'A real person', desc: 'Your ops lead at Firmcraft — someone you can text, not a ticket queue.' },
  { label: 'Your environment', desc: 'Dedicated deployment. Your data stays in your boundary, not ours.' },
  { label: 'Full audit trail', desc: 'Every action logged, reversible, exportable for compliance.' },
  { label: 'No lock-in', desc: 'Month-to-month. Full data export within 5 business days if you leave.' },
]

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader current="how-it-works" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div
          aria-hidden
          className="absolute -top-[180px] -left-[180px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#C9D8FB,transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -right-[200px] w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle,#FBE3D7,transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="font-mono-warm text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-accent hover:underline underline-offset-[3px]">
              &larr; Back to home
            </Link>
            &nbsp;&middot;&nbsp; How it works
          </div>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-end">
            <div>
              <div className="eyebrow">How it works</div>
              <h1 className="font-serif-warm font-medium text-[clamp(46px,5.4vw,76px)] leading-[1.04] tracking-[-0.022em] mt-4 mb-4 text-balance serif-h">
                Four steps. <em>Then it runs.</em>
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[560px] m-0">
                No SOW theatre. No 90-day &ldquo;discovery.&rdquo; We do the intake
                call Monday, install across your stack by Wednesday, and you&apos;re
                routing real work to the operator by Friday. There&apos;s a person at
                Firmcraft you can text the whole way.
              </p>
            </div>
            <div>
              <p
                className="font-serif-warm text-[24px] leading-[1.4] text-ink-2 max-w-[440px] ml-auto pl-[22px] py-1.5 text-balance"
                style={{ borderLeft: '2px solid var(--accent)' }}
              >
                Intake Monday. Connectors Wednesday.{' '}
                <b className="not-italic font-medium text-ink">
                  First production workflow by Friday.
                </b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="pt-6 pb-[88px]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-baseline mb-6 font-mono-warm text-[11.5px] tracking-[0.1em] text-muted uppercase border-t border-[var(--line)] pt-[18px]">
            <span>
              <b className="text-ink font-medium">The four steps</b>
            </span>
            <span>Days, not quarters</span>
          </div>

          <div className="flex flex-col gap-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="bg-white border border-[var(--line)] rounded-[20px] overflow-hidden"
              >
                <div className="grid lg:grid-cols-[auto_1fr_1.1fr] gap-0">
                  {/* Step number */}
                  <div
                    className="flex items-center justify-center px-8 py-8 lg:border-r border-b lg:border-b-0 border-[var(--line)]"
                    style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
                  >
                    <div className="text-center">
                      <div
                        className="font-serif-warm font-medium text-[48px] leading-none"
                        style={{ color: 'var(--accent)' }}
                      >
                        {step.n}
                      </div>
                      <div className="font-mono-warm text-[10px] tracking-[0.14em] text-muted uppercase mt-2">
                        {step.timeline}
                      </div>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div className="p-[28px] flex flex-col gap-3 justify-center">
                    <h3 className="font-serif-warm font-medium text-[28px] tracking-[-0.012em] m-0 leading-[1.15] serif-h">
                      {step.title}
                    </h3>
                    <p className="text-[15.5px] leading-[1.55] text-ink-2 m-0">
                      {step.body}
                    </p>
                  </div>

                  {/* Detail bullets */}
                  <div className="p-[28px] lg:border-l border-t lg:border-t-0 border-[var(--line)] flex flex-col gap-2.5 justify-center">
                    {step.details.map((d) => (
                      <div
                        key={d}
                        className="text-[14px] leading-[1.5] text-ink flex gap-2.5 items-start"
                      >
                        <span
                          className="w-[5px] h-[5px] rounded-full flex-none mt-[7px]"
                          style={{ background: 'var(--accent-2)' }}
                        />
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-20 bg-white border-y border-[var(--line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div>
              <div className="eyebrow">What&apos;s included</div>
              <h2 className="font-serif-warm font-medium text-[clamp(34px,3.8vw,52px)] leading-[1.05] tracking-[-0.02em] mt-2 mb-4 text-balance serif-h">
                Every engagement <em>includes.</em>
              </h2>
              <p className="text-[17px] text-ink-2 leading-[1.55] m-0">
                No matter which tier you pick, you get the same infrastructure,
                the same security posture, and the same real person at Firmcraft
                who texts you back.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WHAT_YOU_GET.map((item) => (
                <div
                  key={item.label}
                  className="bg-paper border border-[var(--line)] rounded-xl p-5 flex flex-col gap-2"
                >
                  <span className="font-mono-warm text-[10.5px] tracking-[0.14em] text-accent uppercase font-medium">
                    {item.label}
                  </span>
                  <span className="text-[14.5px] leading-[1.5] text-ink-2">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-[88px] border-t border-[var(--line)]"
        style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="eyebrow">Ready to start?</div>
              <h2 className="font-serif-warm font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance serif-h">
                The 20-minute call <em>is the demo.</em>
              </h2>
              <p className="text-[18px] text-ink-2 leading-[1.55] m-0 mb-6 max-w-[520px]">
                Bring one workflow that&apos;s been bugging you. We&apos;ll map what
                it needs, scope a playbook, and tell you honestly if it&apos;s
                something you should pay us for or just write a Zapier flow.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="btn btn-primary btn-lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
                >
                  Book a 20-min call &rarr;
                </a>
                <Link className="btn btn-ghost btn-lg" href="/pricing">
                  See pricing
                </Link>
              </div>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-[18px] p-6">
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>
                Keep reading
              </div>
              <ul className="list-none p-0 m-0 mt-3.5 flex flex-col gap-3.5 font-serif-warm text-[18px] leading-[1.45]">
                {[
                  { href: '/capabilities', label: 'The six capabilities' },
                  { href: '/playbooks', label: 'Browse 40+ playbooks' },
                  { href: '/pricing', label: 'Pricing — flat, all-seats, no math' },
                  { href: '/security', label: 'Security and trust' },
                ].map((it, i, arr) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="flex justify-between items-center pb-3.5"
                      style={{
                        borderBottom:
                          i === arr.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <span>{it.label}</span>
                      <span className="text-accent italic">&rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
