import Link from 'next/link'

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Playbooks', href: '/playbooks' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Security', href: '/security' },
  { label: 'Integrations', href: '/integrations' },
]

type Current = 'home' | 'playbooks' | 'capabilities' | 'security' | 'integrations'

export function SiteHeader({ current }: { current?: Current }) {
  return (
    <header className="warm-nav">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif-warm italic font-medium text-[22px] tracking-[-0.01em] text-ink"
        >
          <span className="brand-mark" /> Firmcraft
        </Link>

        <nav className="hidden md:flex gap-6 text-sm text-ink-2">
          {NAV_ITEMS.map((item) => {
            const isCur =
              (current === 'playbooks' && item.href === '/playbooks') ||
              (current === 'capabilities' && item.href === '/capabilities') ||
              (current === 'security' && item.href === '/security') ||
              (current === 'integrations' && item.href === '/integrations')
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
          <Link href="/" className="btn btn-ghost hidden sm:inline-flex">
            Home
          </Link>
          <a
            href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
            className="btn btn-primary"
          >
            Book a call →
          </a>
        </div>
      </div>
    </header>
  )
}
