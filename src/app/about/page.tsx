import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './about.css'

export const metadata: Metadata = {
  title: 'About — Firmcraft',
  description:
    'Firmcraft is an advisory practice combining enterprise systems and digital transformation experience with hands-on technical implementation.',
  alternates: { canonical: '/about' },
}

const principles = [
  {
    title: 'Process before technology',
    body:
      'The workflow is mapped before a tool is selected. Whether a process should change is settled before the question of what technology to apply to it.',
  },
  {
    title: 'Data sovereignty by default',
    body:
      "Client data remains within the client's environment unless there is a specific reason for it not to, the client has agreed, and the terms have been reviewed.",
  },
  {
    title: 'Independence',
    body:
      'Firmcraft does not resell software and does not take vendor margin. Recommendations are not shaped by partner relationships.',
  },
  {
    title: 'Continuity of engagement',
    body:
      'The person who scopes an engagement leads the implementation and remains through ongoing support. Engagements are not passed to a delivery team.',
  },
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader current="about" />
      <main>
        <section className="about-hero">
          <div className="wrap">
            <div className="about-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 0.9fr)' }}>
              <div>
                <h1>About Firmcraft</h1>
                <p className="lede">
                  Firmcraft is an advisory practice working with mid-market organizations on
                  artificial intelligence and technology strategy, implementation, and ongoing
                  management.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Background</h2>
              <p>
                Firmcraft is led by a technology advisor whose work has centered on enterprise
                systems and digital transformation: several years implementing ERP and adjacent
                operational systems across manufacturing, field service, distribution, and
                industrial environments, and a continuing role in the enterprise software industry.
              </p>
              <p>
                Before that came a period in audit and a role as an industry controller, which
                included responsibility for a system implementation as the customer rather than the
                supplier. Having sat on both sides of that table is the reason the firm exists in
                its current form.
              </p>
              <p>
                Artificial intelligence projects in mid-market organizations do not usually fail
                for technical reasons. They fail because the person defining the work does not
                understand the operational and financial processes the technology has to fit into,
                has not owned an implementation, has not sat through a fit-gap analysis, and cannot
                tell when the underlying data will not support what is being proposed. Firmcraft is
                built around the opposite arrangement.
              </p>
              <p>The firm is based in central Illinois and works with clients across the United States.</p>
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>Operating principles</h2>
              </div>
            </div>
            <div className="principles">
              {principles.map((principle) => (
                <article className="principle" key={principle.title}>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>SkillCalibrate</h2>
              <p>
                SkillCalibrate is Firmcraft&apos;s training and capability practice, covering the
                organizational side of artificial intelligence adoption. Where an engagement
                requires that a client&apos;s own people develop working competence rather than
                receive a delivered system, that work is carried out under SkillCalibrate.
              </p>
              <p>
                <a href="https://skillcalibrate.com" rel="noopener">
                  skillcalibrate.com
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start a conversation</h2>
              <p>
                An initial conversation carries no cost and no obligation. If artificial
                intelligence is not the right investment for the problem you are describing,
                Firmcraft will say so.
              </p>
              <Link className="btn primary lg" href="/contact">
                Contact Firmcraft
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
