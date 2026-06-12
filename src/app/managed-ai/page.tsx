import Link from 'next/link'
import type { Metadata } from 'next'
import './managed-ai.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { serviceJsonLd } from '@/lib/structured-data'
import { OPERATOR_PLANS } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Firmcraft Operator — Managed AI Employee in Slack or Teams from $399/mo',
  description:
    'A managed AI employee for small business. Solo, Team, and Pro plans from $399/mo, priced by who actually uses the agent. Lives in Slack or Teams, plugged into the tools you already use, running by Friday.',
  alternates: { canonical: '/managed-ai' },
}

const OPERATOR_JSONLD = serviceJsonLd({
  name: 'Firmcraft Operator',
  serviceType: 'Managed AI service',
  url: '/managed-ai',
  description:
    'A managed AI employee that works in Slack or Microsoft Teams, integrated with the tools a small business already uses (accounting, CRM, scheduling, practice management). Onboarding, all integrations, and a monthly AI token allowance included; live within five business days.',
  offers: [
    { price: '399', description: 'Solo — 1–3 users, $399/month' },
    { price: '799', description: 'Team — 4–7 users, $799/month' },
    { price: '1499', description: 'Pro — 8–10 users, $1,499/month' },
  ],
})

export default function ManagedAIPage() {
  return (
    <>
      <JsonLd data={OPERATOR_JSONLD} />
      <SiteHeader current="managed-ai" />
      <main>
        {/* HERO */}
        <section className="mai-hero" data-screen-label="01 Firmcraft Operator hero">
          <div className="wrap">
            <div className="mai-hero-grid">
              <div>
                <span className="status-pill operator">
                  <span className="dot"></span> Firmcraft Operator · the product
                </span>
                <h1>
                  A capable second set of hands. <em>Running by next Friday.</em>
                </h1>
                <p className="lede">
                  Firmcraft Operator is the packaged product — a
                  sovereign Hermes agent that lives in your team chat,
                  plugs into the tools you already pay for, and
                  quietly does the recurring work. Three plans, priced
                  by how many of your people will actually use it. Up
                  and running in five business days.
                </p>
                <div
                  className="hero-ctas"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                >
                  <a className="btn primary lg" href="#plans">
                    See plans <span className="arr">→</span>
                  </a>
                  <a
                    className="btn ghost lg"
                    href="/contact"
                  >
                    Book a 20-min call
                  </a>
                </div>
                <div className="signals">
                  <span>Live in 5 business days</span>
                  <span>Flat monthly rate</span>
                  <span>Sovereign by default</span>
                  <span>SOC 2 in progress</span>
                </div>
              </div>

              {/* Chat hero */}
              <div className="chat-card">
                <div className="chrome">
                  <span className="channel">
                    #ops · <b>Firmcraft Operator</b>
                  </span>
                  <span className="live">● live</span>
                </div>
                <div className="stream">
                  <div className="msg h">
                    <div className="av h">DD</div>
                    <div className="body">
                      <div className="meta">
                        <b>Doyle</b> · 10:41
                      </div>
                      <div className="text">
                        @operator — pull AP invoices from{' '}
                        <span className="mono-inline">finance@</span> since Monday, code &amp; queue for review. Anything &gt;$5k flag me.
                      </div>
                    </div>
                  </div>
                  <div className="msg op">
                    <div className="av op">F</div>
                    <div className="body">
                      <div className="meta">
                        <b>Operator</b> · 10:41 · BC + Outlook
                      </div>
                      <div className="text">
                        Found <em>14 invoices</em>. Coded against vendor history, 12 queued in BC for approval, <em>2 flagged</em> (Acme $7,420 · new GL · COA mismatch).
                      </div>
                      <div className="actions">
                        <span className="a ok">✓ 12 queued</span>
                        <span className="a warm">⚐ 2 held for review</span>
                        <span className="a">audit log →</span>
                      </div>
                    </div>
                  </div>
                  <div className="msg h">
                    <div className="av h">RT</div>
                    <div className="body">
                      <div className="meta">
                        <b>Reena (Controller)</b> · 10:42
                      </div>
                      <div className="text">
                        Looks right. Push the 12. Send Acme to me, I&apos;ll talk to AP.
                      </div>
                    </div>
                  </div>
                  <div className="msg op">
                    <div className="av op">F</div>
                    <div className="body">
                      <div className="meta">
                        <b>Operator</b> · 10:42
                      </div>
                      <div className="text">
                        Posted 12 to BC. Threaded Acme to <em>@Reena</em>. Next month-end run:{' '}
                        <span className="mono-inline">Fri 4:00pm</span>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="proof">
              <div className="lab">Engagements live or in flight —</div>
              <div className="logos">
                <div className="slot">DENTAL PRACTICE</div>
                <div className="slot">TREE-REMOVAL CO.</div>
                <div className="slot">SOLO ERP CONSULTANT</div>
                <div className="slot">PAYMENTS FIRM</div>
                <div className="slot">+ YOU?</div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="sec" data-screen-label="02 Problem">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">01 · The honest version</div>
                <h2>
                  You don&apos;t need <em className="em-italic">another tool.</em> You need someone to actually do the thing.
                </h2>
              </div>
              <p>
                You already paid for ChatGPT or Copilot. Three people opened it the first week, nobody opened it the second. Meanwhile the contract still doesn&apos;t get sent until you&apos;re back at the truck, the insurance claim still sits in someone&apos;s inbox, and the marketing email still hasn&apos;t gone out — because the person who&apos;d do it has client work.
              </p>
            </div>

            <div className="prob-grid">
              <div className="pcell">
                <div className="num">A —</div>
                <h3>The seat-license trap</h3>
                <p>You bought the chatbot. It sits in a tab. The team opened it once and never came back.</p>
              </div>
              <div className="pcell">
                <div className="num">B —</div>
                <h3>The prompting tax</h3>
                <p>Every tool assumes someone has time to learn it and train the rest. They don&apos;t.</p>
              </div>
              <div className="pcell">
                <div className="num">C —</div>
                <h3>The integration desert</h3>
                <p>QuickBooks, Drive, Outlook, your booking tool — none of them talk. The AI doesn&apos;t either.</p>
              </div>
              <div className="pcell">
                <div className="num">D —</div>
                <h3>The pilot purgatory</h3>
                <p>Three vendor demos, six-figure SOWs, 90-day &ldquo;discoveries.&rdquo; None shipped a workflow you use.</p>
              </div>
              <div className="pcell">
                <div className="num">E —</div>
                <h3>The hire-or-build problem</h3>
                <p>You&apos;d staff this if you could. The people who could build it aren&apos;t applying to your shop.</p>
              </div>
              <div className="pcell">
                <div className="num">F —</div>
                <h3>The &ldquo;but client data&rdquo; wall</h3>
                <p>Every interesting workflow stalls on compliance. Nobody wants to be the one who broke it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className="sec surface-2" data-screen-label="03 How">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">02 · How it works</div>
                <h2>
                  Four beats. <em className="em-italic">Then it&apos;s running.</em>
                </h2>
              </div>
              <p>
                No SOW theatre. No 90-day &ldquo;discovery.&rdquo; Intake call Monday, install across your stack by Wednesday, real work routed to the operator by Friday. There&apos;s a person at Firmcraft you can text the whole way.
              </p>
            </div>

            <div className="how-grid">
              <div className="how-cell">
                <div className="glyph">a</div>
                <div className="step-n">01 / Where</div>
                <h4>Lives in your team chat</h4>
                <p>Mention it like a teammate. No new dashboard, no second login, nothing nobody on staff opens.</p>
              </div>
              <div className="how-cell">
                <div className="glyph">b</div>
                <div className="step-n">02 / What</div>
                <h4>Connected to your tools</h4>
                <p>QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign, your practice management — read, write, audit-log.</p>
              </div>
              <div className="how-cell">
                <div className="glyph">c</div>
                <div className="step-n">03 / How much</div>
                <h4>Flat monthly rate</h4>
                <p>One price. All seats. All integrations. Token allowance included — anything beyond is billed at published rates, tracked live.</p>
              </div>
              <div className="how-cell">
                <div className="glyph">d</div>
                <div className="step-n">04 / When</div>
                <h4>Running in a week</h4>
                <p>Intake Monday. Connectors live Wednesday. First production workflow by Friday. Days, not quarters.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PLANS */}
        <section className="sec" id="plans" data-screen-label="04 Plans">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow eb-operator">03 · Plans</div>
                <h2>
                  Sized by <em className="em-italic">who actually uses it.</em>
                </h2>
              </div>
              <p>
                Pricing is based on how many of your team will work
                with the agent day-to-day — not seats, not features.
                Three flat plans cover 1 to 10 people. Onboarding, all
                integrations, a monthly AI token allowance, and a real
                person at Firmcraft you can text are included on every
                plan.
              </p>
            </div>

            <div className="plans">
              {OPERATOR_PLANS.map((plan) => {
                const isFeat = !!plan.featured
                return (
                  <article key={plan.tier} className={`plan${isFeat ? ' feat' : ''}`}>
                    {plan.badge ? <span className="badge">{plan.badge}</span> : null}
                    <div className="tier">{plan.tier}</div>
                    <div className="team-size">
                      <span className="ts-label">Team size</span>
                      <span className="ts-value">{plan.teamSize}</span>
                    </div>
                    <h3>{plan.headline}</h3>
                    <div className="price">
                      <span className="big">{plan.price}</span>
                      <span className="per">/ month</span>
                    </div>
                    <div className="setup">{plan.setup}</div>
                    <p className="sub">{plan.sub}</p>
                    <ul>
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div className="cta">
                      <a className={`btn ${isFeat ? 'primary' : 'ghost'}`} href={plan.href}>
                        {plan.cta} <span className="arr">→</span>
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>

            <blockquote className="partner-line">
              <span className="pq-mark">“</span>
              It&apos;s like hiring someone for the office — contracts,
              emails, scheduling — except it&apos;s $399 a month and
              it&apos;s running by Friday.
              <span className="pq-mark close">”</span>
            </blockquote>

            <p
              style={{
                textAlign: 'center',
                marginTop: 28,
                color: 'var(--color-muted)',
                fontSize: 14,
              }}
            >
              Count only the people who&apos;ll actually use the
              agent. A 200-person company with 4 people on the
              Operator is a Team plan — not a custom engagement.
            </p>
          </div>
        </section>

        {/* COMPARE */}
        <section className="sec" data-screen-label="05 Compare">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">04 · Comparison</div>
                <h2>
                  Firmcraft <em className="em-italic">vs.</em> the chatbot you already pay for.
                </h2>
              </div>
              <p>
                ChatGPT and Copilot are perfectly fine general-purpose tools. They are not operators. Nothing in their pricing is aligned with whether your business actually moves a deliverable forward — and nothing in their setup process gets your team past the awkward first week.
              </p>
            </div>

            <table className="ctable">
              <thead>
                <tr>
                  <th></th>
                  <th className="us">Firmcraft Operator</th>
                  <th>ChatGPT Teams</th>
                  <th>Microsoft Copilot</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="featc">What you&apos;re buying</td>
                  <td className="usc">A managed agent + a real person at Firmcraft</td>
                  <td className="themc">A per-seat chatbot license</td>
                  <td className="themc">A per-seat chatbot license</td>
                </tr>
                <tr>
                  <td className="featc">Lives where the work lives</td>
                  <td className="usc">Inside your team chat</td>
                  <td className="themc">A separate app + browser tab</td>
                  <td className="themc">Side panel inside Office</td>
                </tr>
                <tr>
                  <td className="featc">Speaks to your ERP &amp; niche tools</td>
                  <td className="usc">Built and maintained for you</td>
                  <td className="themc">DIY connectors, if any</td>
                  <td className="themc">Microsoft stack only</td>
                </tr>
                <tr>
                  <td className="featc">Data sovereignty</td>
                  <td className="usc">Hermes — sovereign by default</td>
                  <td className="themc">OpenAI cloud</td>
                  <td className="themc">Microsoft cloud</td>
                </tr>
                <tr>
                  <td className="featc">Pricing</td>
                  <td className="usc">Flat monthly, all seats</td>
                  <td className="themc">Per seat, per month</td>
                  <td className="themc">Per seat, per month</td>
                </tr>
                <tr>
                  <td className="featc">Time to first workflow</td>
                  <td className="usc">5 business days</td>
                  <td className="themc">Whenever someone has time</td>
                  <td className="themc">Whenever someone has time</td>
                </tr>
                <tr>
                  <td className="featc">Who builds the prompts</td>
                  <td className="usc">We do.</td>
                  <td className="themc">You do.</td>
                  <td className="themc">You do.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* INDUSTRIES */}
        <section className="sec surface-2" data-screen-label="06 Industries">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">05 · Who runs it</div>
                <h2>
                  Built for businesses doing <em className="em-italic">the actual work.</em>
                </h2>
              </div>
              <p>
                Our first four customers — a dental practice, a one-person tree-removal company, a solo ERP consultant, and an eight-person payments firm — have nothing in common operationally. The throughline: recurring work, tools that don&apos;t talk, nobody on staff to wire it together.
              </p>
            </div>

            <div className="ind-grid">
              <div className="ind">
                <div className="glyph">Hc</div>
                <div>
                  <div className="num">— 01</div>
                  <h4>Healthcare practices</h4>
                  <p>e.g. our dental client uses Firmcraft to draft &amp; submit insurance reimbursement claims.</p>
                </div>
              </div>
              <div className="ind">
                <div className="glyph">Tr</div>
                <div>
                  <div className="num">— 02</div>
                  <h4>Trades &amp; field services</h4>
                  <p>e.g. our tree-removal client ships DocuSign contracts on-site — signed before he leaves the driveway.</p>
                </div>
              </div>
              <div className="ind">
                <div className="glyph">B2</div>
                <div>
                  <div className="num">— 03</div>
                  <h4>B2B services</h4>
                  <p>e.g. our payments client uses Firmcraft as a second pair of hands for an overworked one-person marketing team.</p>
                </div>
              </div>
              <div className="ind">
                <div className="glyph">So</div>
                <div>
                  <div className="num">— 04</div>
                  <h4>Solo &amp; owner-operators</h4>
                  <p>e.g. our solo ERP consultant runs an entire practice on a single operator. The cheapest second hire she&apos;ll ever make.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES BRIDGE */}
        <section
          className="sec services-bridge"
          style={{ borderBottom: 'none' }}
          data-screen-label="07 Services bridge"
        >
          <div className="wrap">
            <div className="srv-card">
              <div className="srv-lhs">
                <div className="srv-marker">
                  <span className="dot"></span>
                  <span className="lab">Track 02 · The practice</span>
                </div>
                <h2>
                  Beyond ten people?{' '}
                  <em className="em-italic">
                    That&apos;s a Firmcraft Services engagement.
                  </em>
                </h2>
                <p>
                  Once the Operator is touching whole departments — or
                  you need it wired through your ERP, with eval,
                  observability, and a roadmap — pricing shifts from a
                  sticker to a scoped engagement. The Services
                  practice runs that work end-to-end: discovery,
                  fixed-fee Assessment, scoped Build, and ongoing
                  Operate. Same engineer, same Hermes substrate, no
                  rebuild when you graduate.
                </p>
                <div className="srv-ctas">
                  <Link className="btn primary" href="/pricing#services">
                    See the Services track <span className="arr">→</span>
                  </Link>
                  <a
                    className="btn ghost"
                    href="/contact"
                  >
                    Book the discovery call
                  </a>
                </div>
              </div>
              <aside className="srv-flow">
                <div className="srv-flow-head">
                  How the Services funnel runs
                </div>
                <div className="step">
                  <span className="n">01</span>
                  <div>
                    <div className="t">Discovery</div>
                    <div className="s">20-min call · free</div>
                  </div>
                </div>
                <div className="step">
                  <span className="n">02</span>
                  <div>
                    <div className="t">AI Readiness Assessment</div>
                    <div className="s">2–3 weeks · $4.5k–$8.5k fixed</div>
                  </div>
                </div>
                <div className="step">
                  <span className="n">03</span>
                  <div>
                    <div className="t">Scoped Build</div>
                    <div className="s">6–16 weeks · fixed-fee</div>
                  </div>
                </div>
                <div className="step">
                  <span className="n">04</span>
                  <div>
                    <div className="t">Operate retainer</div>
                    <div className="s">Monthly · eval + new workflows</div>
                  </div>
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
