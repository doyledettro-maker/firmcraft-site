import Link from 'next/link'
import { BrandMark } from './BrandMark'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterColumn = { heading: string; links: FooterLink[] }

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Capabilities', href: '/capabilities' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Playbooks', href: '/playbooks' },
      { label: 'Security', href: '/security' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { label: 'Start onboarding', href: '/get-started' },
      { label: 'Book a call', href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call', external: true },
      { label: 'Workforce Training', href: 'https://skillcalibrate.com', external: true },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)] text-[13px] text-ink-2">
      <div className="max-w-[1280px] mx-auto px-8 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display italic font-medium text-[22px] tracking-[-0.01em] text-ink"
            >
              <BrandMark /> Firmcraft
            </Link>
            <p className="max-w-[260px] text-[13.5px] leading-[1.55] text-ink-2">
              AI operations for growing professional-services firms.
            </p>
            <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-line)] bg-paper px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-eyebrow text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              AES-256 Encrypted
            </span>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-ink-2 transition-colors hover:text-signal"
                        rel={link.href.startsWith('http') ? 'noopener' : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-ink-2 transition-colors hover:text-signal"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-6 font-mono text-[11px] uppercase tracking-eyebrow text-muted">
          <span>&copy; 2026 Predictium LLC</span>
          <span>
            Need workforce training?{' '}
            <a
              href="https://skillcalibrate.com"
              className="underline transition-colors hover:text-ink"
              rel="noopener"
            >
              SkillCalibrate
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
