import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './home.css'

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />

      <main>
        {/* ============ HERO ============ */}
        <section className="home-hero" data-screen-label="01 Hero">
          <div className="wrap">
            <div className="hero-grid">
              <div className="lhs">
                <h1>
                  Big consulting firms <span className="neg">won&apos;t touch you.</span>
                  <br />
                  AI agencies <span className="neg">can&apos;t read your chart&nbsp;of&nbsp;accounts.</span>
                  <br />
                  <em>You need both.</em>
                </h1>
                <p className="lede">
                  Firmcraft is an AI implementation, integration, and enablement firm for finance- and operations-driven SMBs running ERPs — built on a sovereign, open-source LLM foundation so your data never leaves your walls.
                </p>
                <div className="hero-ctas">
                  <a className="btn primary lg" href="/pricing#assess">
                    Book an Assessment <span className="arr">→</span>
                  </a>
                  <a className="btn ghost lg" href="/services">
                    See services
                  </a>
                </div>
                <div className="hero-signals">
                  <span>CPA-credentialed</span>
                  <span>Microsoft BC · NetSuite · Acumatica</span>
                  <span>Sovereign by default</span>
                  <span>Process-first, not tool-first</span>
                </div>
              </div>

              {/* HERO RHS: assessment scorecard */}
              <aside className="scorecard" aria-label="Sample AI readiness scorecard">
                <div className="sc-bar">
                  <span className="lab">
                    Engagement <b>FC-A-2614 · Midwest Mfg.</b>
                  </span>
                  <span className="stamp">Assessment · wk 2</span>
                </div>
                <div className="sc-body">
                  <div className="sc-summary">
                    <div className="m">
                      <div className="k">Use cases</div>
                      <div className="v">
                        18<span className="unit">scored</span>
                      </div>
                    </div>
                    <div className="m">
                      <div className="k">Greenlit</div>
                      <div className="v signal">7</div>
                    </div>
                    <div className="m">
                      <div className="k">12-mo TCO</div>
                      <div className="v operator">$284k</div>
                    </div>
                  </div>
                  <div className="sc-table">
                    <div className="row hd">
                      <span>Use case</span>
                      <span>Feasibility</span>
                      <span>ROI</span>
                      <span>Sovereign fit</span>
                    </div>
                    <div className="row">
                      <span className="nm">AP invoice triage</span>
                      <span>
                        <span className="pill h">High</span>
                      </span>
                      <span>
                        <span className="pill h">High</span>
                      </span>
                      <span>
                        <span className="pill fit">On-prem</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="nm">Work-order draft</span>
                      <span>
                        <span className="pill h">High</span>
                      </span>
                      <span>
                        <span className="pill m">Med</span>
                      </span>
                      <span>
                        <span className="pill fit">On-prem</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="nm">Customer voice agent</span>
                      <span>
                        <span className="pill m">Med</span>
                      </span>
                      <span>
                        <span className="pill h">High</span>
                      </span>
                      <span>
                        <span className="pill fit warn">Hybrid</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="nm">Month-end commentary</span>
                      <span>
                        <span className="pill l">Low</span>
                      </span>
                      <span>
                        <span className="pill m">Med</span>
                      </span>
                      <span>
                        <span className="pill fit">On-prem</span>
                      </span>
                    </div>
                  </div>
                  <div className="sc-foot">
                    <span>Deliverables · 12-mo roadmap · TCO model · vendor matrix</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ============ FUNNEL: Assess → Build → Operate ============ */}
        <section className="sec" data-screen-label="02 Funnel">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">01 · The practice</div>
                <h2>
                  Three phases. <em className="em-italic">One operator.</em>
                </h2>
              </div>
              <p>
                Most firms sell you one of these and leave you to figure out the other two. We run the whole funnel — and the same engineer who scoped your roadmap is the one who&apos;ll be on the standup six months in.
              </p>
            </div>

            <div className="funnel">
              <article className="stage assess">
                <div className="num">
                  <span>Phase 01 · Assess</span>
                  <span className="ar">→</span>
                </div>
                <h3>
                  AI Readiness <em>Assessment</em>
                </h3>
                <p className="desc">
                  A fixed-fee diagnostic that ends with a roadmap you can actually fund — not a slide deck.
                </p>
                <ul>
                  <li>Stakeholder interviews &amp; system inventory</li>
                  <li>Use-case prioritization scorecard</li>
                  <li>Data, integration &amp; sovereignty audit</li>
                  <li>12-month roadmap + TCO model</li>
                </ul>
                <div className="foot">
                  <span className="meta">2–3 weeks · fixed-fee</span>
                  <a className="go" href="/services#assess">
                    Details →
                  </a>
                </div>
              </article>

              <article className="stage build">
                <div className="num">
                  <span>Phase 02 · Build</span>
                  <span className="ar">→</span>
                </div>
                <h3>
                  Implementation <em>packages</em>
                </h3>
                <p className="desc">
                  Four named builds, each anchored on Hermes — our sovereign LLM foundation — and wired through your ERP.
                </p>
                <ul>
                  <li>Foundation — managed Hermes + RAG + gateway</li>
                  <li>Finance — Vic.ai / Stampli + AP/AR workflows</li>
                  <li>Operations — n8n agents + asset/maintenance</li>
                  <li>Voice + Support — Retell / Vapi + helpdesk</li>
                </ul>
                <div className="foot">
                  <span className="meta">6–16 weeks · fixed-fee</span>
                  <a className="go" href="/services#build">
                    Details →
                  </a>
                </div>
              </article>

              <article className="stage operate">
                <div className="num">
                  <span>Phase 03 · Operate</span>
                  <span className="ar">●</span>
                </div>
                <h3>
                  Managed AI <em>Operations</em>
                </h3>
                <p className="desc">
                  Eval, regression, prompt tuning, new workflows. The recurring engine that keeps the system honest.
                </p>
                <ul>
                  <li>Essential — model monitoring &amp; tuning</li>
                  <li>Standard — 1–2 new workflows / quarter</li>
                  <li>Comprehensive — embedded fractional AI lead</li>
                  <li>Self-serve Managed Operator plans</li>
                </ul>
                <div className="foot">
                  <span className="meta">Monthly retainer</span>
                  <a className="go" href="/services#operate">
                    Details →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ DIFFERENTIATORS ============ */}
        <section className="sec surface-2" data-screen-label="03 Differentiators">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">02 · Why Firmcraft</div>
                <h2>
                  Four things <em className="em-italic">most AI shops</em> can&apos;t say.
                </h2>
              </div>
              <p>
                The differentiation isn&apos;t the model. It&apos;s the credential, the posture, the method, and the engagement model. We picked each one deliberately, and we&apos;ll defend each one in a procurement room.
              </p>
            </div>

            <div className="diff-grid">
              <div className="diff">
                <div className="sigil">
                  <svg viewBox="0 0 32 32">
                    <path d="M4 26 L4 9 L16 4 L28 9 L28 26" />
                    <path d="M10 26 L10 16 L22 16 L22 26" />
                    <path d="M14 22 L18 22" />
                  </svg>
                </div>
                <div>
                  <h3>
                    CPA + ERP <span className="hi">credential.</span>
                  </h3>
                  <p>
                    Doyle is a CPA and a working Microsoft Business Central consultant. He can debate revenue recognition with your controller, then go build the eval harness.
                  </p>
                  <div className="meta">Business Central · NetSuite · Acumatica</div>
                </div>
              </div>

              <div className="diff warm">
                <div className="sigil">
                  <svg viewBox="0 0 32 32">
                    <rect x="5" y="11" width="22" height="14" rx="2.5" />
                    <path d="M9 11 V8 a7 7 0 0 1 14 0 v3" />
                    <circle cx="16" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h3>
                    Sovereign by <span className="hi">default.</span>
                  </h3>
                  <p>
                    Hermes is our open-source LLM foundation. Customer data never leaves the customer&apos;s walls — and we&apos;ll write that into the contract, not the marketing page.
                  </p>
                  <div className="meta">Open-source · On-prem / VPC · Audit-logged</div>
                </div>
              </div>

              <div className="diff">
                <div className="sigil">
                  <svg viewBox="0 0 32 32">
                    <path d="M4 20 L10 14 L16 18 L22 10 L28 14" />
                    <circle cx="10" cy="14" r="1.6" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="18" r="1.6" fill="currentColor" stroke="none" />
                    <circle cx="22" cy="10" r="1.6" fill="currentColor" stroke="none" />
                    <path d="M4 26 L28 26" />
                  </svg>
                </div>
                <div>
                  <h3>
                    Process-first, <span className="hi">not tool-first.</span>
                  </h3>
                  <p>
                    We map the workflow before we pick the vendor. Half our assessments end with us telling the buyer they don&apos;t need an AI — they need three Power Automate flows and a clean COA.
                  </p>
                  <div className="meta">Discovery → fit-gap → configure → train → hypercare</div>
                </div>
              </div>

              <div className="diff">
                <div className="sigil">
                  <svg viewBox="0 0 32 32">
                    <circle cx="11" cy="13" r="4" />
                    <path d="M3 26 a8 8 0 0 1 16 0" />
                    <circle cx="22" cy="11" r="3" />
                    <path d="M17 22 a6 6 0 0 1 12 0" />
                  </svg>
                </div>
                <div>
                  <h3>
                    Fractional <span className="hi">AI head.</span>
                  </h3>
                  <p>
                    Most SMBs don&apos;t need a full-time Director of AI. They need one a few days a month — same person across discovery, build, and steady-state. That&apos;s the engagement model.
                  </p>
                  <div className="meta">Retained · Embedded · Continuous roadmap</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ ICP ============ */}
        <section className="sec" data-screen-label="04 ICP">
          <div className="wrap">
            <div className="icp">
              <div className="lhs">
                <div className="eyebrow">03 · Who it&apos;s for</div>
                <h2>
                  Mid-market shops <em>running real ERPs</em> — and quietly drowning in spreadsheets.
                </h2>
                <p>
                  If you have a controller, a Director of Ops, and a chart of accounts that hasn&apos;t been cleaned in four years, you&apos;re our customer. If your AI plan today is a paid ChatGPT seat and a hope, we can fix that in a quarter.
                </p>
                <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                  Not a fit: pre-revenue startups, agencies, and anyone whose answer to <i>&ldquo;where does your AR data live?&rdquo;</i> is <i>&ldquo;a Notion page.&rdquo;</i>
                </p>
              </div>
              <div className="icp-spec">
                <div className="r">
                  <span className="k">Revenue</span>
                  <span className="v">
                    $10M – $500M
                    <span className="sub">Lower mid-market is our hot zone</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Headcount</span>
                  <span className="v">50 – 1,500 employees</span>
                </div>
                <div className="r">
                  <span className="k">ERP in place</span>
                  <span className="v">
                    BC · NetSuite · Acumatica · Sage
                    <span className="sub">Or actively replatforming</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Org gravity</span>
                  <span className="v">
                    Finance- or operations-led
                    <span className="sub">CFO, Controller, COO, Director of FP&amp;A</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Pain</span>
                  <span className="v">Process drag · headcount cap · audit risk</span>
                </div>
                <div className="r">
                  <span className="k">AI maturity</span>
                  <span className="v">Pilots without scale · or none at all</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MANAGED AI BLOCK ============ */}
        <section
          className="sec"
          data-screen-label="05 Managed AI"
          style={{ borderBottom: 'none', paddingBottom: 0 }}
        >
          <div className="wrap">
            <div className="mai-block">
              <div>
                <div className="eyebrow">04 · Managed AI</div>
                <h2>
                  Every Build engagement ships with <em>a managed Hermes foundation.</em>
                </h2>
                <p>
                  If you&apos;d rather start small — sovereign AI in your team chat, on a flat monthly rate, with the same operator that powers our enterprise builds — Managed AI is the entry point. Spark / Flow / Scale from $399.
                </p>
                <div className="links">
                  <a className="btn primary" href="/managed-ai">
                    Explore Managed AI <span className="arr">→</span>
                  </a>
                  <a className="see" href="/pricing#operator">
                    See plans · $399–$1,499/mo →
                  </a>
                </div>
              </div>
              <div className="mai-vis">
                <div className="head">
                  <b>operator.run · live</b>
                  <span className="ok">● running</span>
                </div>
                <div className="row">
                  <span>10:42:14</span>
                  <span className="nm">
                    <em>operator.dispatch</em> · ap.triage
                  </span>
                  <span className="pill-r ok">218ms</span>
                </div>
                <div className="row">
                  <span>10:42:09</span>
                  <span className="nm">
                    <em>workflow</em> · contract.draft
                  </span>
                  <span className="pill-r run">running</span>
                </div>
                <div className="row">
                  <span>10:41:51</span>
                  <span className="nm">
                    <em>tool</em> · BC.invoice.post
                  </span>
                  <span className="pill-r ok">ok</span>
                </div>
                <div className="row">
                  <span>10:41:32</span>
                  <span className="nm">
                    <em>review</em> · claim.submit
                  </span>
                  <span className="pill-r held">human</span>
                </div>
                <div className="row">
                  <span>10:41:08</span>
                  <span className="nm">
                    <em>cron</em> · followup.batch
                  </span>
                  <span className="pill-r ok">ok · 14</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="sec" id="book" data-screen-label="06 CTA">
          <div className="wrap">
            <div className="final-cta">
              <div>
                <div className="eyebrow">05 · Start here</div>
                <h2>
                  Twenty minutes on a call. <em>A funded roadmap by month&apos;s end.</em>
                </h2>
                <p>
                  Every engagement starts with the Assessment. Fixed-fee, two to three weeks, scoped on the discovery call. If we don&apos;t think AI fits your business, we&apos;ll tell you on the call — and bill nothing.
                </p>
                <div className="hero-ctas">
                  <a
                    className="btn primary lg"
                    href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Assessment"
                  >
                    Book the discovery call <span className="arr">→</span>
                  </a>
                  <a className="btn ghost lg" href="/methodology">
                    How we work
                  </a>
                </div>
              </div>
              <aside className="ass-card">
                <div className="head">
                  <div className="ttl">
                    AI Readiness Assessment{' '}
                    <span className="sub">The fixed-fee front door to the practice.</span>
                  </div>
                  <div className="pr">
                    <span className="lab">Fixed fee</span>2–3 weeks
                  </div>
                </div>
                <ul>
                  <li>Stakeholder interviews &amp; system inventory across finance and ops</li>
                  <li>Use-case prioritization scorecard — feasibility × ROI × sovereign fit</li>
                  <li>Data audit + integration map for your ERP &amp; surrounding stack</li>
                  <li>12-month AI roadmap with sequenced TCO model and vendor matrix</li>
                  <li>Recommended Build package (or &ldquo;don&apos;t build yet, here&apos;s why&rdquo;)</li>
                </ul>
                <div className="foot">
                  <span>Deliverable · funded plan</span>
                  <span>Refundable against any Build engagement</span>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
