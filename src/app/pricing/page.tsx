import type { Metadata } from 'next'
import './pricing.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import {
  ASSESSMENT,
  BUILD_PACKAGES,
  OPERATE_TIERS,
  OPERATOR_PLANS,
} from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Pricing — Firmcraft',
  description:
    'Two tracks. Firmcraft Operator (Solo/Team/Pro plans from $399/mo) and Firmcraft Services (Assessment + Build + Operate). Pick the one that fits.',
}

export default function PricingPage() {
  return (
    <>
      <SiteHeader current="pricing" />

      <main>
        {/* HERO */}
        <section className="page-hero" data-screen-label="01 Pricing hero">
          <div className="wrap">
            <div className="eyebrow">Pricing</div>
            <h1>
              Two tracks. <em>One firm.</em>
            </h1>
            <p className="lede">
              <strong>Firmcraft Operator</strong> is the packaged
              product — three plans, sized by how many of your people
              will work with the agent day-to-day, running by Friday.{' '}
              <strong>Firmcraft Services</strong> is the consulting
              practice for everything bigger — ERP integrations,
              workflow design, multi-department rollouts, anything
              past ten people.
            </p>
            <div className="price-toc">
              <a href="#operator">→ Firmcraft Operator</a>
              <a href="#services">→ Firmcraft Services</a>
              <a href="#assess">↳ Assessment</a>
              <a href="#build">↳ Build packages</a>
              <a href="#operate">↳ Operate retainers</a>
              <a href="#extras">→ Hourly &amp; hosting</a>
              <a href="#faq">→ FAQ</a>
            </div>
          </div>
        </section>

        {/* TRACK 1: OPERATOR (self-serve) */}
        <section
          className="sec track-operator"
          id="operator"
          data-screen-label="02 Operator plans"
        >
          <div className="wrap">
            <div className="track-marker">
              <span className="dot"></span>
              <span className="lab">Track 01 · The product</span>
            </div>
            <div className="block-head">
              <div className="eyebrow eb-operator">Firmcraft Operator</div>
              <h2>
                Priced by the number of people{' '}
                <em>actually using the agent.</em>
              </h2>
              <p>
                Not seats. Not features. The operator lives in your
                team chat, plugs into the tools you already pay for,
                and runs by Friday. Onboarding, all integrations, a
                monthly AI token allowance, and a real person at
                Firmcraft you can text are included on every plan.{' '}
                <a
                  href="/managed-ai"
                  style={{
                    color: 'var(--color-operator)',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Full Operator page →
                </a>
              </p>
            </div>

            <div className="plans-row">
              {OPERATOR_PLANS.map((plan) => (
                <article
                  className={`plan-mini${plan.featured ? ' feat' : ''}`}
                  key={plan.tier}
                >
                  {plan.featured && plan.badge && (
                    <span className="feat-badge">{plan.badge}</span>
                  )}
                  <div className="tier">{plan.tier}</div>
                  <div className="team-size">
                    <span className="ts-label">Team size</span>
                    <span className="ts-value">{plan.teamSize}</span>
                  </div>
                  <h3>{plan.headline}</h3>
                  <div className="price">
                    <span className="big">{plan.price}</span>
                    <span className="per">/ mo</span>
                  </div>
                  <div className="setup">{plan.setup}</div>
                  <p className="sub">{plan.subShort}</p>
                </article>
              ))}
            </div>

            <blockquote className="partner-line">
              <span className="pq-mark">“</span>
              It&apos;s like hiring someone for the office —
              contracts, emails, scheduling — except it&apos;s $399 a
              month and it&apos;s running by Friday.
              <span className="pq-mark close">”</span>
            </blockquote>
          </div>
        </section>

        {/* BRIDGE: from Operator to Services */}
        <section
          className="sec bridge"
          id="services"
          data-screen-label="03 Bridge to Services"
        >
          <div className="wrap">
            <div className="bridge-card">
              <div className="bridge-lhs">
                <div className="track-marker">
                  <span className="dot signal"></span>
                  <span className="lab">Track 02 · The practice</span>
                </div>
                <h2>
                  Beyond 10 people?{' '}
                  <em>That&apos;s a Services engagement.</em>
                </h2>
                <p>
                  Once an Operator is touching whole departments — or
                  the conversation is &ldquo;we need the agent inside
                  our ERP, with eval, observability, and a roadmap&rdquo;
                  — pricing shifts from a sticker to a scoped
                  engagement. Same engineer, same Hermes substrate, no
                  rebuild when you graduate.
                </p>
                <ul className="bridge-list">
                  <li>
                    <span className="k">Operator for 11+ people</span>
                    <span className="v">Workflow design, role policies, multi-team rollouts</span>
                  </li>
                  <li>
                    <span className="k">ERP-deep automation</span>
                    <span className="v">BC, NetSuite, Acumatica — wired through, audit-logged</span>
                  </li>
                  <li>
                    <span className="k">AI transformation</span>
                    <span className="v">Custom dev, voice agents, n8n orchestration</span>
                  </li>
                </ul>
              </div>
              <aside className="bridge-rhs">
                <div className="bridge-flow">
                  <div className="step">
                    <span className="n">01</span>
                    <span className="t">Discovery call</span>
                    <span className="s">20 min · free</span>
                  </div>
                  <div className="arr">→</div>
                  <div className="step">
                    <span className="n">02</span>
                    <span className="t">Assessment</span>
                    <span className="s">2–3 wks · fixed-fee</span>
                  </div>
                  <div className="arr">→</div>
                  <div className="step">
                    <span className="n">03</span>
                    <span className="t">Scoped Build</span>
                    <span className="s">6–16 wks · fixed-fee</span>
                  </div>
                  <div className="arr">→</div>
                  <div className="step">
                    <span className="n">04</span>
                    <span className="t">Operate</span>
                    <span className="s">Monthly retainer</span>
                  </div>
                </div>
                <a
                  className="btn primary lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Assessment"
                >
                  Book the discovery call <span className="arr">→</span>
                </a>
              </aside>
            </div>
          </div>
        </section>

        {/* ASSESSMENT */}
        <section className="sec surface-2" id="assess" data-screen-label="04 Assessment">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">Services · 01 · The front door</div>
              <h2>
                AI Readiness Assessment.{' '}
                <em>Fixed-fee, refundable, scoped on the call.</em>
              </h2>
              <p>
                Every Services engagement starts here. Two to three
                weeks, a CPA-credentialed AI engineer embedded with
                your finance and ops leads, and a board-ready plan at
                the end. Refundable against any subsequent Build
                engagement.
              </p>
            </div>

            <div className="ass-grid">
              <div className="ass-main">
                <h3>
                  AI Readiness Assessment{' '}
                  <span className="sub">
                    Stakeholder interviews · system inventory · scorecard ·
                    sovereignty audit · 12-mo roadmap + TCO
                  </span>
                </h3>
                <div className="price-row">
                  <span className="big">{ASSESSMENT.priceLow}</span>
                  <span className="dash">—</span>
                  <span className="big">{ASSESSMENT.priceHigh}</span>
                  <span className="per">total · fixed-fee</span>
                  <span className="tag">{ASSESSMENT.duration}</span>
                </div>
                <ul>
                  <li>
                    Scope confirmed on the 20-minute discovery call before
                    contract signature
                  </li>
                  <li>
                    Single-PoC engagement — the AI engineer running it is the
                    one who scoped it
                  </li>
                  <li>
                    Output: a roadmap + TCO + vendor matrix you can actually
                    take to your board
                  </li>
                  <li>Refunded against any Build engagement signed within 90 days</li>
                  <li>
                    If we don&apos;t think AI fits your business, we&apos;ll
                    tell you on the call — and bill nothing
                  </li>
                </ul>
                <div className="footer-row">
                  <span>Recommended next step · book the discovery call</span>
                  <a
                    className="btn primary sm"
                    href="mailto:hello@firmcraft.ai?subject=Assessment"
                  >
                    Book it <span className="arr">→</span>
                  </a>
                </div>
              </div>

              <div className="ass-side">
                <div className="ass-card-side">
                  <div className="pq">Why the range</div>
                  <h4>$4.5k → $8.5k</h4>
                  <p>
                    The variance is mostly headcount and ERP complexity. A
                    60-person shop on a clean BC install lands at the bottom.
                    A 400-person multi-entity NetSuite shop with three sidecar
                    systems lands at the top. We quote inside the range after
                    the discovery call.
                  </p>
                </div>
                <div className="ass-card-side">
                  <div className="pq">What it&apos;s not</div>
                  <h4>Not a sales motion.</h4>
                  <p>
                    The Assessment is a real engagement, billed and delivered
                    as such. We don&apos;t do &ldquo;free strategy
                    sessions&rdquo; — they&apos;re priced to convert, and they
                    show. Our pre-sale call is twenty minutes and unfussy.
                  </p>
                </div>
                <div className="ass-card-side">
                  <div className="pq">Refund mechanics</div>
                  <h4>100% credited against Build.</h4>
                  <p>
                    If you sign any Build engagement within 90 days of
                    receiving the Assessment, the full fee is credited against
                    it. The roadmap is yours either way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUILD */}
        <section className="sec" id="build" data-screen-label="05 Build">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">Services · 02 · Implementation</div>
              <h2>
                Four named Build packages.{' '}
                <em>Fixed-fee, fixed-scope, dated delivery.</em>
              </h2>
              <p>
                Each package anchors on the Foundation — managed Hermes,
                retrieval, the messaging gateway, observability, and team
                training. The three vertical packages stack on top. Ranges
                below are based on scope tier from the Assessment.
              </p>
            </div>

            <div className="build-table">
              <div className="row hd">
                <div>Package</div>
                <div>Duration</div>
                <div>Fixed-fee range</div>
                <div>Primary outcome</div>
              </div>

              {BUILD_PACKAGES.map((pkg) => (
                <div className="row" key={pkg.key}>
                  <div className="pkg">
                    <div className="nm">
                      {pkg.name}
                      <em>{pkg.nameEm}</em>
                    </div>
                    <p>{pkg.blurb}</p>
                  </div>
                  <div className="dur">{pkg.duration}</div>
                  <div className="pr">
                    {pkg.priceLow}{' '}
                    <span style={{ color: 'var(--color-muted)', fontWeight: 300 }}>
                      –
                    </span>{' '}
                    {pkg.priceHigh}
                    <span className="sm">
                      {pkg.priceNote ?? 'Single-instance · 1 dept'}
                    </span>
                  </div>
                  <div className="out">{pkg.outcome}</div>
                </div>
              ))}

              <div className="row foot">
                <div>Hermes hosting passed through at cost</div>
                <div>$1.5k – $8k / mo</div>
                <div>Hourly out-of-scope</div>
                <div>$200 – $350 / hr (rolesheet on request)</div>
              </div>
            </div>
          </div>
        </section>

        {/* OPERATE */}
        <section className="sec surface-2" id="operate" data-screen-label="06 Operate">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">Services · 03 · Ongoing operations</div>
              <h2>
                Managed AI retainers.{' '}
                <em>Eval, regression, new workflows, embedded depth.</em>
              </h2>
              <p>
                Three tiers, scoped by hours and embedded depth. Most Build
                clients land on Standard. Embedded fractional AI lead at
                Comprehensive.
              </p>
            </div>

            <div className="op-tiers">
              {OPERATE_TIERS.map((tier) => (
                <article
                  className={`op-tier${tier.featured ? ' feat' : ''}`}
                  key={tier.tier}
                >
                  {tier.featured && (
                    <span className="feat-badge">Most chosen</span>
                  )}
                  <div className="tier">{tier.tier}</div>
                  <h3>{tier.name}</h3>
                  <div className="pricing">
                    <span className="big">{tier.priceLow}</span>
                    <span className="dash">–</span>
                    <span className="big">{tier.priceHigh}</span>
                    <span className="per">/ month</span>
                  </div>
                  <div className="scope">{tier.scope}</div>
                  <ul>
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* EXTRAS / line items */}
        <section className="sec" id="extras" data-screen-label="07 Extras">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">Line items</div>
              <h2>
                The numbers most firms hide. <em>We just publish them.</em>
              </h2>
            </div>
            <div className="extras-grid">
              <div className="extra">
                <div className="k">Out-of-scope</div>
                <h4>
                  Hourly rate<span className="pr">$200 – $350 / hr</span>
                </h4>
                <p>
                  Rolesheet on request. Junior engineer at the bottom, founder
                  rate at the top. Out-of-scope work is logged, capped per
                  sprint, and approved before billed.
                </p>
              </div>
              <div className="extra">
                <div className="k">Infrastructure</div>
                <h4>
                  Hermes hosting<span className="pr">$1.5k – $8k / mo</span>
                </h4>
                <p>
                  Passed through at cost. Range covers single-tenant VPC at
                  the bottom up to multi-region high-availability at the top.
                  We don&apos;t markup infrastructure.
                </p>
              </div>
              <div className="extra">
                <div className="k">Advisory</div>
                <h4>
                  Fractional AI lead<span className="pr">Custom retainer</span>
                </h4>
                <p>
                  Pre-Build or post-Build engagement — strategy and oversight
                  only, no implementation. Usually 2–4 days per month. Scoped
                  on the call.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="sec surface-2" id="faq" data-screen-label="08 FAQ">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">Pricing FAQ</div>
              <h2>
                What buyers ask <em>before they sign.</em>
              </h2>
            </div>
            <div className="faq">
              <div className="q">
                <h4>Which track is right for me?</h4>
                <p>
                  If 10 or fewer people will work with the agent and
                  you&apos;re happy with the standard workflows, the
                  Operator is exactly the product you want. If you
                  need ERP-deep integration, a multi-department
                  rollout, or anything custom, that&apos;s a Services
                  engagement.
                </p>
              </div>
              <div className="q">
                <h4>Can I start on Operator and graduate to Services?</h4>
                <p>
                  Yes — that&apos;s the bridge. Every Operator client
                  can move into a scoped Build whenever the workflows
                  get heavy enough to need it. Same engineer, same
                  Hermes substrate, no rebuild.
                </p>
              </div>
              <div className="q">
                <h4>Why fixed-fee instead of T&amp;M?</h4>
                <p>
                  Time-and-materials makes the buyer the project manager.
                  We&apos;re paid to estimate scope correctly, not to bill
                  until we get it right. Fixed-fee aligns us with shipping.
                </p>
              </div>
              <div className="q">
                <h4>What if scope changes mid-Build?</h4>
                <p>
                  Change requests are scoped and quoted at the hourly rate
                  before any work happens. We don&apos;t do quiet scope creep
                  — and we don&apos;t burn through buffer at the end.
                </p>
              </div>
              <div className="q">
                <h4>Do you white-label / sub for other firms?</h4>
                <p>
                  Selectively. Usually for ERP or accounting firms whose
                  clients are asking for AI and who don&apos;t want to staff
                  it. Ask on the call.
                </p>
              </div>
              <div className="q">
                <h4>Do you have minimums?</h4>
                <p>
                  The Build minimum is Foundation ($25k). The Operator
                  starts at $399/mo. The Assessment is the only
                  &ldquo;small&rdquo; Services entry point — and it
                  pays for itself when it kills the wrong project.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          className="sec"
          style={{ borderBottom: 'none' }}
          data-screen-label="09 CTA"
        >
          <div className="wrap">
            <div
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-line)',
                borderRadius: '22px',
                padding: '48px 56px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="eyebrow">Start here</div>
                <h2
                  style={{
                    margin: '10px 0 14px',
                    fontWeight: 600,
                    fontSize: 'clamp(24px,2.8vw,34px)',
                    letterSpacing: '-.02em',
                    lineHeight: 1.1,
                    maxWidth: '560px',
                  }}
                >
                  A twenty-minute call, the right track,{' '}
                  <em
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      color: 'var(--color-signal)',
                      letterSpacing: '-.018em',
                    }}
                  >
                    and a price on the table.
                  </em>
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14.5px',
                    color: 'var(--color-ink-2)',
                    lineHeight: 1.6,
                    maxWidth: '560px',
                  }}
                >
                  If we&apos;re not a fit, we&apos;ll tell you on the call and
                  bill nothing.
                </p>
              </div>
              <a
                className="btn primary lg"
                href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Assessment"
              >
                Book the call <span className="arr">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
