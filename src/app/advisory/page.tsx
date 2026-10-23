import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { serviceJsonLd } from '@/lib/structured-data'

const SERVICES = [
  serviceJsonLd({
    name: 'AI advisory',
    serviceType: 'Artificial intelligence and technology strategy advisory',
    url: '/advisory',
    description:
      'An assessment of what artificial intelligence and related systems an organization runs, what they cost and produce, and where they create exposure, leading to a roadmap an executive team can fund.',
  }),
  serviceJsonLd({
    name: 'Managed AI services',
    serviceType: 'Managed artificial intelligence operations',
    url: '/advisory',
    description:
      "Ongoing operation of a client's artificial intelligence capability: monitoring and evaluation, tuning, cost management, and replacement of components as better options become available.",
  }),
  serviceJsonLd({
    name: 'AI infrastructure',
    serviceType: 'Artificial intelligence infrastructure and data sovereignty',
    url: '/advisory',
    description:
      "Design and operation of where artificial intelligence systems run and where data resides, with client data kept in the client's own environment by default.",
  }),
]

export const metadata: Metadata = {
  title: 'Advisory Services',
  description:
    'Advisory, managed AI services, and infrastructure for companies bringing artificial intelligence into finance and operations.',
  alternates: { canonical: '/advisory' },
}

export default function AdvisoryPage() {
  return (
    <>
      <SiteHeader current="advisory" />
      {SERVICES.map((service) => (
        <JsonLd key={service.name} data={service} />
      ))}
      <main className="marketing-inner">
        <section className="page-hero">
          <div className="wrap">
            <h1>Advisory</h1>
            <p className="lede">
              Firmcraft is an advisory practice. The firm offers managed artificial intelligence
              services and the infrastructure that supports them, and it advises on the decisions
              that determine whether either is worth undertaking.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Advisory</h2>
              <p>
                Most organizations do not have an accurate picture of their own artificial
                intelligence position. Tools have been adopted by individual teams, spending is
                distributed across departments, and the relationship between those tools and the
                systems of record is often unclear.
              </p>
              <p>
                Advisory work begins with establishing that picture: what is running, what it
                costs, what it produces, and where it creates exposure. From there the work is a
                series of decisions — what to retain, what to replace, what to build, and what to
                stop. The output is a roadmap that an executive team can fund and a finance
                function can defend.
              </p>
              <p>
                A material proportion of these engagements conclude with a recommendation not to
                build. In some cases the appropriate answer is better use of systems the
                organization already owns, or improvements to underlying data, rather than new
                technology.
              </p>
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Managed AI services</h2>
              <p>
                An implementation is a position taken at a moment in time. The field moves, models
                are superseded, costs change, and processes that were automated appropriately last
                year may warrant revisiting.
              </p>
              <p>
                Managed services cover the ongoing operation of a client&apos;s artificial
                intelligence capability: monitoring and evaluation, tuning, cost management,
                retirement of components that no longer earn their place, and introduction of
                capabilities that have genuinely improved. Clients retain a single point of
                accountability for the whole of their artificial intelligence estate rather than
                managing a collection of vendors.
              </p>
              <p>
                This includes operating assistants inside the tools leadership and staff already
                use for day-to-day work — handling correspondence, scheduling, document preparation,
                and follow-up on outstanding items — so that the capability is available where the
                work happens rather than in a separate system someone has to remember to open.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Infrastructure</h2>
              <p>Infrastructure work concerns where systems run and where data resides.</p>
              <p>
                Firmcraft&apos;s default position is that client data remains within the
                client&apos;s own environment. Where a hosted model is the appropriate tool for a
                given task, it is used only where the data handling terms are acceptable to the
                client and the decision has been made explicitly rather than by default.
              </p>
              <p>
                Further detail is set out in <Link href="/sovereignty">Data Sovereignty</Link>.
              </p>
              <p>
                How Firmcraft structures ownership of the software it builds is described in{' '}
                <Link href="/adaptable-software">Adaptable Software</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Independence</h2>
              <p>
                Firmcraft does not resell software and does not receive vendor margin. This is a
                deliberate constraint on the business model rather than a statement of preference.
              </p>
              <p>
                The practical consequence is that recommendations are not shaped by a vendor
                relationship. Where the appropriate answer is a system the client already owns, a
                change to process rather than technology, or no action at all, that is what
                Firmcraft recommends.
              </p>
              <p>
                Firmcraft also works with consulting, ERP implementation, and accounting firms that
                deliver artificial intelligence to their own clients. How those engagements are
                structured is described in{' '}
                <Link href="/partners">Working with consulting and advisory firms</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start a conversation</h2>
              <p>An initial conversation carries no cost and no obligation.</p>
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
