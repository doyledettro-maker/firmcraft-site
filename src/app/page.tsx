import type { Metadata } from 'next'
import Link from 'next/link'
import { MobileMenu } from '@/components/MobileMenu'
import { SiteFooter } from '@/components/SiteFooter'
import { BookingBar } from '@/components/home/BookingBar'
import { FirmcraftMark } from '@/components/home/FirmcraftMark'
import './home-ledger.css'

/*
 * Homepage, "Ledger" design (Nov 2026).
 *
 * PROPOSED COPY, awaiting Doyle's OK. Two pieces of wording on this page are
 * not approved yet. Each is marked in the JSX below with a PROPOSED COPY
 * comment and in the rendered HTML with data-proposed-copy:
 *   1. The continuity line ("Every system ships with its documentation, its
 *      source and your own admin access, so it never depends on one person."),
 *      used in the private equity list and in the controls list.
 *   2. The four answers under "Questions buyers ask."
 *   3. The founding-client note beside the Diagnostic.
 * Century Dental and Rumble Bee figures were supplied by Doyle (Nov 28, 2026).
 */

export const metadata: Metadata = {
  title: { absolute: 'Firmcraft | AI for mid-size companies running an ERP' },
  description:
    'AI designed, built and run inside your ERP and finance stack for mid-size companies, from a measured baseline, by a principal trained in public accounting with more than twenty years in ERP and finance systems.',
  alternates: { canonical: '/' },
}

// Change this date whenever the homepage copy changes.
const UPDATED = { iso: '2026-11-28', label: 'November 28, 2026' }

const CONTINUITY_SHORT = 'Documentation, source and your own admin access ship with every system.'

const NAV = [
  { label: 'Diagnostic', href: '/diagnostic' },
  { label: 'Services', href: '#services' },
  { label: 'Selected Work', href: '/work' },
  { label: 'Private equity', href: '#pe' },
  { label: 'About', href: '/about' },
]

const MOBILE_NAV = [
  { label: 'The Diagnostic', href: '/diagnostic' },
  { label: 'Services', href: '#services' },
  { label: 'Private equity', href: '#pe' },
  { label: 'Advisory', href: '/advisory' },
  { label: 'How We Work', href: '/how-we-work' },
  { label: 'Selected Work', href: '/work' },
  { label: 'About', href: '/about' },
]

export default function HomePage() {
  return (
    <div className="fl-page">
      <div className="fl-shell">
        <header className="fl-wrap">
          <nav className="fl-nav" aria-label="Primary">
            <Link className="fl-brand" href="/" aria-label="Firmcraft home">
              <FirmcraftMark size={30} />
              <b>Firmcraft</b>
            </Link>
            <div className="fl-nav-r">
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
              <a className="fl-btn fl-primary" href="/diagnostic" data-cta>
                Book a call
              </a>
              <MobileMenu items={MOBILE_NAV} current="home" marketing ctaHref="/diagnostic" ctaLabel="Book a call" />
            </div>
          </nav>
        </header>

        <main>
          <div className="fl-wrap">
            <div className="fl-hero" id="top">
              <div className="fl-hero-copy">
                <span className="fl-label">Mid-size companies running an ERP</span>
                <h1>
                  AI that shows up in the <span className="fl-uline">P&amp;L.</span>
                </h1>
                <p className="fl-lede">
                  For the CFO, controller and leadership team: AI designed, built and run inside
                  your ERP and finance stack, from a measured baseline, by a principal trained in
                  public accounting.
                </p>
                <div className="fl-ctas">
                  <a className="fl-btn fl-primary" href="/diagnostic" data-cta>
                    Book a 30-minute call
                  </a>
                  <a className="fl-btn fl-ghost" href="#diagnostic">
                    See the Diagnostic
                  </a>
                </div>
                <p className="fl-for">
                  For <a href="#doors">CFOs and controllers</a>, <a href="#pe">private equity</a>,
                  and <a href="#doors">owners of smaller businesses</a>.
                </p>
              </div>

              <figure className="fl-face">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/founder/doyle.jpg" alt="Doyle Dettro" width={540} height={676} />
                <figcaption>
                  <b>Doyle Dettro</b>
                  <span>Founder and Principal</span>
                </figcaption>
              </figure>

              <div className="fl-proof" aria-label="Founder record">
                <div className="fl-cell">
                  <span className="fl-num">1997</span>
                  <b>Arthur Andersen</b>
                  <span className="fl-d">Public accounting; passed the CPA examination on the first attempt</span>
                </div>
                <div className="fl-cell">
                  <span className="fl-num">Late 1990s</span>
                  <b>Through an IPO</b>
                  <span className="fl-d">Finance, accounting and analysis at NovaMed</span>
                </div>
                <div className="fl-cell">
                  <span className="fl-num">2007 to 2012</span>
                  <b>Interim global controller</b>
                  <span className="fl-d">SEC reporting for a public parent</span>
                </div>
                <div className="fl-cell">
                  <span className="fl-num">2012 to 2015</span>
                  <b>150-country ERP program</b>
                  <span className="fl-d">Senior finance architect</span>
                </div>
                <div className="fl-cell">
                  <span className="fl-num">20+ years</span>
                  <b>ERP and finance systems</b>
                  <span className="fl-d">From owner-led businesses to multinationals</span>
                </div>
              </div>
            </div>
          </div>

          <section className="fl-block" id="doors" style={{ paddingTop: 8 }}>
            <div className="fl-wrap">
              <div className="fl-block-head">
                <h2>Start where you sit.</h2>
              </div>
              <div className="fl-doors">
                <article className="fl-door">
                  <span className="fl-label">Mid-size companies on an ERP</span>
                  <h3>&ldquo;I need AI I can defend to an auditor.&rdquo;</h3>
                  <p>Automation on your ERP and finance stack, with approvals, logs and a measured baseline.</p>
                  <a className="fl-link" href="#controls">
                    See the controls
                  </a>
                </article>
                <article className="fl-door">
                  <span className="fl-label">PE operating partners</span>
                  <h3>&ldquo;Every portfolio company is doing this differently.&rdquo;</h3>
                  <p>One comparable review of AI cost, exposure and opportunity.</p>
                  <a className="fl-link" href="#pe">
                    See the portfolio review
                  </a>
                </article>
                <article className="fl-door">
                  <span className="fl-label">Owners of smaller businesses</span>
                  <h3>&ldquo;My people are buried in admin.&rdquo;</h3>
                  <p>
                    Quotes, contracts and invoices, handed to an AI agent you run from your phone.
                    Same principal, same measured baseline.
                  </p>
                  <a className="fl-link" href="/diagnostic">
                    Talk about your business
                  </a>
                </article>
              </div>
            </div>
          </section>

          <section className="fl-block" id="diagnostic" style={{ paddingTop: 0 }}>
            <div className="fl-wrap fl-diag">
              <div>
                <span className="fl-label">Every engagement begins here</span>
                <h2>The first step.</h2>
                {/* PROPOSED COPY, awaiting Doyle's OK: founding-client note. No results or prices implied. */}
                <div
                  className="fl-founding"
                  data-proposed-copy="founding-client note, awaiting Doyle's OK"
                >
                  <span className="fl-label">Founding clients</span>
                  <p>
                    Firmcraft is taking on its first mid-size companies running an ERP. Founding
                    clients work directly with the principal, start with the Diagnostic, and help
                    shape how the method is applied to larger finance teams.
                  </p>
                  <a className="fl-link" href="/diagnostic#founding">
                    Ask about a founding-client Diagnostic
                  </a>
                </div>
                <div className="fl-ctas">
                  <a className="fl-btn fl-primary" href="/diagnostic" data-cta>
                    Book a 30-minute call
                  </a>
                </div>
              </div>

              <article
                className="fl-letter"
                aria-label="The AI and Systems Diagnostic, engagement letter"
              >
                <div className="fl-lh">
                  <span className="fl-brand">
                    <FirmcraftMark size={24} />
                    <b>Firmcraft</b>
                  </span>
                  <span className="fl-label">Engagement letter</span>
                </div>
                <div className="fl-re">
                  <span className="fl-label">Re:</span>
                  <h3>The AI and Systems Diagnostic</h3>
                </div>
                <dl className="fl-terms">
                  <div>
                    <dt>Scope</dt>
                    <dd>
                      AI tools and spend across your ERP or the systems you run: what runs, what it
                      costs, and what it actually does.
                    </dd>
                  </div>
                  <div>
                    <dt>Form</dt>
                    <dd>Fixed scope. Ends with a written finding.</dd>
                  </div>
                </dl>
                <div className="fl-deliv-h">
                  <span className="fl-label">Deliverables</span>
                  <span className="fl-label">5</span>
                </div>
                <ol className="fl-deliv">
                  <li>
                    <span className="fl-num">01</span>
                    <span>
                      <b>AI tool and spend inventory</b>
                    </span>
                  </li>
                  <li>
                    <span className="fl-num">02</span>
                    <span>
                      <b>Measured baseline</b> for the processes that matter most
                    </span>
                  </li>
                  <li>
                    <span className="fl-num">03</span>
                    <span>
                      <b>Data exposure and controls review</b>, including what leaves your ERP
                    </span>
                  </li>
                  <li>
                    <span className="fl-num">04</span>
                    <span>
                      <b>Ranked opportunities</b> with expected effect and effort
                    </span>
                  </li>
                  <li>
                    <span className="fl-num">05</span>
                    <span>
                      <b>A plan you can run</b> with Firmcraft, someone else or yourself
                    </span>
                  </li>
                </ol>
                <div className="fl-lead">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/founder/doyle.jpg" alt="" width={58} height={73} />
                  <div>
                    <span className="fl-label">Led by</span>
                    <b>Doyle Dettro</b>
                    <span>Founder and Principal</span>
                  </div>
                </div>
                <div className="fl-sig">
                  <div>
                    <p>If AI is the wrong investment, the finding says so.</p>
                    <span className="fl-label">Firmcraft</span>
                  </div>
                  <div>
                    <p className="fl-next">Begins with a 30-minute call</p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="fl-block" id="results" style={{ paddingTop: 0 }}>
            <div className="fl-wrap">
              <div className="fl-block-head">
                <h2>Results, stated plainly.</h2>
              </div>
              <div className="fl-results">
                <p className="fl-label fl-rgroup">Small-business engagements</p>
                <article className="fl-case">
                  <span className="fl-tag">Field services business</span>
                  <div>
                    <span className="fl-metric">3x</span>
                    <span className="fl-mlab">capacity for revenue work</span>
                  </div>
                  <h3>Rumble Bee Tree Service</h3>
                  <dl className="fl-ba">
                    <div className="fl-b">
                      <dt>Before</dt>
                      <dd>
                        The owner split his week between tree work, paperwork and hand-delivering
                        contracts.
                      </dd>
                    </div>
                    <div className="fl-a">
                      <dt>After</dt>
                      <dd>
                        Quotes, contracts and invoices run electronically through an AI agent on his
                        phone. Capacity for revenue-generating activity tripled.
                      </dd>
                    </div>
                  </dl>
                </article>
                <article className="fl-case">
                  <span className="fl-tag">Dental practice, capability building</span>
                  <div>
                    <span className="fl-metric">$160k</span>
                    <span className="fl-mlab">a year in hiring avoided</span>
                  </div>
                  <h3>Dr. Sarah Carlson, Century Dental of Huntley</h3>
                  <dl className="fl-ba">
                    <div className="fl-b">
                      <dt>Before</dt>
                      <dd>Insurance reimbursement work took up the receptionist and a dental assistant.</dd>
                    </div>
                    <div className="fl-a">
                      <dt>After</dt>
                      <dd>
                        Once Firmcraft introduced practical AI, Dr. Carlson automated it herself. Both
                        staff returned to their core roles, so the practice did not have to hire 2
                        people to fill the gap, about $160k a year. Cash from insurance
                        reimbursements now arrives 20 days sooner.
                      </dd>
                    </div>
                  </dl>
                </article>
                <p className="fl-label fl-rgroup">Built by the founder</p>
                <article className="fl-case fl-feature">
                  <span className="fl-tag">Designed and run as CTO, in a regulated industry</span>
                  <h3>AI-PSM</h3>
                  <p>
                    Agentic AI for refinery process safety: deterministic rules, approval by a
                    qualified person, and a full audit trail.
                  </p>
                  <Link className="fl-link" href="/work">
                    See selected work
                  </Link>
                </article>
              </div>
            </div>
          </section>

          <section className="fl-block" id="services" style={{ paddingTop: 0 }}>
            <div className="fl-wrap">
              <div className="fl-block-head">
                <h2>Four accounts, one principal.</h2>
                <p>The person who scopes the work builds it and stays to run it.</p>
              </div>
              <div className="fl-coa">
                <div className="fl-coa-row">
                  <span className="fl-num">1000</span>
                  <h3>
                    <Link href="/advisory">Advisory</Link>
                  </h3>
                  <p>What to keep, replace, build or leave alone, in one roadmap.</p>
                </div>
                <div className="fl-coa-row">
                  <span className="fl-num">2000</span>
                  <h3>
                    <Link href="/managed-ai-services">Managed AI</Link>
                  </h3>
                  <p>Models, connections and context, run to keep pace with the field.</p>
                </div>
                <div className="fl-coa-row">
                  <span className="fl-num">3000</span>
                  <h3>
                    <Link href="/sovereignty">Private infrastructure</Link>
                  </h3>
                  <p>Open-source models in your environment. Your data stays where you decide.</p>
                </div>
                <div className="fl-coa-row">
                  <span className="fl-num">4000</span>
                  <h3>
                    <Link href="/commissioned-software">Commissioned software</Link>
                  </h3>
                  <p>
                    Systems you would otherwise rent, built to your specification and handed over
                    with source code.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="fl-block" id="controls" style={{ paddingTop: 0 }}>
            <div className="fl-wrap">
              <div className="fl-block-head">
                <h2>Controls, built into account 3000.</h2>
                <p>Where data goes, who approved it, and what is logged.</p>
              </div>
              <div className="fl-controls">
                <figure className="fl-diagram-card">
                  <svg
                    className="fl-diagram fl-d"
                    viewBox="0 0 440 484"
                    role="img"
                    aria-label="Diagram: your systems, agents and workflows, private models and an action log all sit inside your environment. Public AI services sit outside and connect through one gate, only by your agreement."
                  >
                    <rect className="fl-dg-perim" x="6" y="6" width="428" height="380" />
                    <rect className="fl-dg-perim-in" x="11" y="11" width="418" height="370" />
                    <text className="fl-dg-lab" x="26" y="38">YOUR ENVIRONMENT</text>
                    <rect className="fl-dg-box" x="26" y="56" width="388" height="72" />
                    <text className="fl-dg-t" x="42" y="86">YOUR SYSTEMS</text>
                    <text className="fl-dg-s" x="42" y="108">ERP, accounting, practice and document systems</text>
                    <path className="fl-dg-link" d="M220 128 V160" />
                    <rect className="fl-dg-box" x="26" y="160" width="388" height="80" />
                    <text className="fl-dg-t" x="42" y="190">AGENTS AND WORKFLOWS</text>
                    <text className="fl-dg-s fl-ok" x="42" y="212">a person approves what matters</text>
                    <path className="fl-dg-link" d="M120 240 V272" />
                    <path className="fl-dg-link" d="M320 240 V272" />
                    <rect className="fl-dg-box" x="26" y="272" width="188" height="86" />
                    <text className="fl-dg-t" x="40" y="302">PRIVATE MODELS</text>
                    <text className="fl-dg-s" x="40" y="324">hosted on your server</text>
                    <rect className="fl-dg-box" x="226" y="272" width="188" height="86" />
                    <text className="fl-dg-t" x="240" y="302">ACTION LOG</text>
                    <text className="fl-dg-s" x="240" y="324">every action recorded</text>
                    <path className="fl-dg-exit" d="M220 240 V378" />
                    <rect className="fl-dg-gate" x="212" y="378" width="16" height="16" />
                    <path className="fl-dg-exit" d="M220 394 V420" />
                    <rect className="fl-dg-out" x="110" y="420" width="220" height="56" />
                    <text className="fl-dg-t" x="220" y="444" textAnchor="middle">PUBLIC AI SERVICES</text>
                    <text className="fl-dg-s" x="220" y="464" textAnchor="middle">only by your agreement</text>
                  </svg>
                  <svg
                    className="fl-diagram fl-m"
                    viewBox="0 0 300 512"
                    role="img"
                    aria-label="Diagram: your systems, agents and workflows, private models and an action log all sit inside your environment. Public AI services sit outside and connect through one gate, only by your agreement."
                  >
                    <rect className="fl-dg-perim" x="4" y="4" width="292" height="404" />
                    <rect className="fl-dg-perim-in" x="9" y="9" width="282" height="394" />
                    <text className="fl-dg-lab" x="20" y="32">YOUR ENVIRONMENT</text>
                    <rect className="fl-dg-box" x="20" y="46" width="260" height="80" />
                    <text className="fl-dg-t" x="34" y="72">YOUR SYSTEMS</text>
                    <text className="fl-dg-s" x="34" y="94">ERP, accounting, practice</text>
                    <text className="fl-dg-s" x="34" y="112">and document systems</text>
                    <path className="fl-dg-link" d="M128 126 V146" />
                    <rect className="fl-dg-box" x="20" y="146" width="260" height="80" />
                    <text className="fl-dg-t" x="34" y="172">AGENTS AND WORKFLOWS</text>
                    <text className="fl-dg-s fl-ok" x="34" y="194">a person approves</text>
                    <text className="fl-dg-s fl-ok" x="34" y="212">what matters</text>
                    <path className="fl-dg-link" d="M128 226 V246" />
                    <rect className="fl-dg-box" x="20" y="246" width="216" height="62" />
                    <text className="fl-dg-t" x="34" y="272">PRIVATE MODELS</text>
                    <text className="fl-dg-s" x="34" y="294">hosted on your server</text>
                    <path className="fl-dg-link" d="M128 308 V322" />
                    <rect className="fl-dg-box" x="20" y="322" width="216" height="62" />
                    <text className="fl-dg-t" x="34" y="348">ACTION LOG</text>
                    <text className="fl-dg-s" x="34" y="370">every action recorded</text>
                    <path className="fl-dg-exit" d="M258 226 V400" />
                    <rect className="fl-dg-gate" x="250" y="400" width="16" height="16" />
                    <path className="fl-dg-exit" d="M258 416 V444" />
                    <rect className="fl-dg-out" x="64" y="444" width="220" height="62" />
                    <text className="fl-dg-t" x="174" y="470" textAnchor="middle">PUBLIC AI SERVICES</text>
                    <text className="fl-dg-s" x="174" y="492" textAnchor="middle">only by your agreement</text>
                  </svg>
                  <figcaption>
                    The double rule marks your environment. One gate leads out, shut unless you
                    open it.
                  </figcaption>
                </figure>
                <div className="fl-subs">
                  <div className="fl-sub">
                    <span className="fl-acct">3100</span>
                    <h3>Data location</h3>
                    <p>Models run in your environment or on a dedicated server Firmcraft manages.</p>
                  </div>
                  <div className="fl-sub">
                    <span className="fl-acct">3200</span>
                    <h3>Approval</h3>
                    <p>A person approves what matters.</p>
                  </div>
                  <div className="fl-sub">
                    <span className="fl-acct">3300</span>
                    <h3>Logging</h3>
                    <p>Every action is recorded: what ran and who approved it.</p>
                  </div>
                  {/* PROPOSED COPY, awaiting Doyle's OK: continuity line. */}
                  <div className="fl-sub" data-proposed-copy="continuity line, awaiting Doyle's OK">
                    <span className="fl-acct">3400</span>
                    <h3>Continuity</h3>
                    <p>{CONTINUITY_SHORT}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="fl-pe" id="pe">
            <div className="fl-wrap">
              <div>
                <span className="fl-label">For private equity</span>
                <h2>One standard for AI across the portfolio.</h2>
                <p className="fl-intro">
                  One view of AI cost, exposure and opportunity for operating partners, with each
                  company&rsquo;s data kept in its own environment.
                </p>
                <a className="fl-btn fl-primary" href="/diagnostic" data-cta>
                  Talk about a portfolio review
                </a>
              </div>
              <ul>
                <li>
                  <b>Portfolio review</b>
                  <span>
                    The Diagnostic run across several companies, with one comparable summary for
                    the deal team.
                  </span>
                </li>
                <li>
                  <b>One principal</b>
                  <span>
                    The same person across every company, so lessons carry from one to the next.
                    Continuity is covered in control 3400.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* PROPOSED COPY, awaiting Doyle's OK: the four answers in "Questions buyers ask". */}
          <section
            className="fl-block"
            id="questions"
            data-proposed-copy="buyer question answers, awaiting Doyle's OK"
          >
            <div className="fl-wrap">
              <div className="fl-block-head">
                <h2>Questions buyers ask.</h2>
              </div>
              <div className="fl-notes">
                <div className="fl-qn" id="q1">
                  <h3>
                    <span className="fl-num">1.</span>Where does our data live?
                  </h3>
                  <p>
                    In your environment by default. Nothing goes elsewhere without a reason, your
                    agreement and reviewed terms.
                  </p>
                </div>
                <div className="fl-qn" id="q2">
                  <h3>
                    <span className="fl-num">2.</span>Which systems do you work with?
                  </h3>
                  <p>
                    Any ERP or finance stack, a dealer or practice management system, or
                    equivalent, including one you are replatforming. Firmcraft is not tied to one
                    vendor.
                  </p>
                </div>
                <div className="fl-qn" id="q3">
                  <h3>
                    <span className="fl-num">3.</span>Do you resell software?
                  </h3>
                  <p>
                    No. Firmcraft takes no vendor margin. If the right answer is a system you
                    already own, or no new system, that is the recommendation.
                  </p>
                </div>
                <div className="fl-qn" id="q4">
                  <h3>
                    <span className="fl-num">4.</span>Do we own what you build?
                  </h3>
                  <p>
                    Commissioned software transfers to you with its source code and documentation,
                    so your own staff or AI coding tools can change it.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* END PROPOSED COPY: buyer questions */}

          <section className="fl-block" id="about" style={{ paddingTop: 0 }}>
            <div className="fl-wrap fl-founder">
              <div>
                <span className="fl-label">Who leads every engagement</span>
                <h2>Doyle Dettro</h2>
              </div>
              <div>
                <p className="fl-bio">
                  Accounting degree from the University of Illinois, then Arthur Andersen, an IPO,
                  and two decades leading ERP and finance systems programs from owner-led businesses
                  to multinationals. He founded Firmcraft to bring that discipline to AI, and builds
                  and runs its infrastructure himself.
                </p>
                <div className="fl-tl">
                  <div>
                    <span className="fl-num">1997</span>
                    <span>Arthur Andersen, Chicago</span>
                  </div>
                  <div>
                    <span className="fl-num">2002</span>
                    <span>Co-founded a software company and grew it from four people to twenty</span>
                  </div>
                  <div>
                    <span className="fl-num">2007 to 2012</span>
                    <span>
                      ERP and finance systems for an offshore energy group; interim global
                      controller of its public parent
                    </span>
                  </div>
                  <div>
                    <span className="fl-num">2012 to 2015</span>
                    <span>Senior finance architect, global ERP program across 150 countries</span>
                  </div>
                  <div>
                    <span className="fl-num">Today</span>
                    <span>Firmcraft; CTO of AI-PSM; founder of Predictium</span>
                  </div>
                </div>
                <p style={{ marginTop: 18 }}>
                  <Link className="fl-link" href="/about">
                    Full background
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <div className="fl-close" id="book" data-cta>
            <div className="fl-wrap">
              <div>
                <h2>Start with the numbers.</h2>
                <p>
                  A first conversation carries no cost and no obligation. If AI is the wrong
                  answer, you will hear that directly.
                </p>
              </div>
              <a className="fl-btn fl-primary" href="/diagnostic">
                Book a 30-minute call
              </a>
            </div>
          </div>
          <p className="fl-wrap fl-updated">
            Updated <time dateTime={UPDATED.iso}>{UPDATED.label}</time>
          </p>
        </main>

        <SiteFooter />
      </div>

      <BookingBar />
    </div>
  )
}
