import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { RotatingChatHero } from '@/components/RotatingChatHero'

// ─── Data ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    tier: 'Spark',
    headline: 'Get started',
    price: '$399',
    setup: '+ $1,000 one-time setup',
    sub: 'A single workflow, fully run for you. For one-person shops and businesses validating the model.',
    features: [
      'One core workflow (e.g. contracts, intake, claims)',
      '$100/mo AI token allowance included',
      'Up to 3 tool integrations',
      'Lives in your team chat',
      'Monthly review with your ops lead',
    ],
    cta: 'Start with Spark',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Spark',
    feat: false,
  },
  {
    tier: 'Flow',
    headline: 'Run the business',
    price: '$799',
    setup: '+ $2,000 one-time setup',
    sub: 'The operator handles the recurring work eating your calendar — claims, contracts, follow-up, marketing.',
    features: [
      'Up to 8 active workflows',
      '$200/mo AI token allowance included',
      'Unlimited integrations',
      'Custom playbooks per role',
      'Weekly ops review + change requests',
      'SOC 2 controls + audit log access',
    ],
    cta: 'Choose Flow',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Flow',
    feat: true,
    badge: 'Most popular',
  },
  {
    tier: 'Forge',
    headline: 'Operate at scale',
    price: '$1,499',
    setup: '+ $3,500 one-time setup',
    sub: 'Multi-team, multi-location businesses. Custom builds, dedicated lead, priority queue.',
    features: [
      'Unlimited workflows + custom builds',
      '$300/mo AI token allowance included',
      'Multi-team / multi-location support',
      'Dedicated operations lead',
      'Quarterly executive review',
      'Priority queue + change SLA',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Forge',
    feat: false,
  },
]

const PROBLEMS = [
  { num: 'A —', title: 'The seat-license trap', body: 'You bought the chatbot. It sits in a tab. The team opened it once and never came back.' },
  { num: 'B —', title: 'The prompting tax', body: 'Every tool assumes someone has time to learn it and train the rest. They don\u2019t.' },
  { num: 'C —', title: 'The integration desert', body: 'QuickBooks, Drive, Outlook, your booking tool — none of them talk. The AI doesn\u2019t either.' },
  { num: 'D —', title: 'The pilot purgatory', body: 'Three vendor demos, six-figure SOWs, 90-day "discoveries." None shipped a workflow you use.' },
  { num: 'E —', title: 'The hire-or-build problem', body: 'You\u2019d staff this if you could. The people who could build it aren\u2019t applying to your shop.' },
  { num: 'F —', title: 'The "but client data" wall', body: 'Every interesting workflow stalls on compliance. Nobody wants to be the one who broke it.' },
]

const HOW = [
  { glyph: 'a', step: '01 / WHERE', title: 'Lives in your team chat', body: 'Mention it like a teammate. No new dashboard, no second login, nothing nobody on staff opens.' },
  { glyph: 'b', step: '02 / WHAT', title: 'Connected to your tools', body: 'QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign, your practice management — read, write, audit-log.' },
  { glyph: 'c', step: '03 / HOW MUCH', title: 'Flat monthly rate', body: 'One price. All seats. All integrations. Each tier includes a monthly AI token allowance — anything beyond is billed at published rates, tracked in real time.' },
  { glyph: 'd', step: '04 / WHEN', title: 'Running in a week', body: 'Intake Monday. Connectors live Wednesday. First production workflow by Friday. Days, not quarters.' },
]

// Industries — examples-led copy from the design reference. Each card pairs an
// abstract category ("Healthcare practices") with a concrete shipped example
// from real or representative customers. Keeps the page honest: we describe
// what we've actually done, not aspirational verticals.
const INDUSTRIES = [
  {
    num: '— 01', glyph: 'Hc', title: 'Healthcare practices',
    body: 'e.g. our dental client uses Firmcraft to draft & submit insurance reimbursement claims.',
  },
  {
    num: '— 02', glyph: 'Tr', title: 'Trades & field services',
    body: 'e.g. our tree-removal client ships DocuSign contracts on-site — signed before he leaves the driveway.',
  },
  {
    num: '— 03', glyph: 'B2', title: 'B2B services',
    body: 'e.g. our payments client uses Firmcraft as a second pair of hands for an overworked one-person marketing team.',
  },
  {
    num: '— 04', glyph: 'So', title: 'Solo & owner-operators',
    body: 'e.g. our solo ERP consultant runs an entire practice on a single operator. The cheapest second hire she\u2019ll ever make.',
  },
  {
    num: '— 05', glyph: 'Pf', title: 'Professional firms',
    body: 'CPA, law, advisory, consulting. Doc requests, review prep, billable triage, client deliverables.',
  },
]

// Comparison: Firmcraft vs the chatbots most prospects already pay for.
// Three columns (us / ChatGPT Teams / Microsoft Copilot) keeps the framing
// honest — we're an operator, they're a chatbot license; both can coexist.
const COMPARE_ROWS = [
  {
    feat: 'What you\u2019re buying',
    us: 'A managed operator + a real person at Firmcraft',
    chatgpt: 'A per-seat chatbot license',
    copilot: 'A per-seat chatbot license',
  },
  {
    feat: 'Lives where the work lives',
    us: 'Inside your team chat',
    chatgpt: 'A separate app + browser tab',
    copilot: 'Side panel inside Office',
  },
  {
    feat: 'Speaks to QuickBooks, Zoho, niche tools',
    us: 'Built and maintained for you',
    chatgpt: 'DIY connectors, if any',
    copilot: 'Microsoft stack only',
  },
  {
    feat: 'Pricing',
    us: 'Flat monthly, all seats',
    chatgpt: 'Per seat, per month',
    copilot: 'Per seat, per month',
  },
  {
    feat: 'Time to first workflow',
    us: '5 business days',
    chatgpt: 'Whenever someone has time',
    copilot: 'Whenever someone has time',
  },
  {
    feat: 'Who builds the prompts',
    us: 'We do.',
    chatgpt: 'You do.',
    copilot: 'You do.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="hero-warm">
        <div className="warm-wrap">
          <div className="hero-grid">
            <div>
              <span className="hero-tag">
                <span className="dot" /> An AI operator for small business
              </span>
              <h1 className="hero-title-warm">
                A capable second set of hands.{' '}
                <em>Running by next Friday.</em>
              </h1>
              <p className="hero-sub">
                Firmcraft lives in your team chat, plugs into the tools you already
                pay for — QuickBooks, Microsoft 365, Google Workspace, Zoho, your
                practice management — and quietly does the work. Flat monthly rate.
                Up and running in five business days.
              </p>
              <div className="hero-ctas">
                <a
                  className="btn btn-primary btn-lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
                >
                  Book a 20-min call →
                </a>
                <a className="btn btn-ghost btn-lg" href="#pricing">
                  See plans
                </a>
              </div>
              <div className="hero-meta">
                <span><span className="check-dot" /> Live in 5 business days</span>
                <span><span className="check-dot" /> Flat monthly rate</span>
                <span><span className="check-dot" /> SOC 2 in progress</span>
              </div>
            </div>

            <RotatingChatHero />
          </div>

          {/* Proof strip — placeholder logo slots until the customer-logo
              treatment component ships (see /opt/data/firmcraft-docs/customer-logos/README.md). */}
          <div className="proof">
            <div className="proof-in">
              <div className="label">Already running for —</div>
              <div className="logos">
                <div className="logo-slot">DENTAL PRACTICE</div>
                <div className="logo-slot">TREE-REMOVAL CO.</div>
                <div className="logo-slot">SOLO ERP CONSULTANT</div>
                <div className="logo-slot">PAYMENTS FIRM</div>
                <div className="logo-slot">+ YOU?</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM ═════════════════════════════════════════════════════════ */}
      <section className="warm-section">
        <div className="warm-wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">01 / The honest version</div>
              <h2>You don&apos;t need <em>another tool.</em> You need someone to actually do the thing.</h2>
            </div>
            <div className="right">
              <p>
                You&apos;ve already paid for ChatGPT or Copilot. Three people opened
                it the first week, nobody opened it the second. Meanwhile the
                contract still doesn&apos;t get sent until you&apos;re back at the
                truck, the insurance claim still sits in someone&apos;s inbox, and
                the marketing email still hasn&apos;t gone out — because the person
                who&apos;d do it has client work.
              </p>
            </div>
          </div>

          <div className="problem-grid">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="pcell">
                <div className="num">{p.num}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section className="how-section" id="how">
        <div className="warm-wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">02 / How it works</div>
              <h2>Four beats. <em>Then it&apos;s running.</em></h2>
            </div>
            <div className="right">
              <p>
                No SOW theatre. No 90-day &ldquo;discovery.&rdquo; We do the intake call
                Monday, install across your stack by Wednesday, and you&apos;re routing
                real work to the operator by Friday. There&apos;s a person at Firmcraft
                you can text the whole way.
              </p>
            </div>
          </div>

          <div className="how-grid">
            {HOW.map((h) => (
              <div key={h.title} className="how-cell">
                <div className="glyph">{h.glyph}</div>
                <div className="step-n">{h.step}</div>
                <h4>{h.title}</h4>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════════════════ */}
      <section className="warm-section" id="pricing">
        <div className="warm-wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">03 / Pricing</div>
              <h2>One flat rate. <em>No per-seat math.</em></h2>
            </div>
            <div className="right">
              <p>
                Every plan includes onboarding, all integrations, a monthly AI
                token allowance, and a real person at Firmcraft you can text.
                Additional usage is billed at published rates, tracked in real
                time. The only thing that changes between tiers is how much of
                your team&apos;s recurring work the operator absorbs.
              </p>
            </div>
          </div>

          <div className="price-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`price-card${plan.feat ? ' feat' : ''}`}
              >
                {plan.badge && <span className="badge">{plan.badge}</span>}
                <div className="tier">{plan.tier}</div>
                <h3>{plan.headline}</h3>
                <div className="price-amount">
                  <span className="big">{plan.price}</span>
                  <span className="per">/ month</span>
                </div>
                <div className="price-setup">{plan.setup}</div>
                <p className="sub">{plan.sub}</p>
                <div className="divider" />
                <ul className="price-list">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a
                  className={`btn ${plan.feat ? 'btn-primary' : 'btn-ghost'}`}
                  href={plan.href}
                >
                  {plan.cta} →
                </a>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            color: 'var(--muted)',
            fontSize: '14px',
          }}>
            Bigger than 50 seats or need a full build-out? We hand off to{' '}
            <a
              href="https://skillcalibrate.com"
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              SkillCalibrate.com
            </a>{' '}
            for full discovery.
          </p>
        </div>
      </section>

      {/* ══ INDUSTRIES ══════════════════════════════════════════════════════ */}
      <section className="warm-section" id="industries">
        <div className="warm-wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">04 / Who it&apos;s for</div>
              <h2>Built for businesses doing <em>the actual work.</em></h2>
            </div>
            <div className="right">
              <p>
                Our first four customers — a dental practice, a one-person tree-removal
                company, a solo ERP consultant, and an eight-person payments firm —
                have nothing in common operationally. The throughline: recurring work,
                tools that don&apos;t talk, and nobody on staff to wire it together.
                If that&apos;s you, we&apos;re a fit.
              </p>
            </div>
          </div>

          <div className="ind-grid">
            {INDUSTRIES.map((ind) => (
              <div key={ind.title} className="ind">
                <div>
                  <div className="num">{ind.num}</div>
                  <div className="glyph">{ind.glyph}</div>
                </div>
                <div>
                  <h4>{ind.title}</h4>
                  <p>{ind.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARE ═════════════════════════════════════════════════════════ */}
      <section className="compare" id="compare">
        <div className="warm-wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">05 / Comparison</div>
              <h2>Firmcraft <em>vs.</em> the chatbot you already pay for.</h2>
            </div>
            <div className="right">
              <p>
                ChatGPT and Copilot are perfectly fine general-purpose tools. They
                are not operators. Nothing in their pricing is aligned with whether
                your business actually moves a deliverable forward — and nothing in
                their setup process gets your team past the awkward first week.
              </p>
            </div>
          </div>

          <table className="ctable">
            <thead>
              <tr>
                <th></th>
                <th className="us">Firmcraft</th>
                <th>ChatGPT Teams</th>
                <th>Microsoft Copilot</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feat}>
                  <td className="featc">{row.feat}</td>
                  <td className="usc">{row.us}</td>
                  <td className="themc">{row.chatgpt}</td>
                  <td className="themc">{row.copilot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
      <section className="final" id="cta">
        <div className="warm-wrap">
          <div className="final-grid">
            <div>
              <div className="eyebrow">06 / Get started</div>
              <h2>Twenty minutes on a call. <em>Live by next Friday.</em></h2>
              <p>
                If we&apos;re a fit, we&apos;ll scope your first workflow on the call
                and have your operator running by the end of week one. If we&apos;re
                not — or you&apos;re better served by SkillCalibrate&apos;s
                full-discovery offer — we&apos;ll tell you on the call.
              </p>
              <div className="hero-ctas">
                <a
                  className="btn btn-primary btn-lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
                >
                  Book a 20-min call →
                </a>
                <Link className="btn btn-ghost btn-lg" href="#pricing">
                  See plans
                </Link>
              </div>
            </div>
            <div className="final-card">
              <div className="photo">
                <Image
                  src="/founder/doyle.jpg"
                  alt="Doyle Dettro, founder of Firmcraft"
                  width={520}
                  height={520}
                  priority={false}
                />
              </div>
              <div className="quote">
                &ldquo;The reason small firms fall behind on AI isn&apos;t the
                tooling — it&apos;s that nobody on staff has the time to wire
                it up and run it. Firmcraft is that person, on retainer.&rdquo;
              </div>
              <div className="attr">— Doyle Dettro, founder</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
