import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import '../services/services.css'

export const metadata: Metadata = {
  title: 'For Small Business — Firmcraft',
  description:
    'A managed artificial intelligence capability for smaller organizations, operated by Firmcraft.',
  alternates: { canonical: '/for-small-business' },
}

export default function ForSmallBusinessPage() {
  return (
    <>
      <SiteHeader current="for-small-business" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>For small business</h1>
            <p className="lede">
              Smaller organizations often need the same operational relief as mid-market companies
              without the scale to justify a full advisory engagement. For these clients, Firmcraft
              operates a managed artificial intelligence capability directly.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="pkg-head">
              <h2>What it does</h2>
              <p>
                The capability operates within the tools a business already uses for day-to-day
                communication. It handles routine administrative work — drafting and issuing
                documents, managing correspondence, scheduling, and following up on outstanding
                items — and connects to the systems the business already relies on.
              </p>
              <p>
                It is operated by Firmcraft rather than installed and handed over. Configuration,
                maintenance, and changes are handled as part of the service.
              </p>
            </div>
          </div>
        </section>

        <section className="sec surface-2">
          <div className="wrap">
            <div className="pkg-head">
              <h2>Who it suits</h2>
              <p>
                This is appropriate for owner-operated and small-team businesses where
                administrative work is absorbing time that should be spent on the work itself, and
                where there is no one on staff whose role is to configure and maintain software.
              </p>
              <p>
                Larger organizations often want the same capability, operated across departments
                and connected to more systems. That work is handled within an advisory engagement
                rather than as a standalone service.
              </p>
            </div>
          </div>
        </section>

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start a conversation</h2>
              <Link className="btn primary lg" href="/contact">
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
