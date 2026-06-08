import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { PricingCalculator } from './PricingCalculator'
import './houston.css'

export const metadata: Metadata = {
  title: 'AI Office Manager for Houston Contractors | Firmcraft',
  description:
    'An AI operator that runs your Houston contracting office — answering phones, scheduling, dispatch, invoicing, and booking in one. Replace Ruby, Jobber, Housecall Pro, and QuickBooks for a fraction of the cost. Built in Houston for HVAC, plumbing, and electrical contractors.',
  alternates: { canonical: '/houston' },
  openGraph: {
    title: 'An AI Employee That Runs Your Contracting Office | Firmcraft Houston',
    description:
      'Hire an AI operator that learns your business, remembers every client, and handles phones, scheduling, invoicing, and booking — for a fraction of an office manager. Built in Houston.',
    url: 'https://firmcraft.ai/houston',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
}

const DOES: [string, string][] = [
  ['Answers your phones', 'Every call picked up in your business voice — booked, qualified, or messaged. No more lost jobs to voicemail.'],
  ['Remembers every client', 'Knows the address, the last service, the unit on the roof, what you quoted. It never forgets a customer you do.'],
  ['Schedules & dispatches', 'Books the job, routes the crew, sends the confirmation and the reminder. Your calendar runs itself.'],
  ['Invoices & gets you paid', 'Sends the invoice from the truck, takes the card, and chases the unpaid balance so you don’t have to.'],
  ['Books new work 24/7', 'Customers book, reschedule, and approve quotes from one link — while you’re on a roof or asleep.'],
  ['Learns your business', 'Your pricing, your service area, your rules. The longer it runs, the more it sounds like your best office manager.'],
]

export default function HoustonPage() {
  return (
    <>
      <SiteHeader />

      <main className="htx-page">
        {/* ============ HERO ============ */}
        <section className="htx-hero" data-screen-label="01 Hero">
          <div className="wrap">
            <div className="htx-hero-grid">
              <div className="htx-hero-lhs">
                <span className="status-pill operator">
                  <span className="dot"></span> Built in Houston for Houston contractors
                </span>
                <h1>
                  Hire an AI employee that{' '}
                  <em>runs your whole office.</em>
                </h1>
                <p className="lede">
                  Not another app to learn. An AI operator that answers your
                  phones, remembers every client, and handles your scheduling,
                  invoicing, and booking — all in one. Think of it as an office
                  manager who never sleeps, never quits, and costs a fraction of
                  the price.
                </p>
                <div className="htx-hero-ctas">
                  <a className="btn primary lg" href="/demo">
                    Book a 15-minute demo <span className="arr">→</span>
                  </a>
                  <a className="btn ghost lg" href="#calc">
                    See what it replaces
                  </a>
                </div>
                <div className="htx-hero-signals">
                  <span>Answers every call</span>
                  <span>One flat monthly rate</span>
                  <span>Running in days, not months</span>
                </div>
              </div>

              {/* HERO RHS: live operator console */}
              <aside className="htx-console" aria-label="AI operator handling office work">
                <div className="htx-console-bar">
                  <span className="lab">
                    operator · <b>your front office</b>
                  </span>
                  <span className="stamp">● live</span>
                </div>
                <div className="htx-console-body">
                  <div className="htx-line">
                    <span className="t">8:02a</span>
                    <span className="nm">
                      <em>call</em> · new customer · no-AC
                    </span>
                    <span className="tag ok">booked 11a</span>
                  </div>
                  <div className="htx-line">
                    <span className="t">8:14a</span>
                    <span className="nm">
                      <em>dispatch</em> · routed Marcus → Katy
                    </span>
                    <span className="tag ok">confirmed</span>
                  </div>
                  <div className="htx-line">
                    <span className="t">9:31a</span>
                    <span className="nm">
                      <em>invoice</em> · #1042 · $480
                    </span>
                    <span className="tag ok">paid</span>
                  </div>
                  <div className="htx-line">
                    <span className="t">10:05a</span>
                    <span className="nm">
                      <em>call</em> · repeat client · Mrs. Alvarez
                    </span>
                    <span className="tag run">on it</span>
                  </div>
                  <div className="htx-line">
                    <span className="t">10:06a</span>
                    <span className="nm">
                      <em>booking</em> · quote #88 approved online
                    </span>
                    <span className="tag ok">scheduled</span>
                  </div>
                </div>
                <div className="htx-console-foot">
                  <span>7 calls answered · 0 missed · before lunch</span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ============ WHAT THE OPERATOR DOES ============ */}
        <section className="sec" data-screen-label="02 What it does">
          <div className="wrap">
            <div className="htx-sec-head">
              <div className="eyebrow">One operator · the whole front office</div>
              <h2>
                It doesn&apos;t replace a tool.{' '}
                <em>It replaces the busywork.</em>
              </h2>
              <p>
                Most software hands you another login and a manual. Firmcraft
                gives you an operator that does the work — the same work a great
                office manager would, across every part of your day.
              </p>
            </div>

            <div className="htx-does-grid">
              {DOES.map(([k, v], i) => (
                <article className="htx-does" key={k}>
                  <span className="htx-does-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{k}</h3>
                  <p>{v}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TOOL REPLACEMENT STORY ============ */}
        <section className="sec surface-2" data-screen-label="03 Replaces">
          <div className="wrap">
            <div className="htx-sec-head">
              <div className="eyebrow">The stack you&apos;re paying for now</div>
              <h2>
                One operator does the job of{' '}
                <em>five separate subscriptions.</em>
              </h2>
              <p>
                You&apos;re probably renting an answering service, a scheduling
                app, an invoicing tool, and a booking link — four bills, four
                logins, none of them talking to each other. Firmcraft is one
                operator that does all of it.
              </p>
            </div>

            <div className="htx-replace">
              <div className="htx-replace-row htx-replace-hd">
                <span>What you run today</span>
                <span>Typical cost</span>
                <span>Firmcraft module</span>
                <span>Firmcraft</span>
              </div>

              {[
                ['Answering service', 'Ruby, Smith.ai, AnswerConnect', '$200–400/mo', 'AI Receptionist', '$199/mo'],
                ['Scheduling software', 'Jobber, Housecall Pro, ServiceTitan', '$119–3,500/mo', 'Scheduling & Dispatch', '$149/mo'],
                ['Invoicing', 'QuickBooks, FreshBooks', '$30–80/mo', 'Invoicing & Payments', '$99/mo'],
                ['Booking', 'Calendly, manual phone tag', '$0–30/mo + hours', 'Customer Portal & Booking', '$79/mo'],
                ['Operations view', 'Spreadsheets, sticky notes', 'Lost time', 'Operations Dashboard', '$49/mo'],
              ].map(([cat, tools, cost, mod, fc]) => (
                <div className="htx-replace-row" key={cat as string}>
                  <span className="htx-rep-cat">
                    <b>{cat}</b>
                    <span className="htx-rep-tools">{tools}</span>
                  </span>
                  <span className="htx-rep-cost">{cost}</span>
                  <span className="htx-rep-mod">{mod}</span>
                  <span className="htx-rep-fc">{fc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ INTERACTIVE CALCULATOR ============ */}
        <section className="sec" id="calc" data-screen-label="04 Calculator">
          <div className="wrap">
            <div className="htx-sec-head">
              <div className="eyebrow">Build your plan</div>
              <h2>
                Click the parts you want.{' '}
                <em>Watch the savings add up.</em>
              </h2>
              <p>
                Start with everything or just the piece that hurts most. Tap a
                module on or off to size your operator and see it against what
                you&apos;re paying today.
              </p>
            </div>

            <PricingCalculator />
          </div>
        </section>

        {/* ============ CREDIBILITY ============ */}
        <section className="sec surface-2" data-screen-label="05 Credibility">
          <div className="wrap">
            <div className="htx-cred">
              <div className="htx-cred-lhs">
                <div className="eyebrow">Why trust us with your phones</div>
                <h2>
                  Built in Houston, for the trades that{' '}
                  <em>keep Houston running.</em>
                </h2>
                <p>
                  We&apos;re early, and we&apos;d rather earn your business than
                  fake a wall of testimonials. Here&apos;s what we&apos;ll put
                  our name on instead.
                </p>
              </div>
              <div className="htx-cred-grid">
                <div className="htx-cred-card">
                  <h3>Local &amp; hands-on</h3>
                  <p>
                    Built here, set up by a real person, not a 1-800 queue. We
                    configure it to your pricing, your service area, and your way
                    of doing things.
                  </p>
                </div>
                <div className="htx-cred-card">
                  <h3>Your data stays yours</h3>
                  <p>
                    Firmcraft runs on a sovereign, private AI foundation. Your
                    customer list and call history never get sold, shared, or
                    used to train someone else&apos;s model.
                  </p>
                </div>
                <div className="htx-cred-card">
                  <h3>Finance-grade rigor</h3>
                  <p>
                    Firmcraft is run by a CPA and ERP consultant. The invoicing
                    and the numbers are built by someone who knows what a clean
                    book looks like.
                  </p>
                </div>
                <div className="htx-cred-card">
                  <h3>One flat rate</h3>
                  <p>
                    No per-seat games, no surprise overages, no annual contract
                    to escape. Cancel anytime — though we don&apos;t think
                    you&apos;ll want to.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="htx-final" data-screen-label="06 CTA">
          <div className="wrap">
            <div className="htx-final-inner">
              <div className="eyebrow">See it answer a call</div>
              <h2>
                Give us 15 minutes. <em>We&apos;ll show you your office, run by AI.</em>
              </h2>
              <p>
                We&apos;ll walk through how the operator would answer your
                phones, book your jobs, and bill your customers — with your
                business, not a generic demo. No pressure, no contract to start.
              </p>
              <div className="htx-final-ctas">
                <a className="btn primary lg" href="/demo">
                  Book a 15-minute demo <span className="arr">→</span>
                </a>
                <a className="btn console-ghost lg" href="/contact">
                  Or send us a question
                </a>
              </div>
              <div className="htx-final-foot">
                Houston, TX · HVAC · Plumbing · Electrical · Roofing · and the trades next door
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
