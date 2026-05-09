import {
  Bot,
  Wrench,
  TrendingDown,
  MessageSquare,
  Zap,
  Shield,
  Users,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: Bot,
    text: "You bought ChatGPT Plus. Three people use it. The rest haven't touched it.",
  },
  {
    icon: Wrench,
    text: "You paid for Copilot. It's fine. Nobody's sure what it's doing.",
  },
  {
    icon: TrendingDown,
    text: "The problem isn't the tools. It's that deploying AI across a real firm takes infrastructure nobody has time to build.",
  },
]

const features = [
  {
    icon: MessageSquare,
    title: 'Lives in Slack',
    body: 'Your AI operator works where your team already works. No new app. No learning curve.',
  },
  {
    icon: Zap,
    title: 'Connected to your tools',
    body: 'Google Workspace. Your CRM. Industry software. We handle all integrations.',
  },
  {
    icon: Shield,
    title: 'Flat monthly rate',
    body: 'Operator, integrations, token costs, support — all included. No usage bills. Ever.',
  },
  {
    icon: Users,
    title: 'Running in a week',
    body: "Not a six-month IT project. A one-week setup and you're live.",
  },
]

const plans = [
  {
    name: 'Spark',
    price: '$399',
    cadence: '/mo',
    tagline: '“Get started” — single workflow, fully run for you.',
    setup: '$1,000 setup',
    highlight: false,
    cta: 'Get Started',
    ctaHref: 'mailto:hello@firmcraft.ai?subject=Firmcraft Spark',
    features: [
      'One core workflow (contracts, intake, claims)',
      'Up to 3 tool integrations',
      'Lives in your team chat',
      'Monthly review with ops lead',
    ],
  },
  {
    name: 'Flow',
    price: '$799',
    cadence: '/mo',
    tagline: '“Run the business” — operator handles recurring work.',
    setup: '$2,000 setup',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Get Started',
    ctaHref: 'mailto:hello@firmcraft.ai?subject=Firmcraft Flow',
    features: [
      'Up to 8 active workflows',
      'Unlimited integrations',
      'Custom playbooks per role',
      'Weekly ops review + change requests',
      'SOC 2 controls + audit log access',
    ],
  },
  {
    name: 'Forge',
    price: '$1,499',
    cadence: '/mo',
    tagline: '“Operate at scale” — multi-team, multi-location.',
    setup: '$3,500 setup',
    highlight: false,
    cta: "Let's Talk",
    ctaHref: 'mailto:hello@firmcraft.ai?subject=Firmcraft Forge',
    features: [
      'Unlimited workflows + custom builds',
      'Multi-team / multi-location support',
      'Dedicated operations lead',
      'Quarterly executive review',
      'Priority queue + change SLA',
    ],
  },
]

const industries = [
  'Accounting & CPA Firms',
  'Law Practices',
  'Consulting Firms',
  'Financial Advisors',
  'Real Estate & Title',
]

const comparisonRows = [
  { label: 'Setup', them: 'You figure it out', us: 'Done in a week' },
  { label: 'Integration', them: 'Copy-paste', us: 'Connected to your tools' },
  { label: 'Firm context', them: 'None', us: 'Learns your clients & workflows' },
  { label: 'Ongoing management', them: 'Your problem', us: 'Our job' },
  { label: 'Cost structure', them: 'Per seat + manage it yourself', us: 'Flat monthly, all-in' },
  { label: 'Support', them: 'Documentation', us: 'A real person you can text' },
]

// ─── Components ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A2540]">

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0A2540]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center justify-between">
          {/* Wordmark */}
          <span className="font-display font-bold text-white text-[1.125rem] tracking-tight">
            firm<span className="text-[#00D4AA]">craft</span>
          </span>

          {/* Nav items */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#pricing"
              className="hidden sm:inline-flex items-center text-[0.8125rem] font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              Pricing
            </a>
            <a
              href="mailto:hello@firmcraft.ai"
              className="inline-flex items-center gap-1.5 bg-[#00D4AA] text-[#0A2540] font-bold text-[0.8125rem] px-4 py-2 rounded-full hover:brightness-105 transition-all shadow-[0_2px_12px_rgba(0,212,170,0.30)]"
            >
              Talk to Us
            </a>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative hero-noise pt-[110px] pb-24 px-5 overflow-hidden">
        {/* Glow blobs */}
        <div
          aria-hidden
          className="glow-cyan w-[600px] h-[600px] -top-32 left-1/2 -translate-x-1/2"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#E8FF47]/4 blur-3xl"
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow pill */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#00D4AA] text-[0.6875rem] font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
              AI Operators for Professional Services Firms
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-white leading-[1.05] tracking-[-0.03em] mb-6
            text-[2.625rem] sm:text-[3.5rem] md:text-[4.25rem]">
            Your firm.{' '}
            <span className="text-[#E8FF47]">An AI operator.</span>
            <br />
            Running by next week.
          </h1>

          {/* Subhead */}
          <p className="text-white/55 text-[1rem] sm:text-[1.125rem] leading-[1.7] max-w-[36rem] mb-10">
            Firmcraft deploys a dedicated AI operator into your firm&apos;s Slack —
            connected to your tools, working alongside your people from day one.
            Flat monthly rate. Everything included. No IT project. No surprise bills.
          </p>

          {/* Single CTA */}
          <a
            href="mailto:hello@firmcraft.ai?subject=Firmcraft Discovery Call"
            className="inline-flex items-center gap-2.5 bg-[#00D4AA] text-[#0A2540] font-bold text-[0.9375rem] px-7 py-4 rounded-full hover:brightness-105 transition-all shadow-[0_4px_24px_rgba(0,212,170,0.35)]"
          >
            Book a 30-Minute Call
            <ArrowRight size={16} strokeWidth={2.5} />
          </a>

          {/* Trust nudge */}
          <p className="mt-5 text-white/30 text-[0.8125rem]">
            Or <a href="#pricing" className="text-white/50 underline underline-offset-2 hover:text-white transition-colors">see plans ↓</a>
          </p>
        </div>
      </section>

      {/* ══ THE PROBLEM ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="font-display font-bold text-white text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight mb-10 max-w-xl">
            Your competitors are using AI.{' '}
            <span className="text-white/40">
              You bought the tools. Nobody&apos;s using them.
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {painPoints.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="card-hover bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#00D4AA]" />
                </div>
                <p className="text-white/65 text-[0.875rem] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="font-display font-bold text-white text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight">
              One operator. Your entire firm.{' '}
              <span className="text-[#00D4AA]">Week one.</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="card-hover relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
              >
                {/* Step number watermark */}
                <span className="absolute -bottom-2 -right-1 font-display font-extrabold text-[4rem] text-white/[0.03] leading-none select-none">
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#00D4AA]" />
                </div>
                <h3 className="font-display font-semibold text-white text-[0.9375rem]">{title}</h3>
                <p className="text-white/50 text-[0.8125rem] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-5 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="font-display font-bold text-white text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight mb-3">
              One flat rate. No per-seat math.
            </h2>
            <p className="text-white/45 text-[0.9375rem] max-w-2xl leading-relaxed">
              Every plan includes onboarding, all integrations, all model costs, and a real
              person at Firmcraft you can text. The only thing that changes between tiers is
              how much of your team&apos;s recurring work the operator absorbs.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 mb-8">
            {plans.map((plan) => {
              const isVolt = plan.highlight

              return (
                <div
                  key={plan.name}
                  className={[
                    'relative rounded-2xl p-7 flex flex-col gap-6 card-hover',
                    isVolt
                      ? 'plan-volt shadow-[0_8px_40px_rgba(232,255,71,0.20)]'
                      : 'bg-white/[0.04] border border-white/[0.08]',
                  ].join(' ')}
                >
                  {/* Most Popular badge */}
                  {plan.badge && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0A2540] text-[#E8FF47] text-[0.6875rem] font-bold uppercase tracking-[0.1em] px-3.5 py-1 rounded-full whitespace-nowrap border border-[#E8FF47]/20">
                      {plan.badge}
                    </span>
                  )}

                  {/* Plan header */}
                  <div>
                    <h3 className={[
                      'font-display font-bold text-[1rem] mb-2',
                      isVolt ? 'text-[#0A2540]' : 'text-white',
                    ].join(' ')}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={[
                        'font-display font-extrabold text-[2.25rem] leading-none tracking-tight',
                        isVolt ? 'text-[#0A2540]' : 'text-white',
                      ].join(' ')}>
                        {plan.price}
                      </span>
                      <span className={[
                        'text-[0.8125rem] font-medium mb-0.5',
                        isVolt ? 'text-[#0A2540]/60' : 'text-white/40',
                      ].join(' ')}>
                        {plan.cadence}
                      </span>
                    </div>
                    <p className={[
                      'text-[0.8125rem] font-semibold',
                      isVolt ? 'text-[#0A2540]/70' : 'text-[#00D4AA]',
                    ].join(' ')}>
                      {plan.tagline}
                    </p>
                    <p className={[
                      'text-[0.75rem] mt-0.5',
                      isVolt ? 'text-[#0A2540]/50' : 'text-white/30',
                    ].join(' ')}>
                      {plan.setup}
                    </p>
                  </div>

                  {/* Feature list */}
                  <ul className="flex flex-col gap-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[0.8125rem]">
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          className={[
                            'mt-0.5 shrink-0',
                            isVolt ? 'text-[#0A2540]' : 'text-[#00D4AA]',
                          ].join(' ')}
                        />
                        <span className={isVolt ? 'text-[#0A2540]/80' : 'text-white/65'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={plan.ctaHref}
                    className={[
                      'text-center font-bold text-[0.875rem] py-3.5 rounded-full transition-all',
                      isVolt
                        ? 'bg-[#0A2540] text-white hover:bg-[#0d2e4e] shadow-[0_2px_12px_rgba(10,37,64,0.40)]'
                        : 'bg-white/8 border border-white/12 text-white hover:bg-white/12',
                    ].join(' ')}
                  >
                    {plan.cta}
                  </a>
                </div>
              )
            })}
          </div>

          <p className="text-white/40 text-[0.875rem] text-center max-w-2xl mx-auto leading-relaxed">
            Bigger than 50 seats or need a full build-out? We hand off to{' '}
            <a
              href="https://skillcalibrate.com"
              className="text-[#00D4AA] hover:text-[#00D4AA]/80 underline underline-offset-2 transition-colors"
            >
              SkillCalibrate.com
            </a>{' '}
            for full discovery.
          </p>
        </div>
      </section>

      {/* ══ WHO IT'S FOR ═════════════════════════════════════════════════════ */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Who It&apos;s For</SectionLabel>
          <h2 className="font-display font-bold text-white text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight mb-8">
            Built for firms that run on expertise.
          </h2>
          <div className="flex flex-wrap gap-3">
            {industries.map((name) => (
              <span
                key={name}
                className="bg-white/[0.04] border border-white/[0.08] text-white/70 text-[0.875rem] font-medium px-5 py-2.5 rounded-full hover:border-[#00D4AA]/40 hover:text-[#00D4AA] transition-colors cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY FIRMCRAFT – COMPARISON ═══════════════════════════════════════ */}
      <section className="py-20 px-5 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Why Firmcraft</SectionLabel>
          <h2 className="font-display font-bold text-white text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight mb-10">
            Not just a tool. An operator.
          </h2>

          {/* Mobile-first card comparison — stacked rows */}
          <div className="flex flex-col gap-3">
            {/* Column header row (visible sm+) */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr] gap-0 text-[0.75rem] font-bold uppercase tracking-[0.1em] mb-1 px-4">
              <span className="text-white/30"></span>
              <span className="text-white/40 text-center">ChatGPT / Copilot</span>
              <span className="text-[#00D4AA] text-center">Firmcraft</span>
            </div>

            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={[
                  'rounded-xl overflow-hidden border',
                  i % 2 === 0 ? 'border-white/[0.07] bg-white/[0.03]' : 'border-white/[0.05] bg-transparent',
                ].join(' ')}
              >
                {/* Mobile layout: stacked */}
                <div className="sm:hidden p-4 flex flex-col gap-2">
                  <span className="text-[#00D4AA] text-[0.6875rem] font-bold uppercase tracking-[0.1em]">
                    {row.label}
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 flex items-start gap-1.5 text-white/35 text-[0.8125rem]">
                      <X size={12} strokeWidth={2.5} className="mt-0.5 shrink-0 text-white/20" />
                      {row.them}
                    </div>
                    <div className="flex-1 flex items-start gap-1.5 text-[#00D4AA] text-[0.8125rem] font-medium">
                      <Check size={12} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                      {row.us}
                    </div>
                  </div>
                </div>

                {/* Desktop layout: 3 columns */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr] gap-0 px-4 py-3.5 items-center">
                  <span className="text-white/70 text-[0.875rem] font-medium">{row.label}</span>
                  <span className="text-white/35 text-[0.875rem] text-center flex items-center justify-center gap-1.5">
                    <X size={12} strokeWidth={2} className="text-white/20 shrink-0" />
                    {row.them}
                  </span>
                  <span className="text-[#00D4AA] text-[0.875rem] font-medium text-center flex items-center justify-center gap-1.5">
                    <Check size={12} strokeWidth={2.5} className="shrink-0" />
                    {row.us}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ═══════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-5 overflow-hidden">
        {/* Glow */}
        <div
          aria-hidden
          className="glow-cyan w-[700px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[200px] h-[200px] rounded-full bg-[#E8FF47]/5 blur-3xl"
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="section-label text-[#E8FF47]">Limited Capacity</p>
          <h2 className="font-display font-extrabold text-white leading-[1.1] tracking-[-0.03em] mb-5
            text-[2.125rem] sm:text-[2.75rem] md:text-[3.25rem]">
            Your firm could have an AI operator running by next week.
          </h2>
          <p className="text-white/45 text-[1rem] mb-10">
            We have capacity for a limited number of new clients this month.
          </p>
          <a
            href="mailto:hello@firmcraft.ai?subject=Firmcraft Discovery Call"
            className="inline-flex items-center gap-2.5 bg-[#00D4AA] text-[#0A2540] font-bold text-[0.9375rem] px-8 py-4 rounded-full hover:brightness-105 transition-all shadow-[0_4px_32px_rgba(0,212,170,0.35)]"
          >
            Book a 30-Minute Call
            <ArrowRight size={16} strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.8125rem]">
          {/* Brand + contact */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span className="font-display font-bold text-white/90 text-[0.9375rem]">
              firm<span className="text-[#00D4AA]">craft</span>
            </span>
            <span className="text-white/20 hidden sm:inline">·</span>
            <a
              href="mailto:hello@firmcraft.ai"
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              hello@firmcraft.ai
            </a>
          </div>

          {/* Legal */}
          <p className="text-white/25 text-[0.75rem]">
            © 2026 Predictium LLC dba Firmcraft
          </p>
        </div>
      </footer>

    </div>
  )
}
