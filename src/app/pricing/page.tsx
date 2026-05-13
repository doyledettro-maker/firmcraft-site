import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Firmcraft — Pricing. Flat rate, no per-seat math.',
  description:
    'Three tiers. One flat monthly rate. All integrations included. Pick the plan that matches how much of your recurring work the operator absorbs.',
}

const PLANS: {
  tier: string
  headline: string
  price: string
  per: string
  sub: string
  features: string[]
  cta: string
  href: string
  feat?: boolean
  badge?: string
}[] = [
  {
    tier: 'Starter',
    headline: 'Get started',
    price: '$399',
    per: '/ month',
    sub: 'One user, one operator, one workflow running end-to-end. For solo practitioners and businesses validating the model.',
    features: [
      '1 user seat',
      'Up to 5 connected channels',
      'Community support',
      'Core playbook library',
      'Audit log access',
    ],
    cta: 'Start with Starter',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Starter',
  },
  {
    tier: 'Professional',
    headline: 'Run the business',
    price: '$799',
    per: '/ month',
    sub: 'The operator handles the recurring work eating your calendar — claims, contracts, follow-up, reporting.',
    features: [
      'Up to 5 user seats',
      'Up to 10 connected channels',
      'Email support',
      'Custom playbooks',
      'Full audit log + export',
      'Role-based access controls',
    ],
    cta: 'Choose Professional',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Professional',
    feat: true,
    badge: 'Most popular',
  },
  {
    tier: 'Business',
    headline: 'Operate at scale',
    price: '$1,499',
    per: '/ month',
    sub: 'Multi-team, multi-location businesses. Custom integrations, dedicated support, priority queue.',
    features: [
      'Up to 15 user seats',
      'Unlimited channels',
      'Dedicated support',
      'Custom integrations',
      'Advanced playbook builder',
      'Priority queue + SLA',
      'Quarterly executive review',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Business',
  },
]

const FAQ: { q: React.ReactNode; a: string }[] = [
  {
    q: <>What counts as a &ldquo;channel&rdquo;?</>,
    a: 'Any messaging surface the operator connects to — a Slack workspace, a Teams tenant, an SMS number, an email inbox, a WhatsApp Business line. Each one is a channel.',
  },
  {
    q: <>Is there a per-seat charge?</>,
    a: "No. Each plan includes a fixed number of seats. Everyone on your team can interact with the operator in any connected channel — there's no extra charge per person within your plan's seat limit.",
  },
  {
    q: <>What happens if I go over my plan limits?</>,
    a: "We'll let you know before you hit any ceiling. If you need more seats, channels, or integrations, upgrading is instant and prorated. We never throttle the operator mid-workflow.",
  },
  {
    q: <>Can I switch plans later?</>,
    a: 'Yes — upgrade or downgrade at any time. Changes take effect on your next billing cycle. No lock-in, no cancellation fees.',
  },
  {
    q: <>Do you offer annual billing?</>,
    a: 'Yes. Annual plans include two months free. Email us and we will send you the annual pricing.',
  },
  {
    q: <>What if I need more than 15 seats?</>,
    a: "We hand off to SkillCalibrate.com for a full discovery engagement. Same team, same platform, custom-scoped for your organization's size.",
  },
]

export default function PricingPage() {
  return (
    <>
      <SiteHeader current="pricing" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div
          aria-hidden
          className="absolute -top-[160px] -right-[200px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[180px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              &larr; Back to home
            </Link>
            &nbsp;&middot;&nbsp; Pricing
          </div>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-end">
            <div>
              <div className="eyebrow">Pricing</div>
              <h1 className="font-sans font-medium text-[clamp(46px,5.4vw,76px)] leading-[1.04] tracking-[-0.022em] mt-4 mb-4 text-balance ">
                One flat rate. <em>No per-seat math.</em>
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[560px] m-0">
                Every plan includes onboarding, all core integrations, and a real
                person at Firmcraft you can reach. The only thing that changes between
                tiers is how much of your team&apos;s recurring work the operator
                absorbs.
              </p>
            </div>
            <div>
              <p
                className="font-sans text-[24px] leading-[1.4] text-ink-2 max-w-[440px] ml-auto pl-[22px] py-1.5 text-balance"
                style={{ borderLeft: '2px solid var(--color-signal)' }}
              >
                Pick the tier that matches your team size.{' '}
                <b className="not-italic font-medium text-ink">
                  Upgrade any time, no lock-in.
                </b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pt-6 pb-[88px]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={[
                  'bg-white border rounded-[20px] p-[28px] flex flex-col gap-4 relative',
                  plan.feat
                    ? 'border-[var(--color-signal)] shadow-[0_0_0_1px_var(--color-signal)]'
                    : 'border-[var(--color-line)]',
                ].join(' ')}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-6 font-mono text-[10.5px] tracking-[0.1em] uppercase font-medium text-white px-3 py-1 rounded-full"
                    style={{ background: 'var(--color-signal)' }}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="font-mono text-[11px] tracking-[0.16em] text-signal uppercase font-medium">
                  {plan.tier}
                </div>
                <h3 className="font-sans font-medium text-[22px] tracking-[-0.01em] m-0 leading-[1.15] ">
                  {plan.headline}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans font-medium text-[42px] tracking-[-0.02em] text-ink leading-none">
                    {plan.price}
                  </span>
                  <span className="font-mono text-[12px] text-muted tracking-[0.06em]">
                    {plan.per}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.5] text-ink-2 m-0">{plan.sub}</p>
                <div
                  className="h-px w-full"
                  style={{ background: 'var(--color-line)' }}
                />
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-[14px] leading-[1.5] text-ink flex gap-2 items-start"
                    >
                      <span
                        className="w-[5px] h-[5px] rounded-full flex-none mt-[7px]"
                        style={{ background: 'var(--color-ok)' }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  className={`btn ${plan.feat ? 'btn-primary' : 'btn-ghost'} w-full text-center justify-center mt-2`}
                  href={plan.href}
                >
                  {plan.cta} &rarr;
                </a>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-muted text-sm">
            Bigger than 15 seats or need a full build-out? We hand off to{' '}
            <a
              href="https://skillcalibrate.com"
              className="text-signal underline underline-offset-[3px] hover:text-ink transition-colors"
            >
              SkillCalibrate.com
            </a>{' '}
            for full discovery.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[88px] bg-white border-y border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <h2 className="font-sans font-medium text-[clamp(34px,3.8vw,52px)] leading-[1.05] tracking-[-0.02em] m-0 mb-9 text-balance text-center ">
            Common pricing <em>questions.</em>
          </h2>
          <div className="max-w-[840px] mx-auto flex flex-col gap-0">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="border-b border-[var(--color-line)] py-5 first:border-t group"
              >
                <summary className="flex justify-between items-center font-sans font-medium text-[21px] leading-[1.3] tracking-[-0.005em] text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden ">
                  {item.q}
                  <span
                    className="font-mono text-[20px] text-signal ml-4 flex-none leading-none"
                    aria-hidden
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">&minus;</span>
                  </span>
                </summary>
                <div className="mt-3.5 text-base leading-[1.6] text-ink-2 max-w-[720px]">
                  <p className="m-0">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-[88px] border-t border-[var(--color-line)]"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8 text-center">
          <div className="eyebrow">Ready?</div>
          <h2 className="font-sans font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance ">
            The 20-minute call <em>is the demo.</em>
          </h2>
          <p className="text-[18px] text-ink-2 leading-[1.55] m-0 mb-6 max-w-[520px] mx-auto">
            Bring one workflow. We&apos;ll scope a playbook, pick the right tier,
            and tell you honestly if it&apos;s something you should pay us for.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              className="btn btn-primary btn-lg"
              href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
            >
              Book a 20-min call &rarr;
            </a>
            <Link className="btn btn-ghost btn-lg" href="/how-it-works">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
