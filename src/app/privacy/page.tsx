import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Firmcraft collects, uses, and protects information on firmcraft.ai and in our services. First-party analytics only, no ad trackers, no sale of personal data.',
  alternates: { canonical: '/privacy' },
}

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: 'Who we are',
    body: (
      <p>
        Firmcraft (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is an AI consulting firm based in the
        Springfield, Illinois area, serving small and mid-sized businesses in central Illinois,
        Houston, Texas, and across the United States. This policy covers the firmcraft.ai
        website. Data handling inside client deployments is governed by each client&apos;s
        services agreement and, where applicable, a Data Processing Agreement or Business
        Associate Agreement — see our <a href="/security">Security &amp; sovereignty</a> page.
      </p>
    ),
  },
  {
    h: 'What we collect on this site',
    body: (
      <>
        <p>
          <strong>Information you give us.</strong> When you submit the contact, support, or
          onboarding forms, we collect what you enter — typically your name, email, phone,
          company, and your message. We use it to respond to you, scope an engagement, and
          deliver services. It is stored in our own systems and sent to us by email.
        </p>
        <p>
          <strong>First-party analytics.</strong> We run a minimal, first-party page-view counter:
          the path you visited and the referring page. It is sent to our own servers, not to an
          advertising network. We honor the Do&nbsp;Not&nbsp;Track browser signal. We do not use
          third-party advertising trackers, and we do not set advertising cookies.
        </p>
        <p>
          <strong>Hosting logs.</strong> Our hosting providers (Vercel, Cloudflare) keep standard
          server logs — IP address, user agent, requested URL — for security and operations.
        </p>
      </>
    ),
  },
  {
    h: 'How we use information',
    body: (
      <ul>
        <li>To respond to inquiries and provide the services you request.</li>
        <li>To operate, secure, and improve the website.</li>
        <li>To send service-related email (we don&apos;t run marketing email lists from this site without your consent).</li>
        <li>To comply with legal obligations.</li>
      </ul>
    ),
  },
  {
    h: 'What we don’t do',
    body: (
      <ul>
        <li>We do not sell or rent personal information.</li>
        <li>We do not share form submissions with advertisers or data brokers.</li>
        <li>We do not use the contents of your inquiries to train AI models.</li>
      </ul>
    ),
  },
  {
    h: 'Service providers',
    body: (
      <p>
        We use a small number of vendors to run this site: Vercel (hosting), Cloudflare (DNS and
        network security), Supabase (form and lead storage), and Resend (transactional email).
        Each processes data only to provide its service to us.
      </p>
    ),
  },
  {
    h: 'Retention & your rights',
    body: (
      <p>
        We keep inquiry records for as long as needed to serve you and meet our legal
        obligations. You can ask us to access, correct, or delete personal information we hold
        about you — email <a href="mailto:hello@firmcraft.ai">hello@firmcraft.ai</a> and we&apos;ll
        respond within a reasonable time. If you are in a jurisdiction with specific privacy
        rights (for example, the EU/UK or California), we will honor requests consistent with
        the law that applies to you.
      </p>
    ),
  },
  {
    h: 'Contact',
    body: (
      <p>
        Questions about this policy: <a href="mailto:hello@firmcraft.ai">hello@firmcraft.ai</a> or
        (217)&nbsp;303-8319. Security questions or disclosures:{' '}
        <a href="mailto:security@firmcraft.ai">security@firmcraft.ai</a>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
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
              Privacy <em>Policy</em>
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: '0 0 36px' }}>
              Effective June 12, 2026. We&apos;ll note material changes here.
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
