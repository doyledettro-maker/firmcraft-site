import Link from 'next/link'
import { BrandMark } from './BrandMark'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterColumn = { heading: string; links: FooterLink[] }

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Services',
    links: [
      { label: 'AI Readiness Assessment', href: '/services#assess' },
      { label: 'Implementation', href: '/services#build' },
      { label: 'Managed Operations', href: '/services#operate' },
      { label: 'Fractional Advisory', href: '/services#advisory' },
    ],
  },
  {
    heading: 'Practice',
    links: [
      { label: 'Firmcraft Operator', href: '/managed-ai' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'About', href: '/about' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Playbooks', href: '/playbooks' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Security & sovereignty', href: '/security' },
      { label: 'Workforce training ↗', href: 'https://skillcalibrate.com', external: true },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: 'hello@firmcraft.ai', href: 'mailto:hello@firmcraft.ai', external: true },
      {
        label: 'Book a call',
        href: '/contact',
        external: true,
      },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/firmcraft-ai/', external: true },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="brand">
            <Link href="/" aria-label="Firmcraft home" className="wm-mark" style={{ color: '#fff' }}>
              <BrandMark size={26} className="brand-mark" />
              <span className="wm" style={{ color: '#fff' }}>
                Firmcraft
              </span>
            </Link>
            <p>
              An AI implementation, integration, and enablement firm for finance- and
              operations-driven SMBs running ERPs.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="col">
              <h5>{col.heading}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.href}-${link.label}`}>
                    {link.external ? (
                      <a
                        href={link.href}
                        rel={link.href.startsWith('http') ? 'noopener' : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="legal">
          <span>© 2026 Firmcraft · Sovereign by default</span>
          <span>
            <a href="/terms">Terms</a>
            {' · '}
            <a href="/privacy">Privacy</a>
            {' · '}
            <a href="/trust">Trust</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
