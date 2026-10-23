import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd } from '@/lib/structured-data'
import './partners.css'

export const metadata: Metadata = {
  title: 'AI Implementation Partner for Consulting Firms',
  description:
    'Firmcraft works with consulting, ERP implementation, accounting, and advisory firms to assess, implement, and manage artificial intelligence for their clients, through joint delivery, subcontracted delivery, or referral.',
  alternates: { canonical: '/partners' },
}

const contributions = [
  'Process redesign, with current performance measured before anything is built.',
  'Integration with the systems the client already relies on, including ERP, accounting, and customer relationship systems.',
  "Agents and automation built and tested against the client's own records.",
  'Ongoing managed services, covering monitoring, evaluation, cost management, and the replacement of models as better options become available.',
]

const models = [
  {
    title: 'Joint delivery',
    body: "Firmcraft works alongside the partner firm and its client as a named member of the project team. Each firm's responsibilities are set out before work begins.",
  },
  {
    title: 'Subcontracted delivery',
    body: "Firmcraft provides implementation and engineering work within the partner firm's project structure. How Firmcraft is presented to the client, and which firm holds each client-facing responsibility, is agreed for each engagement.",
  },
  {
    title: 'Referral',
    body: 'The partner firm introduces a client, and Firmcraft contracts with and serves that client directly. The partner firm is kept informed to the extent the client agrees.',
  },
]

const faq = [
  {
    q: 'Which firms does Firmcraft work with?',
    a: 'Consulting, ERP implementation, accounting, and advisory firms, and operating partners at investment firms, whose clients need artificial intelligence capability that the firm does not provide itself.',
  },
  {
    q: "Can Firmcraft work under our firm's name?",
    a: 'Where both firms agree, yes. How Firmcraft is presented and who holds each client-facing responsibility are agreed before work begins.',
  },
  {
    q: 'Will Firmcraft approach our clients directly?',
    a: "No. Firmcraft does not approach a partner firm's clients for separate work without that firm's agreement.",
  },
  {
    q: 'Who owns the software that is built?',
    a: "The client owns it, including any code drawn from Firmcraft's own library. The client can host it, change it, or have Firmcraft operate it.",
  },
  {
    q: 'What happens after implementation?',
    a: 'Firmcraft can operate the deployment under managed services, or hand it over to the client or the partner firm with documentation.',
  },
  {
    q: 'How are model costs and dependence on AI vendors handled?',
    a: 'Deployments are not tied to a single model provider, and open-source foundations are used where they suit the work. Usage costs are tracked for each client against an agreed budget and reported with the results.',
  },
  {
    q: 'How does a partnership begin?',
    a: 'With a conversation about a specific client need. An initial conversation carries no cost and no obligation.',
  },
]

export default function PartnersPage() {
  return (
    <>
      <SiteHeader marketing />
      <JsonLd data={faqJsonLd(faq)} />
      <main className="marketing-inner partners-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Partner firms</p>
            <h1>Working with consulting and advisory firms</h1>
            <p className="lede">
              Firmcraft works with consulting firms, ERP implementation partners, accounting firms,
              and private equity operating partners to assess, implement, and manage artificial
              intelligence for their clients. The partner firm keeps its client relationship and
              its role in the engagement. Firmcraft provides the process, systems, and engineering
              work that an artificial intelligence deployment requires, and can operate the result
              afterwards.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>What Firmcraft contributes</h2>
              <ul className="partners-list">
                {contributions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                Firmcraft is led by an advisor with more than two decades in enterprise software and
                digital transformation. The same person designs the process, understands the
                systems it runs on, and builds and operates the artificial intelligence that
                supports it.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>How engagements are structured</h2>
              {models.map((model) => (
                <div className="partners-model" key={model.title}>
                  <h3>{model.title}</h3>
                  <p>{model.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>The partner firm&apos;s client relationship</h2>
              <p>
                Firmcraft does not approach a partner firm&apos;s clients for separate work without
                that firm&apos;s agreement.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Ownership, data, and model independence</h2>
              <p>
                The software built for a client belongs to the client, under the arrangement
                described in <Link href="/adaptable-software">Adaptable Software</Link>. Client
                data stays in the client&apos;s own environment unless there is a specific, agreed
                reason to move it, as set out in <Link href="/sovereignty">Data Sovereignty</Link>.
                Firmcraft does not tie a deployment to a single model provider, so models can be
                changed as costs and capabilities change.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Firms that work across several businesses</h2>
              <p>
                Some partners work across several operating companies, such as private equity
                operating teams and firms that invest in and build businesses. For these partners,
                Firmcraft applies the same method in each company and reuses what has already been
                proven. Each later deployment starts from a tested foundation, and its results are
                reported against that company&apos;s own starting measurements.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Independence</h2>
              <p>
                Firmcraft&apos;s partner arrangements are with advisory firms. Firmcraft does not
                resell software or receive vendor margin, and these arrangements do not change
                that. The method Firmcraft follows in each engagement is described in{' '}
                <Link href="/how-we-work">How We Work</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Questions partner firms ask</h2>
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
