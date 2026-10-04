'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  const [scrolled, setScrolled] = useState(false)
  const overHero = current === 'home'

  useEffect(() => {
    if (!overHero) return

    function onScroll() {
      setScrolled(window.scrollY > 80)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  const inverse = overHero && !scrolled

  return (
    <header className={`site-header${overHero ? ' over-hero' : ''}${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap row">
        <Link href="/" aria-label="Firmcraft home" className="wm-link">
          <FirmcraftWordmark size={22} variant={inverse ? 'inverse' : 'default'} />
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
            className={`btn sm${inverse ? ' brass' : ' primary'}`}
          >
            Contact Firmcraft
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
