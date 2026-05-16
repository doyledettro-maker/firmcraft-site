import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './services.css'

export const metadata: Metadata = {
  title: 'Services — Firmcraft',
  description:
    'Assess → Build → Operate → Advisory. Four service lines for finance- and operations-driven SMBs running ERPs.',
}

export default function ServicesPage() {
  return (
    <>
      <SiteHeader current="services" />
      <main>
        {/* HERO */}
        <section className="page-hero" data-screen-label="01 Services hero">
          <div className="wrap">
            <div className="eyebrow">Services</div>
            <h1>
              The funnel a finance- or operations-led SMB <em>can actually fund.</em>
            </h1>
            <p className="lede">
              Three phases, four named builds, three retainer tiers. Fixed-fee where it matters, hourly where it
              doesn&rsquo;t, and the same engineer across all of it. Every engagement is anchored on Hermes — our
              sovereign LLM foundation — so your data never leaves your walls.
            </p>

            <nav className="ribbon" aria-label="Service phases">
              <a className="ribbon-cell" href="#assess">
                <div className="k">
                  <span>Phase 01 · Assess</span>
                  <span className="ar">→</span>
                </div>
                <div className="nm">AI Readiness Assessment</div>
                <div className="meta">
                  <b>2–3 weeks</b> · fixed-fee diagnostic + funded roadmap
                </div>
              </a>
              <a className="ribbon-cell" href="#build">
                <div className="k">
                  <span>Phase 02 · Build</span>
                  <span className="ar">→</span>
                </div>
                <div className="nm">Four implementation packages</div>
                <div className="meta">
                  <b>6–16 weeks</b> · Foundation · Finance · Operations · Voice + Support
                </div>
              </a>
              <a className="ribbon-cell" href="#operate">
                <div className="k">
                  <span>Phase 03 · Operate</span>
                  <span className="ar">●</span>
                </div>
                <div className="nm">Managed AI Operations</div>
                <div className="meta">
                  <b>Monthly retainer</b> · eval, regression, new workflows
                </div>
              </a>
            </nav>
          </div>
        </section>

        {/* ASSESS */}
        <section className="sec" id="assess" data-screen-label="02 Assess">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Phase 01 · Assess</div>
              <h2>
                The fixed-fee diagnostic that ends with <em>a funded plan,</em> not a slide deck.
              </h2>
              <p>
                Most AI projects fail in scoping, not engineering. The Assessment is the engineering of scope:
                stakeholder interviews, system inventory, a scorecard that ranks every candidate use case, a sovereignty
                analysis, and a 12-month roadmap with real TCO. We don&rsquo;t sell follow-on work from this; we earn
                it.
              </p>
            </div>

            <div className="assess-grid">
              <div className="assess-card">
                <h3>AI Readiness Assessment</h3>
                <p>
                  The standard engagement — a CPA-credentialed AI engineer embedded with your finance and ops leads for
                  two to three weeks. Output is a board-ready plan you can actually fund.
                </p>
                <div className="meta-row">
                  <div className="m">
                    <div className="k">Duration</div>
                    <div className="v">2–3 weeks</div>
                  </div>
                  <div className="m">
                    <div className="k">Format</div>
                    <div className="v">Fixed-fee</div>
                  </div>
                  <div className="m">
                    <div className="k">Refund</div>
                    <div className="v signal">100%</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '-4px' }}>
                  Refundable against any subsequent Build engagement. If we don&rsquo;t think AI fits — we&rsquo;ll say
                  so and bill nothing.
                </p>
              </div>

              <ul className="deliv-list">
                <li>
                  <span className="ix">01</span>
                  <div className="body">
                    <h4>Stakeholder interviews &amp; system inventory</h4>
                    <p>
                      1:1s with finance, ops, IT and ERP admins; a complete map of what&rsquo;s running, what it costs,
                      and what it doesn&rsquo;t do.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">02</span>
                  <div className="body">
                    <h4>Use-case prioritization scorecard</h4>
                    <p>
                      Every candidate workflow scored on feasibility × ROI × sovereign fit. Greenlit, deferred, killed —
                      with reasons.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">03</span>
                  <div className="body">
                    <h4>Data &amp; integration audit</h4>
                    <p>
                      What&rsquo;s clean, what&rsquo;s a graveyard, where the joins fail, and which integrations need to
                      be built before any model goes in.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">04</span>
                  <div className="body">
                    <h4>Sovereignty analysis</h4>
                    <p>
                      What can run on-prem on Hermes; what&rsquo;s safe to send to a frontier model; what your contracts
                      and your compliance team will sign.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">05</span>
                  <div className="body">
                    <h4>12-month roadmap + TCO model</h4>
                    <p>
                      Sequenced phases, total cost of ownership including infra and labor, and a recommended Build
                      package (or &ldquo;don&rsquo;t build yet, here&rsquo;s why&rdquo;).
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* BUILD */}
        <section className="build-section" id="build" data-screen-label="03 Build">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Phase 02 · Build</div>
              <h2>
                Four implementation packages. <em>Fixed-fee, fixed-scope, dated delivery.</em>
              </h2>
              <p>
                Each Build engagement is anchored on the Foundation — managed Hermes, retrieval, the messaging gateway,
                observability via Langfuse, and team training. The three vertical packages stack on top, integrating
                with the ERP you already run. Hourly out-of-scope rate is the only soft number; everything else is
                contracted.
              </p>
            </div>

            <div className="build-grid">
              <article className="build-pkg">
                <div className="top">
                  <div>
                    <div className="ix">Build · 01</div>
                    <h3>
                      Firmcraft <em>Foundation</em>
                    </h3>
                  </div>
                  <span className="tag">Anchor</span>
                </div>
                <p className="desc">
                  The substrate every other engagement extends. A managed Hermes instance, retrieval pipeline, messaging
                  gateway, evals, and team enablement — sovereign by default.
                </p>
                <div className="stack">
                  <span className="tool">Hermes</span>
                  <span className="tool">RAG</span>
                  <span className="tool">Messaging gateway</span>
                  <span className="tool">Langfuse</span>
                  <span className="tool">Training</span>
                </div>
                <ul className="outcomes">
                  <li>Sovereign LLM running in your VPC or on-prem</li>
                  <li>Retrieval indexed against your contracts, SOPs, and KBs</li>
                  <li>Team trained on prompt patterns and guardrails</li>
                </ul>
                <div className="stats">
                  <div className="s">
                    Duration<b>6–8 weeks</b>
                  </div>
                  <div className="s">
                    Pricing<b>Fixed-fee</b>
                  </div>
                </div>
              </article>

              <article className="build-pkg">
                <div className="top">
                  <div>
                    <div className="ix">Build · 02</div>
                    <h3>
                      Firmcraft <em>Finance</em>
                    </h3>
                  </div>
                  <span className="tag">Most-asked</span>
                </div>
                <p className="desc">
                  Foundation + the AP/AR workflows that eat your controller&rsquo;s week. Vic.ai or Stampli on the
                  inbound side, BC or NetSuite on the outbound, and reconciliation in the middle.
                </p>
                <div className="stack">
                  <span className="tool">+ Foundation</span>
                  <span className="tool">Vic.ai / Stampli</span>
                  <span className="tool">BC / NetSuite</span>
                  <span className="tool">AP/AR workflows</span>
                </div>
                <ul className="outcomes">
                  <li>AP invoice intake, coding, and 3-way match — automated</li>
                  <li>Month-end commentary drafts, GL anomaly flagging</li>
                  <li>Audit-ready trail for every model-touched transaction</li>
                </ul>
                <div className="stats">
                  <div className="s">
                    Duration<b>10–14 weeks</b>
                  </div>
                  <div className="s">
                    Pricing<b>Fixed-fee</b>
                  </div>
                </div>
              </article>

              <article className="build-pkg">
                <div className="top">
                  <div>
                    <div className="ix">Build · 03</div>
                    <h3>
                      Firmcraft <em>Operations</em>
                    </h3>
                  </div>
                  <span className="tag">Heaviest</span>
                </div>
                <p className="desc">
                  Foundation + n8n agent workflows wired into your ERP for asset, maintenance, and field-ops automation.
                  The deepest integration footprint of the four packages.
                </p>
                <div className="stack">
                  <span className="tool">+ Foundation</span>
                  <span className="tool">n8n</span>
                  <span className="tool">ERP integrations</span>
                  <span className="tool">EAM / TAG</span>
                </div>
                <ul className="outcomes">
                  <li>Work-order drafting, dispatch, and follow-up</li>
                  <li>Asset &amp; maintenance scheduling, predictive flagging</li>
                  <li>Field-to-ERP loop closed — no more after-hours data entry</li>
                </ul>
                <div className="stats">
                  <div className="s">
                    Duration<b>12–16 weeks</b>
                  </div>
                  <div className="s">
                    Pricing<b>Fixed-fee</b>
                  </div>
                </div>
              </article>

              <article className="build-pkg">
                <div className="top">
                  <div>
                    <div className="ix">Build · 04</div>
                    <h3>
                      Firmcraft <em>Voice + Support</em>
                    </h3>
                  </div>
                  <span className="tag warm">Customer-facing</span>
                </div>
                <p className="desc">
                  Foundation + a Retell or Vapi voice agent plus chat surfaces (Fin or Hermes) wired into your CRM and
                  helpdesk. The fastest visible-to-customer engagement we run.
                </p>
                <div className="stack">
                  <span className="tool">+ Foundation</span>
                  <span className="tool">Retell / Vapi</span>
                  <span className="tool">Fin / Hermes</span>
                  <span className="tool">CRM / helpdesk</span>
                </div>
                <ul className="outcomes">
                  <li>Inbound voice triage, scheduling, and qualification</li>
                  <li>Chat agent across web, helpdesk, and team channels</li>
                  <li>Handoffs preserved end-to-end into your CRM</li>
                </ul>
                <div className="stats">
                  <div className="s">
                    Duration<b>8–12 weeks</b>
                  </div>
                  <div className="s">
                    Pricing<b>Fixed-fee</b>
                  </div>
                </div>
              </article>
            </div>

            <p
              style={{
                marginTop: '24px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: 'var(--color-muted)',
                letterSpacing: '.06em',
                textAlign: 'center',
              }}
            >
              Hermes hosting passed through at cost · hourly out-of-scope billed at published rate · see{' '}
              <a
                href="/pricing#build"
                style={{ color: 'var(--color-signal)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Pricing
              </a>{' '}
              for ranges.
            </p>
          </div>
        </section>

        {/* OPERATE */}
        <section className="sec" id="operate" data-screen-label="04 Operate">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Phase 03 · Operate</div>
              <h2>
                The retainer that keeps the system <em>honest, current, and growing.</em>
              </h2>
              <p>
                An AI system that ships without operations decays — model drift, prompt rot, integration breakage, and
                the slow accretion of edge cases nobody updated the eval for. Three tiers, scoped by hours and embedded
                depth. Most Build clients land on Standard.
              </p>
            </div>

            <div className="op-tiers">
              <article className="op-tier">
                <div className="ix">Tier 01</div>
                <h3>Essential</h3>
                <span className="scope">5–10 hrs / month</span>
                <p className="desc">
                  The baseline. Keeps your Hermes deployment running, monitored, and audited. Right for businesses with
                  a stable workflow and no roadmap pressure.
                </p>
                <ul>
                  <li>Model monitoring &amp; eval regression</li>
                  <li>Prompt tuning &amp; minor workflow edits</li>
                  <li>Quarterly executive review</li>
                  <li>SLA: 1 business day, business hours</li>
                </ul>
                <div className="foot">
                  <span>Monthly retainer</span>
                  <span>Annual lock</span>
                </div>
              </article>

              <article className="op-tier feat">
                <span className="feat-badge">Most chosen</span>
                <div className="ix">Tier 02</div>
                <h3>Standard</h3>
                <span className="scope">10–25 hrs / month</span>
                <p className="desc">
                  The default after a Build engagement. Active roadmap work, regression management, and a new workflow
                  or two each quarter as the business changes.
                </p>
                <ul>
                  <li>Everything in Essential</li>
                  <li>1–2 new workflows per quarter</li>
                  <li>Eval &amp; regression suite ownership</li>
                  <li>Monthly ops review with finance / ops lead</li>
                  <li>SLA: same-day, business hours</li>
                </ul>
                <div className="foot">
                  <span>Monthly retainer</span>
                  <span>Quarter cancel</span>
                </div>
              </article>

              <article className="op-tier">
                <div className="ix">Tier 03</div>
                <h3>Comprehensive</h3>
                <span className="scope">25+ hrs / month</span>
                <p className="desc">
                  Embedded fractional AI lead. We&rsquo;re in your standups, your roadmap reviews, and your vendor
                  selection calls. Continuous roadmap execution.
                </p>
                <ul>
                  <li>Everything in Standard</li>
                  <li>Embedded fractional AI lead</li>
                  <li>Continuous roadmap execution</li>
                  <li>Vendor &amp; partner negotiation</li>
                  <li>SLA: 4 business hours</li>
                </ul>
                <div className="foot">
                  <span>Monthly retainer</span>
                  <span>Quarter cancel</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ADVISORY */}
        <section className="sec" id="advisory" data-screen-label="05 Advisory">
          <div className="wrap">
            <div className="adv-block">
              <div>
                <div className="eyebrow" style={{ color: '#FFB99B' }}>
                  Adjacency
                </div>
                <h2>
                  Fractional AI <em>Advisory.</em>
                </h2>
                <p>
                  For businesses that aren&rsquo;t ready to build yet, but need a real AI voice in the room. Monthly
                  retainer, no implementation, no agency-style upsell. The model is &ldquo;the Director of AI you
                  can&rsquo;t justify hiring, on a few days a month.&rdquo;
                </p>
                <a className="btn primary" href="mailto:hello@firmcraft.ai?subject=Fractional%20AI%20Advisory">
                  Talk to Doyle <span className="arr">→</span>
                </a>
              </div>
              <div className="adv-spec">
                <div className="r">
                  <div className="k">Cadence</div>
                  <div className="v">
                    Monthly retainer<span className="sub">2–4 days / month</span>
                  </div>
                </div>
                <div className="r">
                  <div className="k">Scope</div>
                  <div className="v">
                    Strategy &amp; oversight<span className="sub">No implementation</span>
                  </div>
                </div>
                <div className="r">
                  <div className="k">Right for</div>
                  <div className="v">
                    Pre-Build buyers<span className="sub">Or post-Build maintainers</span>
                  </div>
                </div>
                <div className="r">
                  <div className="k">Output</div>
                  <div className="v">Decision memos &amp; vendor reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* END CTA */}
        <section className="sec" data-screen-label="06 CTA" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>
                Start where every engagement starts — <em>the Assessment.</em>
              </h2>
              <a className="btn primary lg" href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Assessment">
                Book the discovery call <span className="arr">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
