'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { LayoutGrid, Users, Settings, ClipboardList, Bell, LifeBuoy, Activity } from 'lucide-react'
import { Logo } from './Logo'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/onboarding', label: 'Onboarding', icon: ClipboardList },
  { href: '/status', label: 'Status', icon: Activity },
  { href: '/support', label: 'Support', icon: LifeBuoy },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-none flex-col border-r border-line bg-paper sticky top-0 self-start h-screen">
        <div className="px-5 h-16 flex items-center border-b border-line">
          <Link href="/" className="no-underline">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 grid gap-1 content-start">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors ${
                  active
                    ? 'bg-paper-2 text-ink font-medium'
                    : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-line text-[12px] text-muted font-mono-warm">
          firmcraft-admin · v0.1
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-line bg-paper/85 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
          {/* Mobile logo */}
          <div className="md:hidden">
            <Link href="/" className="no-underline">
              <Logo />
            </Link>
          </div>
          <div className="hidden md:block text-[13px] text-muted font-mono-warm uppercase tracking-[0.12em]">
            admin.firmcraft.ai
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-ink text-ink-2 hover:text-ink transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full bg-accent grid place-items-center text-white font-mono-warm text-[12px]">
              DD
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="max-w-[1240px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
