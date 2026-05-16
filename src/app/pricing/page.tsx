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
    'Fixed-fee where it matters, transparent where it does not. Assessment + Build packages + Operate retainers + Spark/Flow/Scale operator plans.',
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
              Fixed-fee where it matters.{' '}
              <em>Transparent where it doesn&apos;t.</em>
            </h1>
            <p className="lede">
              Four ways to engage Firmcraft — the Assessment as the front door,
              four named Build packages, three Operate retainers, and self-serve
              Managed Operator plans. Ranges are real; we publish them because
              we&apos;ve validated them. The only soft number on this page is
              the out-of-scope hourly rate.
            </p>
            <div className="price-toc">
              <a href="#assess">→ Assessment</a>
              <a href="#build">→ Build packages</a>
              <a href="#operate">→ Operate retainers</a>
              <a href="#operator">→ Managed Operator</a>
              <a href="#extras">→ Hourly &amp; hosting</a>
              <a href="#faq">→ FAQ</a>
            </div>
          </div>
        </section>

        {/* ASSESSMENT */}
        <section className="sec" id="assess" data-screen-label="02 Assessment">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">01 · The front door</div>
              <h2>
                AI Readiness Assessment.{' '}
                <em>Fixed-fee, refundable, scoped on the call.</em>
              </h2>
              <p>
                Every Firmcraft engagement starts here. Two to three weeks, a
                CPA-credentialed AI engineer embedded with your finance and ops
                leads, and a board-ready plan at the end. Refundable against
                any subsequent Build engagement.
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
        <section className="sec surface-2" id="build" data-screen-label="03 Build">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">02 · Implementation</div>
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
        <section className="sec" id="operate" data-screen-label="04 Operate">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">03 · Ongoing operations</div>
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

        {/* OPERATOR (self-serve) */}
        <section
          className="sec surface-2"
          id="operator"
          data-screen-label="05 Operator plans"
        >
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">04 · Self-serve · Managed Operator</div>
              <h2>
                Spark, Flow, Scale.{' '}
                <em>Sovereign AI in your team chat from $399/mo.</em>
              </h2>
              <p>
                The self-serve front door. Every Build engagement ships with a
                managed Hermes foundation by default — these plans are for
                businesses that want to start with sovereign AI in their chat
                and grow from there.{' '}
                <a
                  href="/managed-ai"
                  style={{
                    color: 'var(--color-signal)',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Full Managed AI page →
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
          </div>
        </section>

        {/* EXTRAS / line items */}
        <section className="sec" id="extras" data-screen-label="06 Extras">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">05 · Line items</div>
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
        <section className="sec surface-2" id="faq" data-screen-label="07 FAQ">
          <div className="wrap">
            <div className="block-head">
              <div className="eyebrow">06 · Pricing FAQ</div>
              <h2>
                What buyers ask <em>before they sign.</em>
              </h2>
            </div>
            <div className="faq">
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
                <h4>Is Hermes hosting required?</h4>
                <p>
                  For sovereign builds, yes — that&apos;s the whole point. For
                  Voice + Support, some components can sit on frontier models
                  with explicit data-handling terms. The Assessment maps which
                  goes where.
                </p>
              </div>
              <div className="q">
                <h4>What about a Proof-of-Concept?</h4>
                <p>
                  The Assessment is the PoC. It&apos;s faster, cheaper, and
                  produces a board-ready plan instead of a demo that dies in a
                  quarter. We don&apos;t do free PoCs.
                </p>
              </div>
              <div className="q">
                <h4>Do you have minimums?</h4>
                <p>
                  The Build minimum is Foundation ($25k). Managed AI starts at
                  $399/mo. The Assessment is the only &ldquo;small&rdquo;
                  entry point — and it pays for itself when it kills the wrong
                  project.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          className="sec"
          style={{ borderBottom: 'none' }}
          data-screen-label="08 CTA"
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
                  A twenty-minute call, a quoted Assessment,{' '}
                  <em
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      color: 'var(--color-signal)',
                      letterSpacing: '-.018em',
                    }}
                  >
                    and a funded plan in three weeks.
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
