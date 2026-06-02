'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { LayoutGrid, Users, Settings, ClipboardList, Bell, LifeBuoy, Activity, Handshake, Send, Menu, X, BarChart3, Inbox } from 'lucide-react'
import { Logo } from './Logo'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/leads', label: 'Leads', icon: Inbox },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/partners', label: 'Partners', icon: Handshake },
  { href: '/onboarding', label: 'Submissions', icon: ClipboardList },
  { href: '/outreach', label: 'Outreach', icon: Send },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/status', label: 'Status', icon: Activity },
  { href: '/support', label: 'Support', icon: LifeBuoy },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const renderNavLinks = (onClick?: () => void) =>
    NAV.map(({ href, label, icon: Icon }) => {
      const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
      return (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors ${
            active
              ? 'bg-paper-2 text-ink font-medium border-l-2 border-accent pl-[10px]'
              : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      )
    })

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-none flex-col border-r border-line bg-[#0E0B08] sticky top-0 self-start h-screen">
        <div className="px-5 h-16 flex items-center border-b border-line">
          <Link href="/" className="no-underline">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 grid gap-1 content-start">
          {renderNavLinks()}
        </nav>
        <div className="p-4 border-t border-line text-[12px] text-muted font-mono-warm">
          firmcraft-admin · v0.1
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[260px] max-w-[80vw] flex flex-col border-r border-line bg-[#0E0B08] h-full">
            <div className="px-5 h-16 flex items-center justify-between border-b border-line">
              <Link href="/" className="no-underline" onClick={() => setMobileOpen(false)}>
                <Logo />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 grid place-items-center rounded-full border border-line-2 text-ink-2 hover:text-ink hover:border-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 grid gap-1 content-start overflow-y-auto">
              {renderNavLinks(() => setMobileOpen(false))}
            </nav>
            <div className="p-4 border-t border-line text-[12px] text-muted font-mono-warm">
              firmcraft-admin · v0.1
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-line bg-paper/85 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          {/* Mobile hamburger + logo */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link href="/" className="no-underline">
              <Logo />
            </Link>
          </div>
          <div className="hidden md:block text-[13px] text-muted font-mono-warm uppercase tracking-[0.12em]">
            admin.firmcraft.ai
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full bg-accent grid place-items-center text-white font-mono-warm text-[12px]">
              DD
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-6 py-8">
          <div className="max-w-[1240px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
