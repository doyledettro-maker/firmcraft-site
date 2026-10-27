import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { serviceJsonLd } from '@/lib/structured-data'
import './commissioned-software.css'

export const metadata: Metadata = {
  title: 'Commissioned Software',
  description:
    'Firmcraft builds systems that organizations commonly obtain by subscription, to the client’s specification, and transfers them to the client to host, own, and change.',
  alternates: { canonical: '/commissioned-software' },
}

const SERVICE = serviceJsonLd({
  name: 'Commissioned software',
  serviceType: 'Custom software development with transfer of ownership to the client',
  url: '/commissioned-software',
  description:
    'Systems commonly obtained by subscription, built to the client’s specification and transferred to the client with source code, documentation, and agent instructions, so the client can host and change them independently.',
})

const steps = [
  {
    label: 'Review of the current system.',
    body: 'Firmcraft establishes which functions of the current system are relied on, what data it holds, which other systems it connects to, and when the subscription renews.',
  },
  {
    label: 'Specification.',
    body: 'The specification is written from how the organization performs the work, using the same process redesign that precedes every Firmcraft implementation.',
  },
  {
    label: 'Cost comparison.',
    body: 'Before any work is commissioned, Firmcraft compares the expected cost of the new system over its working life, including hosting, support, and further development, with the cost of the subscription it would replace. The client decides on that basis.',
  },
  {
    label: 'Build and data transfer.',
    body: 'The system is built, records are transferred from the existing system, and the two run in parallel until the new system is confirmed to be working. Where possible, the change is timed to the renewal date of the subscription being replaced.',
  },
  {
    label: 'Handover.',
    body: (
      <>
        The client receives the source code, infrastructure configuration, documentation, test
        suite, and agent instructions described in{' '}
        <Link href="/adaptable-software">Adaptable Software</Link>. Staff who will maintain the
        system can be trained through{' '}
        <a href="https://skillcalibrate.com" target="_blank" rel="noopener noreferrer">
          SkillCalibrate
        </a>
        .
      </>
    ),
  },
  {
    label: 'Support.',
    body: 'Firmcraft remains available for support and further development under its managed services. The client does not need to retain Firmcraft in order to keep using or changing the system.',
  },
]

const sections = [
  {
    title: 'Systems suited to this approach',
    body: [
      'The approach suits systems that organize a particular workflow: receiving applications or requests, routing them for review, recording decisions, scheduling work, and reporting on progress. Organizations often obtain these systems by subscription and configure them to approximate how they work, and much of the capability they pay for goes unused.',
      'It is generally not suited to software whose value depends on content the vendor maintains for its customers, such as payroll tax rules, or to widely used general-purpose tools. Where a subscription is the better arrangement, Firmcraft recommends keeping it.',
    ],
  },
]

const closingSections = [
  {
    title: 'Responsibilities after handover',
    body: [
      'Once the system is handed over, the client is responsible for operating it, including hosting, backups, security updates, access management, and accessibility conformance. Firmcraft sets out these responsibilities in writing at handover and can carry them out on the client’s behalf under its managed services.',
    ],
  },
  {
    title: 'For public bodies',
    body: [
      'Public bodies in a number of jurisdictions are required to own the software developed for them, to make it available to other public bodies, and to meet accessibility and records obligations in the systems they operate. Software that Firmcraft builds for a public body is delivered with the rights and documentation those obligations require, and is built to recognized accessibility standards.',
    ],
  },
]

export default function CommissionedSoftwarePage() {
  return (
    <>
      <SiteHeader marketing />
      <JsonLd data={SERVICE} />
      <main className="marketing-inner commissioned-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Practice</p>
            <h1>Commissioned Software</h1>
            <p className="lede">
              Many organizations rely on subscription software for systems that support one
              particular process, such as permitting and licensing, case management, grants
              administration, inspections, or service requests. Firmcraft builds systems of this
              kind to the client&apos;s specification and transfers them to the client. The client
              hosts the system in its own environment, owns its source code and documentation, and
              can change it with its own staff or with AI coding tools. Firmcraft supports the
              system under its managed services where the client wishes.
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

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>How the work proceeds</h2>
              <ol className="commissioned-steps">
                {steps.map((step) => (
                  <li key={step.label}>
                    <span>
                      <strong>{step.label}</strong> {step.body}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {closingSections.map((section) => (
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

        <section className="commissioned-closing">
          <div className="wrap">
            <div className="commissioned-cta">
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
