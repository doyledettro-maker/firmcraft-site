import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { serviceJsonLd } from '@/lib/structured-data'
import './services.css'

export const metadata: Metadata = {
  title: 'AI Consulting Services — Assessment, Implementation, Managed AI',
  description:
    'AI consulting for small and mid-sized businesses: readiness assessment, implementation, ERP integration, managed operations, and advisory support.',
  alternates: { canonical: '/services' },
}

const SERVICES_JSONLD = [
  serviceJsonLd({
    name: 'AI Readiness Assessment',
    serviceType: 'AI consulting',
    url: '/services#assess',
    description:
      'Stakeholder interviews, system inventory, use-case prioritization, data and integration audit, and a twelve-month AI roadmap with a total cost model.',
  }),
  serviceJsonLd({
    name: 'AI Implementation',
    serviceType: 'AI implementation',
    url: '/services#build',
    description:
      'Client-owned AI infrastructure, retrieval, messaging workflows, ERP integration, and workflow automation across finance, operations, voice, and support processes.',
  }),
  serviceJsonLd({
    name: 'Managed AI Operations',
    serviceType: 'Managed AI services',
    url: '/services#operate',
    description:
      'Ongoing model monitoring, regression review, workflow maintenance, roadmap updates, and executive support after implementation.',
  }),
  serviceJsonLd({
    name: 'Fractional AI Advisory',
    serviceType: 'AI strategy consulting',
    url: '/services#advisory',
    description:
      'Strategy, vendor review, governance, roadmap ownership, and executive-level AI advisory for companies that need senior guidance.',
  }),
]

const CAPABILITIES = [
  {
    title: 'Foundational setup',
    body:
      'Firmcraft establishes the operating foundation for AI work: client-owned infrastructure where appropriate, retrieval against company materials, messaging workflows, evaluation practices, and team enablement.',
    outcomes: [
      'Client-controlled AI environment',
      'Retrieval indexed against contracts, procedures, and knowledge bases',
      'Training on prompts, review patterns, and guardrails',
    ],
  },
  {
    title: 'Finance operations',
    body:
      "Accounts payable and receivable workflow, document handling, month-end support, reconciliation review, and audit-ready trails integrated with the client's existing ERP.",
    outcomes: [
      'Invoice intake, coding, and review support',
      'Month-end commentary drafts and anomaly flagging',
      'Audit trail for model-assisted transactions',
    ],
  },
  {
    title: 'Operations and asset workflows',
    body:
      'Workflow automation across asset, maintenance, field operations, dispatch, and work-order processes, connected to the systems already used by the operating team.',
    outcomes: [
      'Work-order drafting, dispatch, and follow-up',
      'Asset and maintenance scheduling support',
      'Field-to-ERP workflow closure',
    ],
  },
  {
    title: 'Voice and support operations',
    body:
      'Customer-facing voice, chat, scheduling, support triage, and handoff workflows, with human review points where the process or risk profile requires them.',
    outcomes: [
      'Inbound voice triage, scheduling, and qualification',
      'Chat workflows across web, helpdesk, and team channels',
      'Preserved handoffs into CRM and support systems',
    ],
  },
]

export default function ServicesPage() {
  return (
    <>
      {SERVICES_JSONLD.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <SiteHeader current="services" />
      <main>
        <section className="page-hero" data-screen-label="01 Services hero">
          <div className="wrap">
            <div className="eyebrow">Services</div>
            <h1>
              AI advisory, implementation, and managed operations for finance- and operations-led
              companies.
            </h1>
            <p className="lede">
              Firmcraft helps companies assess where AI belongs, implement the systems that are
              worth building, and support those systems as the technology and business change. The
              work is led by the same principal from assessment through ongoing support.
            </p>

            <nav className="ribbon" aria-label="Service areas">
              <a className="ribbon-cell" href="#assess">
                <div className="k">
                  <span>Assess</span>
                  <span className="ar">→</span>
                </div>
                <div className="nm">AI Readiness Assessment</div>
                <div className="meta">Roadmap, system inventory, and TCO model</div>
              </a>
              <a className="ribbon-cell" href="#build">
                <div className="k">
                  <span>Implement</span>
                  <span className="ar">→</span>
                </div>
                <div className="nm">AI Implementation</div>
                <div className="meta">Infrastructure, ERP integration, and workflows</div>
              </a>
              <a className="ribbon-cell" href="#operate">
                <div className="k">
                  <span>Support</span>
                  <span className="ar">●</span>
                </div>
                <div className="nm">Managed AI Operations</div>
                <div className="meta">Monitoring, maintenance, and roadmap support</div>
              </a>
            </nav>
          </div>
        </section>

        <section className="sec" id="assess" data-screen-label="02 Assess">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Assess</div>
              <h2>AI Readiness Assessment</h2>
              <p>
                The assessment defines where AI belongs in the company, where it does not, and what
                has to be true before implementation work should begin. The output is a prioritized
                roadmap, a total cost model, and a set of decisions that executives can fund.
              </p>
            </div>

            <div className="assess-grid">
              <div className="assess-card">
                <h3>What the assessment covers</h3>
                <p>
                  Firmcraft works with finance, operations, IT, and ERP owners to map the current
                  system landscape, score candidate workflows, and separate useful AI opportunities
                  from work the existing systems should already handle.
                </p>
              </div>

              <ul className="deliv-list">
                <li>
                  <span className="ix">01</span>
                  <div className="body">
                    <h4>Stakeholder interviews and system inventory</h4>
                    <p>
                      Interviews with finance, operations, IT, and system administrators, paired
                      with a map of the applications, workflows, and data paths already in place.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">02</span>
                  <div className="body">
                    <h4>Use-case prioritization scorecard</h4>
                    <p>
                      Candidate workflows are scored on feasibility, business value, risk, and fit
                      with the company&apos;s data and systems.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">03</span>
                  <div className="body">
                    <h4>Data and integration audit</h4>
                    <p>
                      The assessment identifies clean data sources, weak integration points, manual
                      handoffs, and system gaps that must be addressed before automation is useful.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="ix">04</span>
                  <div className="body">
                    <h4>Roadmap and total cost model</h4>
                    <p>
                      The final plan sequences the work, identifies required ownership, and
                      describes the infrastructure, labor, and operating support needed over time.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="build-section" id="build" data-screen-label="03 Build">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Implement</div>
              <h2>AI Implementation</h2>
              <p>
                Implementation work is organized around capability areas rather than productized
                offers. Firmcraft builds the workflows that survive the assessment, connects them
                to the client&apos;s existing ERP and operating systems, and trains the people who
                will use or supervise them.
              </p>
            </div>

            <div className="build-grid">
              {CAPABILITIES.map((capability) => (
                <article className="build-pkg" key={capability.title}>
                  <div className="top">
                    <div>
                      <h3>{capability.title}</h3>
                    </div>
                  </div>
                  <p className="desc">{capability.body}</p>
                  <ul className="outcomes">
                    {capability.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="operate" data-screen-label="04 Operate">
          <div className="wrap">
            <div className="pkg-head">
              <div className="eyebrow">Support</div>
              <h2>Managed AI Operations</h2>
              <p>
                AI systems require ownership after launch. Firmcraft monitors model behavior,
                reviews regressions, maintains workflows, updates runbooks, and helps leadership
                decide when to improve, retire, or replace parts of the system.
              </p>
            </div>

            <div className="op-tiers">
              <article className="op-tier">
                <h3>Monitoring and regression review</h3>
                <p className="desc">
                  Routine review of model performance, evaluation results, failure modes, and
                  workflow reliability.
                </p>
              </article>

              <article className="op-tier feat">
                <h3>Workflow maintenance</h3>
                <p className="desc">
                  Updates to prompts, tools, integrations, documentation, and approval paths as
                  business processes change.
                </p>
              </article>

              <article className="op-tier">
                <h3>Executive roadmap support</h3>
                <p className="desc">
                  Ongoing prioritization, vendor review, governance, and budget support as the AI
                  landscape changes.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec" id="advisory" data-screen-label="05 Advisory">
          <div className="wrap">
            <div className="adv-block">
              <div>
                <div className="eyebrow" style={{ color: '#FFB99B' }}>
                  Advisory
                </div>
                <h2>Fractional AI Advisory</h2>
                <p>
                  Some companies need senior AI judgment before they need a build. Firmcraft can
                  support leadership with roadmap ownership, vendor review, governance, and
                  implementation oversight.
                </p>
                <a className="btn primary" href="/contact">
                  Contact Firmcraft <span className="arr">→</span>
                </a>
              </div>
              <div className="adv-spec">
                <div className="r">
                  <div className="k">Scope</div>
                  <div className="v">Strategy, governance, and oversight</div>
                </div>
                <div className="r">
                  <div className="k">Right for</div>
                  <div className="v">Companies deciding what to keep, buy, build, or retire</div>
                </div>
                <div className="r">
                  <div className="k">Output</div>
                  <div className="v">Decision memos, roadmap updates, and vendor reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" data-screen-label="06 CTA" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start with an assessment.</h2>
              <a className="btn primary lg" href="/contact">
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
