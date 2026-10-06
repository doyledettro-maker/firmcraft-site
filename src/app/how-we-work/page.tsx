import type { Metadata } from 'next'
import Link from 'next/link'
import { ProcessVideo } from '@/components/ProcessVideo'
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
      "Work begins with interviews of the people who perform the work in question, from the staff who handle it each day to the leaders accountable for its results. Alongside the interviews, Firmcraft reviews the records held in the organization's own systems: when each item was created, who handled it, how long it waited, and how often it was corrected. The interviews identify where the difficulty lies, and the system records show how often it occurs and what it costs.",
      'For each process, the review establishes how the work proceeds when nothing goes wrong, which cases depart from that path and how they are resolved, what happens before and after the process, which system is treated as authoritative when two disagree, and how much of the elapsed time is spent on the work itself.',
      "The output is a working document describing the current landscape, including the differences between what the organization's systems are understood to do and what its people actually do. That document is referenced throughout the engagement.",
    ],
  },
  {
    id: 'process-redesign',
    title: 'Process redesign',
    body: [
      'Before any step is automated, Firmcraft asks whether it needs to exist, and whether a system the organization already owns can perform it. Steps that exist only to move work between people, such as chasing documents, re-entering data, or waiting for a reply, are often removed entirely. A recommendation not to build, with an explanation, is a common outcome of this stage.',
    ],
    treatments: [
      {
        label: 'Conventional software,',
        body:
          'for steps that follow fixed rules. It is inexpensive, predictable, and auditable.',
      },
      {
        label: 'An artificial intelligence agent,',
        body:
          'for steps that require judgment, where there is a sufficient record of past decisions and the consequence of an error is limited. Its output is measured.',
      },
      {
        label: 'A person,',
        body:
          'for steps where the risk is higher, with the relevant information assembled in advance so that the decision can be made quickly.',
      },
    ],
    after: [
      'The current performance of each process is measured before anything is built, using elapsed time, cost, error rate, or whichever measure the organization already relies on. Work is then prioritized by where the most time is lost between steps, which is often not where the volume is highest.',
    ],
  },
  {
    id: 'implementation',
    title: 'Implementation',
    body: [
      'Implementation follows the redesign. Firmcraft builds what was agreed around the systems the organization already relies on, such as its financial and customer systems. That work always includes software built for the client, because artificial intelligence needs integrations, access to data, rules, and controls in order to do useful work. Typically this means rules-based automation, artificial intelligence embedded in particular steps, integrations, and dashboards. The client owns that software. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.',
      'An organization does not need to consolidate its systems before this work begins. Agents can work across systems that hold inconsistent records, provided it is clear which system is authoritative for each item.',
      <>
        How ownership of that software is structured is described in{' '}
        <Link href="/adaptable-software">Adaptable Software</Link>.
      </>,
    ],
  },
  {
    id: 'training-and-evaluation',
    title: 'Training and evaluation',
    body: [
      "Two things happen in parallel. The people who will use the system are trained on it, using their own work rather than illustrative examples. And an evaluation framework is established so that the system's output can be assessed objectively over time rather than by impression.",
      'Evaluation matters more for artificial intelligence than for conventional software. Behavior changes as models change, and without measurement that drift is not visible until it causes a problem.',
      'Evaluation is designed so that the underlying model can be changed without loss of control, and the organization is not dependent on a single provider.',
    ],
  },
  {
    id: 'ongoing-support',
    title: 'Ongoing support',
    body: [
      'For a defined period after implementation, Firmcraft remains closely involved — resolving issues, adjusting configuration in response to real use, and confirming that the measured outcomes match what was projected during the assessment.',
      'Results are reported against the measurements taken before the work began.',
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

            <ProcessVideo />
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
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                  {'treatments' in section && section.treatments ? (
                    <ol className="fit-gap-questions">
                      {section.treatments.map((treatment) => (
                        <li key={treatment.label}>
                          <span>
                            <strong>{treatment.label}</strong> {treatment.body}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {'after' in section && section.after
                    ? section.after.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                    : null}
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
