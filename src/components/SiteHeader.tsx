import Link from 'next/link'
import { FirmcraftWordmark } from './FirmcraftWordmark'
import { MobileMenu } from './MobileMenu'

const NAV_ITEMS: { label: string; href: string; key: string }[] = [
  { label: 'Advisory', href: '/advisory', key: 'advisory' },
  { label: 'How We Work', href: '/how-we-work', key: 'how-we-work' },
  { label: 'For Small Business', href: '/for-small-business', key: 'for-small-business' },
  { label: 'About', href: '/about', key: 'about' },
]

export type SiteHeaderCurrent =
  | 'home'
  | 'advisory'
  | 'how-we-work'
  | 'for-small-business'
  | 'sovereignty'
  | 'about'

export function SiteHeader({ current }: { current?: SiteHeaderCurrent }) {
  return (
    <header className="site-header">
      <div className="wrap row">
        <Link href="/" aria-label="Firmcraft home" className="wm-link">
          <FirmcraftWordmark size={21} />
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isCur = current === item.key
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCur ? 'page' : undefined}
                className={`link${isCur ? ' current' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="right">
          <a
            href="/contact"
            className="btn primary sm"
          >
            Contact
          </a>
          <MobileMenu
            items={NAV_ITEMS.map((n) => ({ label: n.label, href: n.href }))}
            current={current}
          />
        </div>
      </div>
    </header>
  )
}
