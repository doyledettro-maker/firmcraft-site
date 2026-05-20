import Link from 'next/link'
import { BrandMark } from './BrandMark'
import { MobileMenu } from './MobileMenu'

const NAV_ITEMS: { label: string; href: string; key: string }[] = [
  { label: 'Services', href: '/services', key: 'services' },
  { label: 'Operator', href: '/managed-ai', key: 'managed-ai' },
  { label: 'Pricing', href: '/pricing', key: 'pricing' },
  { label: 'Methodology', href: '/methodology', key: 'methodology' },
  { label: 'About', href: '/about', key: 'about' },
]

export type SiteHeaderCurrent =
  | 'home'
  | 'services'
  | 'managed-ai'
  | 'pricing'
  | 'methodology'
  | 'about'

export function SiteHeader({ current }: { current?: SiteHeaderCurrent }) {
  return (
    <header className="site-header">
      <div className="wrap row">
        <Link href="/" aria-label="Firmcraft home" className="wm-mark" style={{ color: 'var(--color-ink)' }}>
          <BrandMark size={26} />
          <span className="wm">Firmcraft</span>
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
          <Link href="/pricing" className="btn ghost sm hidden md:inline-flex">
            Pricing
          </Link>
          <a
            href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
            className="btn primary sm"
          >
            Book a call <span className="arr">→</span>
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
