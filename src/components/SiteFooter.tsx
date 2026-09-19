import Link from 'next/link'
import { FirmcraftWordmark } from './FirmcraftWordmark'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterColumn = { heading: string; links: FooterLink[] }

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Practice',
    links: [
      { label: 'Advisory', href: '/advisory' },
      { label: 'How We Work', href: '/how-we-work' },
      { label: 'Data Sovereignty', href: '/sovereignty' },
      { label: 'For Small Business', href: '/for-small-business' },
    ],
  },
  {
    heading: 'Firm',
    links: [
      { label: 'About', href: '/about' },
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
            <Link href="/" aria-label="Firmcraft home" className="wm-link">
              <FirmcraftWordmark size={21} variant="inverse" />
            </Link>
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
          <span>© {new Date().getFullYear()} Firmcraft</span>
        </div>
      </div>
    </footer>
  )
}
