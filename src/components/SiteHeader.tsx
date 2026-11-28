import Link from 'next/link'
import { FirmcraftMark } from './home/FirmcraftMark'
import { MobileMenu } from './MobileMenu'

// Ledger header for every inner page. Links match the homepage nav.
const NAV_ITEMS: { label: string; href: string; key: string }[] = [
  { label: 'Diagnostic', href: '/diagnostic', key: 'diagnostic' },
  { label: 'Services', href: '/#services', key: 'services' },
  { label: 'Selected Work', href: '/work', key: 'work' },
  { label: 'Private equity', href: '/#pe', key: 'pe' },
  { label: 'About', href: '/about', key: 'about' },
]

const MOBILE_ITEMS = [
  { label: 'The Diagnostic', href: '/diagnostic' },
  { label: 'Services', href: '/#services' },
  { label: 'Advisory', href: '/advisory' },
  { label: 'How We Work', href: '/how-we-work' },
  { label: 'Selected Work', href: '/work' },
  { label: 'Private equity', href: '/#pe' },
  { label: 'About', href: '/about' },
]

export type SiteHeaderCurrent =
  | 'home'
  | 'diagnostic'
  | 'advisory'
  | 'how-we-work'
  | 'for-small-business'
  | 'sovereignty'
  | 'work'
  | 'about'

export function SiteHeader({
  current,
  ctaHref = '/diagnostic',
}: {
  current?: SiteHeaderCurrent
  /** Kept for older call sites; every page now uses the Ledger header. */
  marketing?: boolean
  ctaHref?: string
}) {
  return (
    <header className="lh-header">
      <div className="wrap lh-row">
        <Link href="/" aria-label="Firmcraft home" className="lh-brand">
          <FirmcraftMark size={30} />
          <b>Firmcraft</b>
        </Link>
        <div className="lh-right">
          <ul className="lh-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={current === item.key ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a className="lh-btn" href={ctaHref}>
            Book a call
          </a>
          <MobileMenu items={MOBILE_ITEMS} current={current} marketing ctaHref={ctaHref} />
        </div>
      </div>
    </header>
  )
}
