import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactForm } from '@/components/ContactForm'
import { FirmcraftMark } from '@/components/home/FirmcraftMark'
import './diagnostic.css'

/*
 * The AI and Systems Diagnostic: the one offer, on its own page (DRAFT, Nov 28, 2026).
 *
 * The whole page is a draft for Doyle's review. Two kinds of marker:
 *   - <Tbc>: a visible "to confirm" placeholder where the page needs Doyle's
 *     answer (how long it takes, client time, founding-client terms). Each also
 *     carries data-placeholder so the open items can be found in the HTML.
 *   - data-proposed-copy: wording written for this draft that Doyle has not
 *     approved yet (the founding-client terms section).
 * No prices anywhere on this page.
 */

export const metadata: Metadata = {
  title: 'The AI and Systems Diagnostic',
  alternates: { canonical: '/diagnostic' },
  description:
    'A fixed-scope review of the AI tools, spend and data exposure across your ERP and finance stack, with a measured baseline and a written finding. Every Firmcraft engagement starts here.',
  openGraph: {
    title: 'The AI and Systems Diagnostic | Firmcraft',
    description:
      'A fixed-scope review of AI tools, spend and data exposure across your ERP and finance stack, ending with a written finding.',
  },
}

function Tbc({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span className="dg-tbc" data-placeholder={id}>
      <span className="dg-tbc-k">To confirm</span> {children}
    </span>
  )
}

const DELIVERABLES: { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'AI tool and spend inventory',
    body: 'Every AI tool, subscription and add-on in use, including the ones staff adopted on their own: who uses it, what it costs, and which systems it touches.',
  },
  {
    n: '02',
    title: 'Measured baseline',
    body: 'Time, volume and error rates for the processes that matter most, measured before anything changes, so any later result is stated against a real starting point.',
  },
  {
    n: '03',
    title: 'Data exposure and controls review',
    body: 'Where company data goes, including what leaves your ERP, who approves what, and what is logged today.',
  },
  {
    n: '04',
    title: 'Ranked opportunities',
    body: 'Each with expected effect, effort and risk. The list includes what is not worth doing, and why.',
  },
  {
    n: '05',
    title: 'A plan you can run',
    body: 'Sequenced next steps you can carry out with Firmcraft, with someone else, or on your own.',
  },
]

const OUTLINE: { n: string; title: string; items: string[] }[] = [
  {
    n: '1',
    title: 'Summary for leadership',
    items: ['What we found', 'What we recommend', 'What we recommend against'],
  },
  {
    n: '2',
    title: 'Current state',
    items: ['AI tools and subscriptions, by team', 'Spend by tool and by month', 'Systems each tool reads from or writes to'],
  },
  {
    n: '3',
    title: 'Baseline',
    items: ['Process, measure and current value', 'How each measure was taken', 'Where the data came from'],
  },
  {
    n: '4',
    title: 'Data exposure and controls',
    items: [
      'Data that leaves your environment, and where it goes',
      'Approvals, logging and access in place today',
      'Gaps, ranked by risk',
    ],
  },
  {
    n: '5',
    title: 'Opportunities, ranked',
    items: ['Expected effect, effort and risk for each', 'Dependencies on your ERP and other systems'],
  },
  {
    n: '6',
    title: 'Not recommended',
    items: ['Ideas considered and set aside, with the reason'],
  },
  {
    n: '7',
    title: 'Plan',
    items: ['Sequence and owners', 'What to measure after each step'],
  },
]

const PROVIDES: { k: string; v: React.ReactNode }[] = [
  {
    k: 'A sponsor',
    v: 'A CFO, controller or other leader who can make decisions and open doors inside the company.',
  },
  {
    k: 'System access',
    v: 'Read-only access to your ERP and the systems around it, or the reports and exports that stand in for it. Data stays in your environment wherever possible.',
  },
  {
    k: 'Spend records',
    v: 'Invoices, card statements or a subscription list showing what the company pays for AI and related software.',
  },
  {
    k: 'Time with your team',
    v: (
      <>
        Short working sessions with the people who run the processes in scope.{' '}
        <Tbc id="client-time">Total client time, for example hours per week and for how many weeks.</Tbc>
      </>
    ),
  },
]

const STEPS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: '1',
    title: 'A first call',
    body: (
      <>
        No cost and no obligation. If AI is the wrong answer, you will hear that directly.{' '}
        <Tbc id="call-length">Call length (the homepage says 30 minutes).</Tbc>
      </>
    ),
  },
  {
    n: '2',
    title: 'Scope letter',
    body: 'A short engagement letter naming the systems and processes in scope, who takes part, and the date the finding is due.',
  },
  {
    n: '3',
    title: 'The work',
    body: (
      <>
        Inventory, measurement and review, led by the principal.{' '}
        <Tbc id="duration">How long the Diagnostic takes, start to written finding.</Tbc>
      </>
    ),
  },
  {
    n: '4',
    title: 'The finding',
    body: 'A written finding, walked through with your leadership team. What you do next is your decision.',
  },
]

export default function DiagnosticPage() {
  return (
    <>
      <SiteHeader current="diagnostic" ctaHref="#book" />

      <main className="dg">
        <section className="dg-hero">
          <div className="wrap dg-hero-grid">
            <div>
              <span className="dg-label">Every engagement begins here</span>
              <h1>The AI and Systems Diagnostic.</h1>
              <p className="dg-lede">
                A fixed-scope review of the AI tools, spend and data exposure across your ERP and
                the systems around it. It measures the processes that matter most and ends with a
                written finding your leadership team can act on, with Firmcraft or without it.
              </p>
              <div className="dg-ctas">
                <a className="btn primary lg" href="#book">
                  Book a call
                </a>
                <a className="btn ghost lg" href="#sample">
                  See a sample finding
                </a>
              </div>
            </div>

            <aside className="dg-facts" aria-label="The Diagnostic at a glance">
              <div className="dg-facts-top">
                <span className="dg-brand">
                  <FirmcraftMark size={22} />
                  <b>Firmcraft</b>
                </span>
                <span className="dg-label">At a glance</span>
              </div>
              <dl>
                <div>
                  <dt>Form</dt>
                  <dd>Fixed scope. Ends with a written finding.</dd>
                </div>
                <div>
                  <dt>For</dt>
                  <dd>CFOs, controllers and leadership teams at mid-size companies running an ERP</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>
                    <Tbc id="duration-glance">Weeks from start to finding.</Tbc>
                  </dd>
                </div>
                <div>
                  <dt>Your time</dt>
                  <dd>
                    <Tbc id="client-time-glance">Hours asked of your team.</Tbc>
                  </dd>
                </div>
                <div>
                  <dt>Led by</dt>
                  <dd>Doyle Dettro, Founder and Principal</dd>
                </div>
              </dl>
              <p className="dg-facts-foot">If AI is the wrong investment, the finding says so.</p>
            </aside>
          </div>
        </section>

        <section className="dg-sec" id="deliverables">
          <div className="wrap">
            <div className="dg-head">
              <span className="dg-label">Deliverables</span>
              <h2>Five things you keep.</h2>
            </div>
            <ol className="dg-deliv">
              {DELIVERABLES.map((d) => (
                <li key={d.n}>
                  <span className="dg-num">{d.n}</span>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="dg-sec" id="sample">
          <div className="wrap dg-split">
            <div className="dg-head">
              <span className="dg-label">Sample finding</span>
              <h2>What the written finding looks like.</h2>
              <p>
                An outline of the document you receive. Section lengths and contents vary with the
                company and the systems in scope. It carries no figures here because every finding
                is built from your own numbers.
              </p>
            </div>
            <article className="dg-doc" aria-label="Sample finding outline">
              <div className="dg-doc-top">
                <span className="dg-label">Written finding</span>
                <span className="dg-label">Outline</span>
              </div>
              <h3 className="dg-doc-title">AI and Systems Diagnostic: finding for [Company]</h3>
              <ol>
                {OUTLINE.map((s) => (
                  <li key={s.n}>
                    <span className="dg-num">{s.n}</span>
                    <div>
                      <b>{s.title}</b>
                      <ul>
                        {s.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="dg-doc-foot">Appendix: systems reviewed, people interviewed, sources for every measure.</p>
            </article>
          </div>
        </section>

        <section className="dg-sec" id="provide">
          <div className="wrap">
            <div className="dg-head">
              <span className="dg-label">What you provide</span>
              <h2>What the Diagnostic needs from you.</h2>
            </div>
            <dl className="dg-provide">
              {PROVIDES.map((p) => (
                <div key={p.k}>
                  <dt>{p.k}</dt>
                  <dd>{p.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* PROPOSED COPY, awaiting Doyle's OK: founding-client terms. No prices, no results claimed. */}
        <section
          className="dg-sec dg-founding"
          id="founding"
          data-proposed-copy="founding-client terms, awaiting Doyle's OK"
        >
          <div className="wrap dg-split">
            <div className="dg-head">
              <span className="dg-label">Founding clients</span>
              <h2>Founding-client terms.</h2>
              <p>
                Firmcraft is taking on its first mid-size companies running an ERP. Founding clients
                start with the Diagnostic and help shape how the method is applied to larger finance
                teams.
              </p>
            </div>
            <dl className="dg-terms">
              <div>
                <dt>Who leads the work</dt>
                <dd>The principal, directly, from the first call to the written finding.</dd>
              </div>
              <div>
                <dt>What founding clients receive</dt>
                <dd>
                  <Tbc id="founding-receive">The founding-client benefit, stated without a price.</Tbc>
                </dd>
              </div>
              <div>
                <dt>What Firmcraft asks in return</dt>
                <dd>
                  <Tbc id="founding-ask">
                    For example, feedback on the method, a reference call, or permission to describe
                    the work.
                  </Tbc>
                </dd>
              </div>
              <div>
                <dt>Places</dt>
                <dd>
                  <Tbc id="founding-places">How many founding clients, and until when.</Tbc>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="dg-sec" id="steps">
          <div className="wrap">
            <div className="dg-head">
              <span className="dg-label">How it runs</span>
              <h2>From first call to finding.</h2>
            </div>
            <ol className="dg-steps">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <span className="dg-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="dg-sec dg-book" id="book">
          <div className="wrap dg-split">
            <div className="dg-head">
              <span className="dg-label">Book a call</span>
              <h2>Start with the numbers.</h2>
              <p>
                Tell Firmcraft about the company, the ERP and systems in place, and what you want to
                know. You will get a reply to set up the first call.
              </p>
              <p>
                Or call <a href="tel:+12173038319">(217) 303-8319</a> or email{' '}
                <a href="mailto:hello@firmcraft.ai">hello@firmcraft.ai</a>.
              </p>
            </div>
            <div className="dg-form">
              <ContactForm source="diagnostic" submitLabel="Request a call" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
