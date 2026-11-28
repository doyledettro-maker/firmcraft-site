import Link from 'next/link'
import { FirmcraftMark } from './home/FirmcraftMark'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterColumn = { heading: string; links: FooterLink[] }

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Practice',
    links: [
      { label: 'Advisory', href: '/advisory' },
      { label: 'How We Work', href: '/how-we-work' },
      { label: 'Managed AI Services', href: '/managed-ai-services' },
      { label: 'Data Sovereignty', href: '/sovereignty' },
      { label: 'Adaptable Software', href: '/adaptable-software' },
      { label: 'Commissioned Software', href: '/commissioned-software' },
      { label: 'For Small Business', href: '/for-small-business' },
      { label: 'Partner Firms', href: '/partners' },
    ],
  },
  {
    heading: 'Firm',
    links: [
      { label: 'Selected Work', href: '/work' },
      { label: 'About', href: '/about' },
      { label: 'The Diagnostic', href: '/diagnostic' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Related',
    links: [
      { label: 'SkillCalibrate', href: 'https://skillcalibrate.com', external: true },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="brand">
            <Link href="/" aria-label="Firmcraft home" className="lf-brand">
              <FirmcraftMark size={28} color="#FFFFFF" />
              <b>Firmcraft</b>
            </Link>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="col">
              <div className="col-heading">{col.heading}</div>
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
          <span>© {new Date().getFullYear()} Firmcraft</span>
        </div>
      </div>
    </footer>
  )
}
