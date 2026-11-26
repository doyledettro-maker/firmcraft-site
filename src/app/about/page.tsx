import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { personJsonLd } from '@/lib/structured-data'
import './about.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Firmcraft is an advisory practice combining business process, industry, and enterprise systems experience with hands-on technical implementation.',
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
      'Firmcraft does not resell software and does not take vendor margin. Recommendations are not shaped by vendor relationships.',
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
      <JsonLd data={personJsonLd} />
      <main className="marketing-inner">
        <section className="about-hero">
          <div className="wrap">
            <div className="about-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 0.9fr)' }}>
              <div>
                <h1>About Firmcraft</h1>
                <p className="lede">
                  Firmcraft is an advisory practice working with business owners and executive
                  teams on artificial intelligence and technology strategy, implementation, and
                  ongoing management.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="founder-profile">
              <div className="founder-portrait">
                <Image
                  src="/founder/doyle.jpg"
                  alt="Doyle Dettro"
                  fill
                  sizes="(min-width: 980px) 360px, 100vw"
                  className="founder-img"
                  priority
                  unoptimized
                />
              </div>
              <div className="founder-copy">
                <p className="eyebrow">Founder</p>
                <h2>Doyle Dettro</h2>
                <p className="founder-role">Founder and Principal</p>
                <p>
                  Doyle Dettro graduated from the University of Illinois in 1997 with a
                  bachelor&apos;s degree in accounting and passed the CPA examination on his first
                  attempt. He worked at the accounting firm George S. Olive while in school and
                  joined Arthur Andersen in Chicago on graduation. He then moved to NovaMed, where he
                  worked in finance, accounting, and analysis through the company&apos;s initial
                  public offering, and later to New York to join Virtual Chip Exchange, an
                  early-stage company in semiconductor trading.
                </p>
                <p>
                  He went on to co-found a software company, and for more than two decades his
                  career has been in enterprise software and digital transformation. He has served
                  as senior software architect and project manager on some of the largest
                  implementations in the world of a major ERP platform, many of them multinational
                  and multi-currency, and has led software sales, guiding buyers through major
                  system decisions. Over that time he has advised hundreds of businesses on their
                  systems and operations. In his most recent enterprise software role, he led the
                  work to bring artificial intelligence into the company&apos;s products and
                  operations.
                </p>
                <p>
                  He founded Firmcraft to apply that experience to artificial intelligence, which
                  most organizations are now adopting without the discipline they would bring to any
                  other major system. He leads every Firmcraft engagement directly and builds and
                  operates the firm&apos;s AI infrastructure himself.
                </p>
                <p>
                  Alongside Firmcraft, he is Chief Technology Officer of{' '}
                  <a href="https://ai-psm.com" rel="noopener">
                    AI-PSM
                  </a>
                  , an agentic artificial intelligence platform for process safety and asset
                  integrity at oil refineries, and the founder of Predictium. Both are described
                  in <Link href="/work">Selected Work</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Why the practice is built this way</h2>
              <p>
                Artificial intelligence projects do not usually fail for technical reasons. They
                fail because the person defining the work does not understand the operational and
                financial processes the technology has to fit into: they have not run an
                implementation, have not sat through a fit-gap analysis, and cannot tell when the
                underlying data will not support what is being proposed. Firmcraft is built around
                the opposite arrangement.
              </p>
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
              <Link className="btn navy lg" href="/contact">
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
