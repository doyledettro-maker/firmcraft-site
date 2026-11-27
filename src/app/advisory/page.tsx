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
    url: '/managed-ai-services',
    description:
      "Ongoing support of a client's artificial intelligence capability across its three parts: the models it uses, the harness that connects them to the client's systems, and the context it works from, with monitoring, evaluation, and cost management.",
  }),
  serviceJsonLd({
    name: 'AI infrastructure',
    serviceType: 'Artificial intelligence infrastructure and data sovereignty',
    url: '/advisory',
    description:
      "Design and operation of where artificial intelligence systems run and where data resides, with client data kept in the client's own environment by default.",
  }),
  serviceJsonLd({
    name: 'Commissioned software',
    serviceType: 'Custom software development with transfer of ownership to the client',
    url: '/commissioned-software',
    description:
      'Systems commonly obtained by subscription, built to the client’s specification and transferred to the client with source code, documentation, and agent instructions, so the client can host and change them independently.',
  }),
]

export const metadata: Metadata = {
  title: 'Advisory Services',
  description:
    'Advisory, managed AI services, infrastructure, and commissioned software for organizations bringing artificial intelligence into their operations.',
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
              services, the infrastructure that supports them, and software built for clients to
              own, and it advises on the decisions that determine whether any of them is worth
              undertaking.
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
                series of decisions: what to retain, what to replace, what to build, and what to
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

        <section className="sec surface-2" id="managed-ai-services">
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
                intelligence capability. Each deployment has three parts that need support over
                time: the models it uses, the harness that connects those models to the
                organization&apos;s systems, and the context the system works from.
              </p>
              <h3 className="advisory-sub">The models</h3>
              <p>
                Model providers retire models on published schedules, in some cases with as little
                as two months&apos; notice, and each new model changes cost and behavior. Firmcraft
                keeps a record of the models each deployment depends on, tests a replacement
                against the client&apos;s own evaluation cases before switching, and completes the
                change before a retirement date arrives.
              </p>
              <h3 className="advisory-sub">The harness</h3>
              <p>
                The harness is the software around the model: its instructions, its connections to
                the client&apos;s systems, the permissions and approval steps that govern what it
                may do, its scheduled tasks, and the records of what it did. The harness needs
                attention when a connected system changes, when a permission needs adjusting, or
                when a newer model responds differently to the same instructions. Firmcraft
                maintains it as software, under version control, with each change tested before
                it is put into use.
              </p>
              <h3 className="advisory-sub">The context</h3>
              <p>
                Context is the information the system works from: its standing instructions, the
                organization&apos;s documents and records, and the memory it accumulates through
                use. Context deteriorates gradually. Documents go out of date, accumulated memory
                collects errors and duplicates, and an excess of material reduces accuracy.
                Firmcraft keeps what each system draws on current, so that it continues to reflect
                how the organization works.
              </p>
              <p>
                Monitoring, evaluation, and cost management apply across all three, and results
                are reported against the measurements taken before the work began. Clients retain
                a single point of accountability for the whole of their artificial intelligence
                estate rather than managing a collection of vendors. Each part is described in
                more detail in <Link href="/managed-ai-services">Managed AI services</Link>.
              </p>
              <p>
                This includes operating assistants inside the tools leadership and staff already
                use for day-to-day work, such as handling correspondence, scheduling, document preparation,
                and follow-up on outstanding items, so that the capability is available where the
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
              <h2>Commissioned software</h2>
              <p>
                Many organizations obtain by subscription the systems that support one particular
                process, such as permitting and licensing, case management, or grants
                administration. Firmcraft builds systems of this kind to the client&apos;s
                specification and transfers them to the client, together with the source code,
                documentation, and agent instructions needed to change them with the client&apos;s
                own staff or AI coding tools.
              </p>
              <p>
                Before any work is commissioned, Firmcraft compares the expected cost of the new
                system over its working life with the cost of the subscription it would replace.
                Further detail is set out in{' '}
                <Link href="/commissioned-software">Commissioned Software</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
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
