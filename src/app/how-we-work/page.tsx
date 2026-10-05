import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './how-we-work.css'

export const metadata: Metadata = {
  title: 'How We Work — Firmcraft',
  description:
    "Firmcraft's approach to assessment, implementation, and ongoing support, adapted from enterprise systems implementation practice.",
  alternates: { canonical: '/how-we-work' },
}

const sections = [
  {
    id: 'discovery',
    title: 'Discovery',
    body: [
      'Work begins with interviews of the people who perform the work in question — finance, operations, information technology, and whoever is responsible for the chart of accounts. Alongside the interviews, Firmcraft compiles an inventory of the systems in use and maps the processes that are candidates for change.',
      "The output is a working document describing the current landscape, including the discrepancies between what the organization's systems are understood to do and what its people actually do. That document is referenced throughout the engagement.",
    ],
  },
  {
    id: 'fit-gap-analysis',
    title: 'Fit-gap analysis',
    intro: 'Each candidate process is assessed against three questions.',
    questions: [
      'Does an existing system already perform this function.',
      'Does an existing system nearly perform it.',
      'Or is this genuinely absent.',
    ],
    body: [
      'Only the second and third categories proceed. Processes that fall into the first receive a recommendation not to build, with an explanation. In practice this analysis frequently pays for the engagement on its own, because organizations are often unaware of capability they already hold.',
      "Candidates that proceed are assessed on feasibility, expected return, and whether they can be operated within the client's data sovereignty requirements.",
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    body: [
      'Implementation work follows the assessment: building what was agreed, integrating it with the systems already in place, and establishing the operational controls around it. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.',
    ],
  },
  {
    id: 'training-and-evaluation',
    title: 'Training and evaluation',
    body: [
      "Two things happen in parallel. The people who will use the system are trained on it, using their own work rather than illustrative examples. And an evaluation framework is established so that the system's output can be assessed objectively over time rather than by impression.",
      'Evaluation matters more for artificial intelligence than for conventional software. Behavior changes as models change, and without measurement that drift is not visible until it causes a problem.',
    ],
  },
  {
    id: 'ongoing-support',
    title: 'Ongoing support',
    body: [
      'For a defined period after implementation, Firmcraft remains closely involved — resolving issues, adjusting configuration in response to real use, and confirming that the measured outcomes match what was projected during the assessment.',
      'Beyond that period, clients generally move to ongoing managed services.',
    ],
  },
]

export default function HowWeWorkPage() {
  return (
    <>
      <SiteHeader current="how-we-work" />
      <main className="marketing how-work-page">
        <section className="how-hero">
          <div className="wrap">
            <p className="eyebrow">How we work</p>
            <h1>How we work</h1>
            <p className="lede">
              Firmcraft&apos;s approach is adapted from enterprise systems implementation rather
              than from software piloting. Most artificial intelligence projects fail during
              scoping rather than during engineering, and the sequence below is built around that
              observation.
            </p>

            <nav className="stage-overview" aria-label="Engagement stages">
              {sections.map((section, index) => (
                <a href={`#${section.id}`} key={section.id}>
                  <span className="node" aria-hidden="true" />
                  <span className="stage-label">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </section>

        {sections.map((section, index) => (
          <section className="how-stage" id={section.id} key={section.title}>
            <div className="wrap">
              <div className="stage-grid">
                <div className="stage-title">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h2>{section.title}</h2>
                </div>
                <div className="stage-copy">
                  {'intro' in section && section.intro ? <p>{section.intro}</p> : null}
                  {'questions' in section && section.questions ? (
                    <ol className="fit-gap-questions">
                      {section.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  ) : null}
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="how-closing">
          <div className="wrap">
            <div className="how-cta">
              <h2>Start a conversation</h2>
              <Link className="btn brass lg" href="/contact">
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
