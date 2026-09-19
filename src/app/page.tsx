import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './home.css'

export const metadata: Metadata = {
  title: 'Firmcraft — AI Advisory and Managed Services for Mid-Market Companies',
  description:
    'Firmcraft advises mid-market companies on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis.',
  alternates: { canonical: '/' },
}

const serviceLines = [
  {
    title: 'Advisory',
    body:
      'Establishing what is currently running, what it costs, and what it actually does. Determining what should be kept, replaced, built, or left alone. Owning the artificial intelligence and technology roadmap at the executive level, so that decisions are made deliberately rather than accumulated by default.',
  },
  {
    title: 'Managed AI services',
    body:
      "Operating the resulting capability over time. Monitoring, evaluation, tuning, retiring what has become obsolete, and introducing what has genuinely improved. The objective is that a client's capability keeps pace with the field rather than freezing at the point of implementation.",
  },
  {
    title: 'Infrastructure',
    body:
      "The technical foundation beneath both, with data sovereignty as the default position. Determining where client data resides, what runs inside the client's own environment, and what may reasonably be sent elsewhere.",
  },
]

const distinctions = [
  {
    title: 'Business process, industry, and systems depth',
    body:
      'Firmcraft is led by an advisor whose background spans business process, industry operations, and enterprise systems implementation. That work has been carried out in manufacturing, field service, distribution, and industrial environments, and from both sides of an implementation: first as the finance leader accountable for a rollout, and later as the consultant delivering them.',
  },
  {
    title: 'Commercial literacy',
    body:
      'An earlier career in audit and corporate finance means engagements are led by someone who can assess whether a proposed project produces measurable financial value, and discuss that assessment with a controller or chief financial officer in their own terms.',
  },
  {
    title: 'Independence',
    body:
      'Firmcraft does not resell software and does not take vendor margin. Where the appropriate answer is a system the client already owns, or no new system at all, that is the recommendation.',
  },
  {
    title: 'An established implementation method',
    body:
      "Firmcraft's approach is adapted from enterprise systems implementation rather than from software piloting. Most artificial intelligence projects fail during scoping rather than engineering, and the method is built around that.",
  },
  {
    title: 'Continuity',
    body:
      'The person who scopes an engagement leads the implementation and remains through ongoing support. Engagements are not passed to a delivery team.',
  },
]

const fit = [
  ['Revenue', '10 million and above'],
  ['Headcount', '50 to 1,500 employees'],
  [
    'Systems',
    'A system of record in place, or actively replatforming — an ERP, a dealer or practice management system, or equivalent',
  ],
  [
    'Organizational lead',
    'Owner, chief executive, chief financial officer, controller, chief operating officer, or director of finance',
  ],
  ['Typical situation', 'Manual process load, constrained headcount, audit and control exposure'],
  ['AI maturity', 'Isolated pilots without broader adoption, or no formal program'],
]

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />

      <main>
        <section className="home-hero">
          <div className="wrap">
            <div className="hero-grid" style={{ gridTemplateColumns: 'minmax(0, 0.9fr)' }}>
              <div className="lhs">
                <h1>AI advisory and managed services for mid-market companies</h1>
                <p className="lede">
                  Firmcraft advises mid-market companies on artificial intelligence and technology
                  strategy, implements what that strategy requires, and manages the result on an
                  ongoing basis. The practice brings together business process, industry, and
                  enterprise systems experience with hands-on technical implementation.
                </p>
                <div className="hero-ctas">
                  <Link className="btn primary lg" href="/contact">
                    Contact Firmcraft
                  </Link>
                  <Link className="btn ghost lg" href="/how-we-work">
                    How we work
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>The problem most organizations have with AI</h2>
              </div>
            </div>
            <div className="prose-block">
              <p>
                In most organizations, artificial intelligence arrived from the bottom up.
                Individual employees adopted individual tools. Subscriptions accumulated without a
                central view of cost or exposure, few of those tools connect to the systems the
                business actually runs on, and no one owns the overall result.
              </p>
              <p>
                The pace of change compounds the difficulty. A decision that was reasonable
                eighteen months ago may no longer be, and few mid-market organizations have someone
                on staff whose job is to track that.
              </p>
              <p>
                Larger consulting firms are generally not structured to serve companies of this
                size. Firms that specialize in artificial intelligence often lack working
                familiarity with the financial and operational systems mid-market companies depend
                on. Firmcraft was established to address both gaps.
              </p>
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>What Firmcraft does</h2>
              </div>
              <p>
                Implementation runs through all three areas below. Firmcraft builds what the advice
                calls for, integrates it with the systems already in place, and trains the people
                who will use it.
              </p>
            </div>
            <div className="diff-grid">
              {serviceLines.map((line) => (
                <article className="diff" key={line.title}>
                  <div>
                    <h3>{line.title}</h3>
                    <p>{line.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>What distinguishes Firmcraft</h2>
              </div>
            </div>
            <div className="diff-grid">
              {distinctions.map((item) => (
                <article className="diff" key={item.title}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>Who Firmcraft works with</h2>
              </div>
              <p>
                Firmcraft works with mid-market organizations where the owner, the chief executive,
                or the finance and operations leadership drives the technology agenda.
              </p>
            </div>
            <div className="icp-spec" style={{ maxWidth: 900 }}>
              {fit.map(([label, value]) => (
                <div className="r" key={label}>
                  <span className="k">{label}</span>
                  <span className="v">{value}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--color-muted)', marginTop: 24, maxWidth: 820 }}>
              Firmcraft is generally not the right fit for pre-revenue companies or for
              organizations whose financial and operational data is not yet held in a system of
              record.
            </p>
          </div>
        </section>

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="final-cta">
              <div>
                <h2>Start a conversation</h2>
                <p>
                  An initial conversation carries no cost and no obligation. If artificial
                  intelligence is not the right investment for the problem you are describing,
                  Firmcraft will say so.
                </p>
                <div className="hero-ctas">
                  <Link className="btn primary lg" href="/contact">
                    Contact Firmcraft
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
