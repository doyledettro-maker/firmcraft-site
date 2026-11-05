import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd, serviceJsonLd } from '@/lib/structured-data'
import './managed-ai-services.css'

const DESCRIPTION =
  'How Firmcraft supports artificial intelligence systems after implementation: the models they use, the harness that connects those models to the organization’s systems, and the context the systems work from.'

export const metadata: Metadata = {
  title: 'Managed AI Services',
  description: DESCRIPTION,
  alternates: { canonical: '/managed-ai-services' },
}

const parts = [
  {
    id: 'models',
    title: 'The models',
    body: [
      'A deployment depends on one or more models, and the providers of those models change them on their own schedules. Models are retired on published timetables, in some cases with as little as two months’ notice. A newer model can cost more or less to run, respond differently to the same instructions, and perform better on some tasks and worse on others.',
      'Firmcraft keeps a record of the models each deployment depends on and the dates by which each must be replaced. A candidate replacement is tested against the client’s own evaluation cases before any change is made, and the change is completed before a retirement date arrives. Model access is routed through a single point with a budget set for each client, so that a model can be changed in one place and usage can be measured.',
      'Deployments are not tied to a single model provider. Where an open-source model suits the work, it can be run in the client’s own environment.',
    ],
  },
  {
    id: 'harness',
    title: 'The harness',
    body: [
      'The harness is the software around the model. It holds the system’s instructions, its connections to the client’s systems, the permissions and approval steps that govern what it may do, its scheduled tasks, and the records of what it has done. Most of what makes an artificial intelligence system reliable in daily use sits in the harness.',
      'The harness needs attention when a connected system changes how it returns data, when a permission needs adjusting, when a process changes, or when a newer model responds differently to instructions written for the one before it. Firmcraft maintains the harness as software. Each change is made under version control, tested before it is put into use, and can be reversed.',
      <>
        The harness is software built for the client, and the client owns it, under the
        arrangement described in <Link href="/adaptable-software">Adaptable Software</Link>.
      </>,
    ],
  },
  {
    id: 'context',
    title: 'The context',
    body: [
      'Context is the information the system works from: its standing instructions, the organization’s documents and records, and the memory it accumulates through use. The quality of a system’s work depends on the quality of that information.',
      'Context deteriorates gradually and is easy to overlook. Documents go out of date, prices and policies change, and accumulated memory collects errors and duplicates that the system then treats as fact. More material is not always better, because accuracy declines when a system is given more than the task requires.',
      <>
        Firmcraft keeps what each system draws on current. Outdated material is removed or
        replaced, errors in accumulated memory are corrected, and instructions are revised when the
        way the organization works changes. Client data remains in the client&apos;s own
        environment while this is done, as set out in{' '}
        <Link href="/sovereignty">Data Sovereignty</Link>.
      </>,
    ],
  },
]

const faq = [
  {
    q: 'What happens when a model is retired?',
    a: 'Firmcraft tracks the retirement dates of the models each deployment uses. A replacement is tested against the client’s own evaluation cases, and the change is completed before the retirement date.',
  },
  {
    q: 'What is an artificial intelligence harness?',
    a: 'The software around the model: its instructions, its connections to the organization’s systems, the permissions and approval steps that govern it, its scheduled tasks, and the records of what it has done.',
  },
  {
    q: 'Why does an artificial intelligence system become less accurate over time?',
    a: 'Usually because the information it works from has changed or deteriorated, or because a connected system or the model itself has changed. Managed services address each of these.',
  },
  {
    q: 'Is Firmcraft tied to a single model provider?',
    a: 'No. Deployments are designed so that the model can be changed without rebuilding the system, and open-source models are used where they suit the work.',
  },
  {
    q: 'What do managed services include?',
    a: 'Monitoring, evaluation, cost management, and the maintenance of the models, harness, and context of systems already in place, including refinement of existing workflows. New workflows are scoped as separate work.',
  },
  {
    q: 'Can we end managed services and keep the system?',
    a: 'Yes. The client owns the software and its data, and can operate it with its own staff or another firm.',
  },
]

export default function ManagedAiServicesPage() {
  return (
    <>
      <SiteHeader marketing />
      <JsonLd
        data={serviceJsonLd({
          name: 'Managed AI services',
          serviceType: 'Managed artificial intelligence operations',
          url: '/managed-ai-services',
          description: DESCRIPTION,
        })}
      />
      <JsonLd data={faqJsonLd(faq)} />
      <main className="marketing-inner managed-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Ongoing support</p>
            <h1>Managed AI services</h1>
            <p className="lede">
              An artificial intelligence system continues to change after it is implemented. The
              models it relies on are replaced by their providers, the systems it connects to are
              updated, and the information it works from goes out of date. Firmcraft&apos;s
              managed services keep each system working as intended through those changes.
            </p>
            <p className="lede">
              Support covers three parts of every deployment: the models it uses, the harness that
              connects those models to the organization&apos;s systems, and the context the system
              works from.
            </p>
          </div>
        </section>

        {parts.map((part) => (
          <section className="sec" id={part.id} key={part.id}>
            <div className="wrap">
              <div className="pkg-head">
                <h2>{part.title}</h2>
                {part.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Monitoring, evaluation, and cost</h2>
              <p>
                Monitoring, evaluation, and cost management apply across all three parts. Each
                system&apos;s output is assessed against an evaluation framework established during
                implementation, so that a decline in quality is found through measurement rather
                than through a complaint. Usage costs are tracked for each client against an agreed
                budget.
              </p>
              <p>
                Results are reported against the measurements taken before the work began, as
                described in <Link href="/how-we-work">How We Work</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>How support is provided</h2>
              <p>
                Support is provided as needs arise. Clients raise a request when something needs
                attention, and Firmcraft maintains the models, harness, and context of systems
                already in place, including refinement of existing workflows. New workflows are
                scoped as separate work.
              </p>
              <p>
                The person who led the implementation remains responsible for support. Clients
                have a single point of accountability for the whole of their artificial
                intelligence capability, rather than a collection of vendors.
              </p>
              <p>
                Managed services are not a condition of using the system. The client owns the
                software and its data, and can operate the system with its own staff or another
                firm.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Questions about managed services</h2>
              {faq.map((item) => (
                <div className="managed-model" key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="managed-closing">
          <div className="wrap">
            <div className="managed-cta">
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
