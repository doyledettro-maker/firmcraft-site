import Link from 'next/link'
import { BrandMark } from './BrandMark'
import { MobileMenu } from './MobileMenu'

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Playbooks', href: '/playbooks' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Security', href: '/security' },
  { label: 'Support', href: '/support' },
]

type Current =
  | 'home'
  | 'how-it-works'
  | 'capabilities'
  | 'pricing'
  | 'playbooks'
  | 'integrations'
  | 'security'
  | 'support'

export function SiteHeader({ current }: { current?: Current }) {
  return (
    <header className="warm-nav relative">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif-warm italic font-medium text-[22px] tracking-[-0.01em] text-ink"
        >
          <BrandMark /> Firmcraft
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-2">
          {NAV_ITEMS.map((item) => {
            const isCur = current && item.href === `/${current}`
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCur ? 'page' : undefined}
                className={
                  isCur
                    ? 'text-ink font-medium'
                    : 'hover:text-accent transition-colors'
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex gap-2.5 items-center">
          <Link href="/get-started" className="btn btn-ghost hidden md:inline-flex">
            Get started
          </Link>
          <a
            href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
            className="btn btn-primary"
          >
            Book a call →
          </a>
          <MobileMenu items={NAV_ITEMS} current={current} />
        </div>
      </div>
    </header>
  )
}
