import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms of use for the firmcraft.ai website. Client engagements are governed by separate, signed services agreements.',
  alternates: { canonical: '/terms' },
}

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: 'Scope',
    body: (
      <p>
        These terms govern your use of the firmcraft.ai website. Consulting engagements,
        Firmcraft Operator subscriptions, and managed services are governed by separate, signed
        agreements (statement of work, services agreement, and where applicable a Data
        Processing Agreement or Business Associate Agreement). If a signed agreement conflicts
        with these terms, the signed agreement wins.
      </p>
    ),
  },
  {
    h: 'Use of the site',
    body: (
      <p>
        You may browse, link to, and quote this site for any lawful purpose. Don&apos;t misuse
        it: no attempting to breach security, no scraping form endpoints, no submitting forms
        with someone else&apos;s identity. We may suspend access that abuses the site or its
        APIs.
      </p>
    ),
  },
  {
    h: 'Content & no professional advice',
    body: (
      <p>
        Content on this site is general information about our services, not professional advice.
        Pricing, timelines, and service descriptions are indicative and may change; the binding
        version is whatever we put in a signed proposal. Although our founder is a CPA, nothing
        on this site constitutes accounting, tax, or legal advice, and reading it does not
        create a client relationship.
      </p>
    ),
  },
  {
    h: 'Intellectual property',
    body: (
      <p>
        The Firmcraft name, wordmark, and site content are ours. Hermes Agent — the open-source
        platform our managed deployments run on — is separately licensed under its own
        open-source license by its maintainers; nothing here restricts your rights under that
        license.
      </p>
    ),
  },
  {
    h: 'Disclaimers & liability',
    body: (
      <p>
        The site is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we
        disclaim implied warranties and are not liable for indirect or consequential damages
        arising from use of the site. Our total liability arising from the site is limited to
        $100. (Liability for paid services is addressed in the applicable services agreement,
        not here.)
      </p>
    ),
  },
  {
    h: 'Governing law & changes',
    body: (
      <p>
        These terms are governed by the laws of the State of Illinois, USA. We may update them
        from time to time; the effective date below reflects the latest revision. Questions:{' '}
        <a href="mailto:hello@firmcraft.ai">hello@firmcraft.ai</a>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="sec">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <div className="eyebrow">Legal</div>
            <h1
              style={{
                fontWeight: 500,
                fontSize: 'clamp(36px,4.4vw,56px)',
                letterSpacing: '-.022em',
                lineHeight: 1.05,
                margin: '12px 0 10px',
              }}
            >
              Terms of <em>Use</em>
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: '0 0 36px' }}>
              Effective June 12, 2026.
            </p>
            {SECTIONS.map((s) => (
              <section key={s.h} style={{ margin: '0 0 32px' }}>
                <h2
                  style={{
                    fontWeight: 600,
                    fontSize: 22,
                    letterSpacing: '-.012em',
                    margin: '0 0 10px',
                  }}
                >
                  {s.h}
                </h2>
                <div
                  style={{
                    color: 'var(--color-ink-2)',
                    fontSize: 15.5,
                    lineHeight: 1.65,
                  }}
                  className="legal-body"
                >
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
