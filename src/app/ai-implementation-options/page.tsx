import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd } from '@/lib/structured-data'
import '../partners/partners.css'

export const metadata: Metadata = {
  title: 'Managed AI Partner, Agency, or In-House Team',
  description:
    'How a managed AI partner, a development agency, and an in-house team compare for implementing artificial intelligence in a business, when each one fits, and what to ask before choosing.',
  alternates: { canonical: '/ai-implementation-options' },
}

const options = [
  {
    title: 'An in-house team',
    what: 'The organization hires its own specialists to design, build, and run its artificial intelligence systems.',
    fits: 'Artificial intelligence is central to what the organization sells, there is enough work to keep specialists fully occupied, and the organization can recruit and keep them.',
    watch:
      'Specialists are hard to hire and keep. A small team can come to depend on one person, and the team has to keep up with model and tooling changes alongside its delivery work.',
  },
  {
    title: 'A development agency',
    what: 'An outside firm builds a defined system to a specification and hands it over at the end of the project.',
    fits: 'The work is well defined, the specification is settled, and the organization has people who can operate and maintain the system after handover.',
    watch:
      'Systems built on models need attention after launch: models are retired, connected systems change, and the information the system works from goes out of date. Check who owns the code and who will maintain it once the project ends.',
  },
  {
    title: 'A managed AI partner',
    what: 'An outside firm designs the system around the organization’s processes, implements it, and keeps it running afterwards.',
    fits: 'The organization wants artificial intelligence in its operations without building a team, and wants the system maintained as models, systems, and processes change.',
    watch:
      'Check who owns the software, where the data is held, whether the system is tied to one model provider, and whether the organization could take the system over or move it to another firm.',
  },
]

const questions = [
  'Who owns the software, the instructions, and the records the system produces?',
  'Where is our data held and processed, and who can see it?',
  'Is the system tied to a single model provider, and what happens when a model is retired?',
  'How will results be measured, and against what starting point?',
  'What do we receive if we end the arrangement: code, documentation, and access?',
]

const faq = [
  {
    q: 'What is the difference between a managed AI partner and an AI agency?',
    a: 'An agency usually builds a defined system and hands it over at the end of the project. A managed AI partner designs and implements the system and then keeps it running as models, connected systems, and processes change.',
  },
  {
    q: 'When is an in-house AI team the better choice?',
    a: 'When artificial intelligence is central to what the organization sells, there is enough work to occupy specialists full time, and the organization can recruit and keep them.',
  },
  {
    q: 'What should a business ask before choosing an AI implementation partner?',
    a: 'Who owns the software and records, where data is held, whether the system is tied to one model provider, how results will be measured, and what the business receives if the arrangement ends.',
  },
]

export default function AiImplementationOptionsPage() {
  return (
    <>
      <SiteHeader marketing />
      <JsonLd data={faqJsonLd(faq)} />
      <main className="marketing-inner partners-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Choosing an approach</p>
            <h1>Managed AI partner, agency, or in-house team</h1>
            <p className="lede">
              Organizations that want artificial intelligence in their operations usually choose
              among three arrangements: hiring an in-house team, engaging a development agency for
              a defined build, or working with a managed AI partner that implements the system and
              keeps it running. Each suits a different situation, and the right choice depends on
              how central the work is to the business and who will look after the system once it
              is in use.
            </p>
            <p className="partners-updated">Updated November 26, 2026</p>
          </div>
        </section>

        {options.map((option) => (
          <section className="sec" key={option.title}>
            <div className="wrap">
              <div className="pkg-head">
                <h2>{option.title}</h2>
                <p>{option.what}</p>
                <div className="partners-model">
                  <h3>When it fits</h3>
                  <p>{option.fits}</p>
                </div>
                <div className="partners-model">
                  <h3>What to check</h3>
                  <p>{option.watch}</p>
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Questions to ask any provider</h2>
              <ul className="partners-list">
                {questions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Where Firmcraft fits</h2>
              <p>
                Firmcraft is a managed AI partner. The client owns the software built for it, under
                the arrangement described in{' '}
                <Link href="/adaptable-software">Adaptable Software</Link>. Client data stays in the
                client&apos;s own environment unless there is an agreed reason to move it, as set
                out in <Link href="/sovereignty">Data Sovereignty</Link>. Deployments are not tied to
                a single model provider, and ongoing support is described in{' '}
                <Link href="/managed-ai-services">Managed AI Services</Link>.
              </p>
              <p>
                Firmcraft is usually not the right choice for an organization building artificial
                intelligence into a software product it sells. That work is better served by its
                own team. Consulting and advisory firms that deliver artificial intelligence to
                their clients can work with Firmcraft as described in{' '}
                <Link href="/partners">Partner Firms</Link>.
              </p>
              <p>
                Examples of Firmcraft&apos;s work are in <Link href="/work">Selected Work</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Common questions</h2>
              {faq.map((item) => (
                <div className="partners-model" key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="partners-closing">
          <div className="wrap">
            <div className="partners-cta">
              <div>
                <h2>Talk through the options</h2>
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
