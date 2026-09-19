import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import '../methodology/methodology.css'

export const metadata: Metadata = {
  title: 'How We Work — Firmcraft',
  description:
    "Firmcraft's approach to assessment, implementation, and ongoing support, adapted from enterprise systems implementation practice.",
  alternates: { canonical: '/how-we-work' },
}

const sections = [
  {
    title: 'Discovery',
    body: [
      'Work begins with interviews of the people who perform the work in question, finance, operations, information technology, and whoever is responsible for the chart of accounts. Alongside the interviews, Firmcraft compiles an inventory of the systems in use and maps the processes that are candidates for change.',
      "The output is a working document describing the current landscape, including the discrepancies between what the organization's systems are understood to do and what its people actually do. That document is referenced throughout the engagement.",
    ],
  },
  {
    title: 'Fit-gap analysis',
    body: [
      'Each candidate process is assessed against three questions. Does an existing system already perform this function. Does an existing system nearly perform it. Or is this genuinely absent.',
      'Only the second and third categories proceed. Processes that fall into the first receive a recommendation not to build, with an explanation. In practice this analysis frequently pays for the engagement on its own, because organizations are often unaware of capability they already hold.',
      "Candidates that proceed are assessed on feasibility, expected return, and whether they can be operated within the client's data sovereignty requirements.",
    ],
  },
  {
    title: 'Configuration',
    body: [
      'Implementation work follows the assessment: building what was agreed, integrating it with the systems already in place, and establishing the operational controls around it. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.',
    ],
  },
  {
    title: 'Training and evaluation',
    body: [
      'Two things happen in parallel. The people who will use the system are trained on it, using their own work rather than illustrative examples. And an evaluation framework is established so that the system output can be assessed objectively over time rather than by impression.',
      'Evaluation matters more for artificial intelligence than for conventional software. Behavior changes as models change, and without measurement that drift is not visible until it causes a problem.',
    ],
  },
  {
    title: 'Ongoing support',
    body: [
      'For a defined period after implementation, Firmcraft remains closely involved, resolving issues, adjusting configuration in response to real use, and confirming that the measured outcomes match what was projected during the assessment.',
      'Beyond that period, clients generally move to ongoing managed services.',
    ],
  },
]

export default function HowWeWorkPage() {
  return (
    <>
      <SiteHeader current="how-we-work" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>How we work</h1>
            <p className="lede">
              Firmcraft&apos;s approach is adapted from enterprise systems implementation rather
              than from software piloting. Most artificial intelligence projects fail during
              scoping rather than during engineering, and the sequence below is built around that
              observation.
            </p>
          </div>
        </section>

        {sections.map((section, index) => (
          <section className={`sec${index % 2 ? ' surface-2' : ''}`} key={section.title}>
            <div className="wrap">
              <div className="pkg-head">
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start a conversation</h2>
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
