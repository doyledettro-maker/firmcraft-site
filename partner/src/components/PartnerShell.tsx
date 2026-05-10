'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { LayoutGrid, Users, DollarSign, FilePlus, LogOut } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
import { Logo } from './Logo'

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/clients', label: 'My clients', icon: Users },
  { href: '/commissions', label: 'Commissions', icon: DollarSign },
  { href: '/submit', label: 'Submit client', icon: FilePlus },
]

export function PartnerShell({ children, partnerName }: { children: ReactNode; partnerName: string }) {
  const pathname = usePathname()

  const initials = partnerName
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen flex">
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
                    ? 'bg-paper-2 text-ink font-medium border-l-2 border-accent pl-[10px]'
                    : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-accent' : ''}`} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-line text-[12px] text-muted font-mono-warm">
          firmcraft-partners · v0.1
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-line bg-paper/85 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="md:hidden">
            <Link href="/" className="no-underline">
              <Logo />
            </Link>
          </div>
          <div className="hidden md:block text-[13px] text-muted font-mono-warm uppercase tracking-[0.12em]">
            partners.firmcraft.ai
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[13px] text-ink-2">{partnerName}</span>
            <div className="w-9 h-9 rounded-full bg-accent-2 grid place-items-center text-white font-mono-warm text-[12px]">
              {initials}
            </div>
            <SignOutButton redirectUrl="/login">
              <button
                title="Sign out"
                className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-ink text-ink-2 hover:text-ink transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </SignOutButton>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="max-w-[1240px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
