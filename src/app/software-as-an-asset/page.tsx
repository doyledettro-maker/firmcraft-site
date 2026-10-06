import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './software-as-an-asset.css'

export const metadata: Metadata = {
  title: 'Software as an Asset — Firmcraft',
  description:
    'How Firmcraft structures the software it builds for clients so that the client owns it, can host it where it chooses, and can change it without depending on Firmcraft.',
  alternates: { canonical: '/software-as-an-asset' },
}

const sections = [
  {
    title: 'What the client receives',
    body: [
      "The result of the work is a functioning system together with everything required to operate, maintain, and extend it: the application source code, the infrastructure configuration that defines where and how it runs, the database and its schema, written documentation of the system's design and behavior, a test suite, a deployment pipeline, and a development environment that another engineering team could use immediately. Where artificial intelligence is part of the system, the client also receives the agent instructions and the evaluation framework that govern how those components behave.",
      'The system is built so that someone who did not build it can understand and modify it. Documentation, consistent naming, test coverage, and the structure of the code are treated as part of the work rather than as items to be completed afterwards.',
    ],
  },
  {
    title: 'How ownership works',
    body: [
      "The client owns the source code, the data, and the infrastructure configuration for software Firmcraft builds for it. The software is proprietary to the client, and its ownership is set out in the engagement agreement. Where an engagement uses a component from Firmcraft's own library of previously built solutions, that code is handed over to the client on the same basis.",
      'Where the software runs depends on the client. Some clients host it in their own environment and operate it themselves. Others ask Firmcraft to operate it as part of its managed services. In either case the client owns the software and can move it to an environment of its choosing.',
      "The client can also change the software without Firmcraft's involvement. There is no contractual restriction on who may work on the code. The client may assign its own staff, engage another engineering firm, or direct AI coding agents to make changes.",
      'Firmcraft remains available for further development and support through its managed services, which give the client continued access to the people who built the system. That arrangement is not a condition of continuing to use the software.',
    ],
  },
  {
    title: 'Why custom software is now a practical choice',
    body: [
      "Many organizations pay for subscription software of which they use a small part, and adjust their processes to fit what that software was designed to do. Where a workflow can be handled by software built for it, working alongside the organization's existing financial and customer systems, the result is often simpler for staff to use and less expensive to run. Firmcraft makes that comparison during the process redesign and recommends a subscription product where it is the better answer.",
      'The larger cost of custom software has historically been maintaining and changing it over time. Organizations often found that they could not change a custom system without returning to the original builder, because no one else understood it well enough to work on it safely. AI coding agents, working under the direction of an engineer, can now perform much of that work on code that is well structured, documented, and tested. Firmcraft builds with that in mind and delivers the documentation and agent instructions that make it possible.',
    ],
  },
  {
    title: 'Relationship to data sovereignty',
    body: [
      <>
        Software ownership and data sovereignty are separate questions that support each other.
        Owning the code is of limited value if the data it works on is held in an environment the
        client does not control, and control of the data is incomplete if the software that
        processes it can be withdrawn by a third party. Firmcraft&apos;s default position on both is
        that the client retains control. How Firmcraft handles client data, including where it
        resides and what may be sent to hosted services, is set out in{' '}
        <Link href="/sovereignty">Data Sovereignty</Link>.
      </>,
    ],
  },
  {
    title: 'Ownership in the engagement agreement',
    body: [
      "The transfer of source code, infrastructure configuration, documentation, and related materials to the client, including any component drawn from Firmcraft's library, is written into the engagement agreement.",
    ],
  },
]

export default function SoftwareAsAnAssetPage() {
  return (
    <>
      <SiteHeader marketing />
      <main className="marketing-inner saaa-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Software ownership</p>
            <h1>Software as an Asset</h1>
            <p className="lede">
              Deploying artificial intelligence in an organization always involves software built
              for that organization. An artificial intelligence system needs integrations with the
              systems the business already runs, access to the right data, rules that govern what
              it may do, and controls around its output. Every Firmcraft engagement therefore
              includes software built for the client, typically rules-based automation, artificial
              intelligence embedded in particular steps of a process, integrations, and dashboards
              designed around how its people work. Firmcraft delivers that software as software as
              an asset (SaaA). The client owns it, and can operate it, host it, and change it on
              its own terms.
            </p>
            <p className="lede">
              The people who understand a business best are the people who run it. Firmcraft&apos;s
              view is that they should own the software that supports their work and be able to
              decide how it changes.
            </p>
          </div>
        </section>

        {sections.map((section) => (
          <section className="sec" key={section.title}>
            <div className="wrap">
              <div className="pkg-head">
                <h2>{section.title}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="saaa-closing">
          <div className="wrap">
            <div className="saaa-cta">
              <div>
                <h2>Start a conversation</h2>
                <p>An initial conversation carries no cost and no obligation.</p>
              </div>
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
