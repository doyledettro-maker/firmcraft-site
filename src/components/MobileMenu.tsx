'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type NavItem = { label: string; href: string; external?: boolean }

type Props = {
  items: NavItem[]
  current?: string
}

export function MobileMenu({ items, current }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu-drawer"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-2)] text-ink transition-colors hover:bg-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </>
          )}
        </svg>
      </button>

      <div
        id="mobile-menu-drawer"
        role="dialog"
        aria-modal="false"
        aria-hidden={!open}
        className={`absolute left-0 right-0 top-16 origin-top overflow-hidden border-b border-[var(--line)] bg-[rgba(251,244,234,0.98)] backdrop-blur-[14px] transition-[max-height,opacity] duration-200 ease-out ${
          open ? 'max-h-[640px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <nav className="mx-auto flex max-w-[1280px] flex-col gap-1 px-8 py-5 text-[15px]">
          {items.map((item) => {
            const isCur = current && item.href === `/${current}`
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  rel="noopener"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-ink-2 transition-colors hover:bg-white hover:text-ink"
                >
                  {item.label}
                </a>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isCur ? 'page' : undefined}
                className={`rounded-lg px-3 py-2.5 transition-colors ${
                  isCur
                    ? 'bg-white font-medium text-ink'
                    : 'text-ink-2 hover:bg-white hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/get-started"
            onClick={() => setOpen(false)}
            className="btn btn-ghost mt-3 w-full justify-center"
          >
            Get started
          </Link>
        </nav>
      </div>
    </div>
  )
}
