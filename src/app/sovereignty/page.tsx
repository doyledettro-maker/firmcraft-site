import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import '../services/services.css'

export const metadata: Metadata = {
  title: 'Data Sovereignty — Firmcraft',
  description:
    "How Firmcraft handles client data, what runs inside a client's own environment, and how those decisions are made.",
  alternates: { canonical: '/sovereignty' },
}

const sections = [
  {
    title: 'The default position',
    body:
      "Where an artificial intelligence capability can reasonably be operated inside a client's own infrastructure, that is how Firmcraft builds it. Client records, documents, and operational data remain within the client's control, and the organization retains the ability to audit what has been processed and when.",
  },
  {
    title: 'When hosted services are appropriate',
    body:
      'There are tasks for which a hosted model is the better tool, and Firmcraft will recommend one where that is the case. Where it does, three conditions apply. The decision is made explicitly and recorded, rather than arrived at because it was the simpler path to build. The data handling terms are reviewed and found acceptable by the client. And the categories of data involved are agreed in advance rather than determined during implementation.',
  },
  {
    title: 'What clients own',
    body:
      "Firmcraft deploys an open-source foundation, licensed under Apache 2.0, when a self-hosted and client-owned configuration is the appropriate answer. Where that applies, the client owns the deployment. Firmcraft maintains it under the managed services relationship, but the client is not dependent on that relationship continuing in order to keep operating. This is not offered as a required component of every engagement. Where a client's circumstances call for a different configuration, that is what Firmcraft builds.",
  },
  {
    title: 'Commitments in writing',
    body:
      'Sovereignty commitments belong in the engagement agreement rather than on a marketing page. Firmcraft will put its data handling undertakings into the contract, and expects to be asked to.',
  },
]

export default function SovereigntyPage() {
  return (
    <>
      <SiteHeader current="sovereignty" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Data sovereignty</h1>
            <p className="lede">
              Firmcraft&apos;s default position is that client data remains within the
              client&apos;s own environment. This page sets out what that means in practice and how
              the decisions are made.
            </p>
          </div>
        </section>

        {sections.map((section, index) => (
          <section className={`sec${index % 2 ? ' surface-2' : ''}`} key={section.title}>
            <div className="wrap">
              <div className="pkg-head">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  )
}
