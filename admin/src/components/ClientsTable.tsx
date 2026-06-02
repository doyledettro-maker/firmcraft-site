'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from './ui'
import { StatusBadge } from './StatusBadge'
import type { Client, ClientStatus } from '@/lib/mock-clients'
import { getPartnerForClient } from '@/lib/mock-partners'
import { formatCurrency, formatDate, formatSpend } from '@/lib/format'

const FILTERS: Array<{ key: 'all' | ClientStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'suspended', label: 'Suspended' },
]

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (q) {
        const partner = getPartnerForClient(c.id)
        const haystack = `${c.name} ${c.industry} ${c.contactName} ${c.contactEmail} ${partner?.name ?? ''}`
        if (!haystack.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [clients, filter, query])

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-line flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            placeholder="Search by company, contact, industry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-paper-2 p-1 rounded-full">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors ${
                filter === f.key ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <Th>Client</Th>
              <Th>Status</Th>
              <Th>Plan</Th>
              <Th>Partner</Th>
              <Th className="text-right">MRR</Th>
              <Th className="text-right">Users</Th>
              <Th>Token usage / mo</Th>
              <Th>Added</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const partner = getPartnerForClient(c.id)
              return (
                <tr key={c.id} className="hover:bg-paper-2 transition-colors">
                  <td className="px-4 py-3 border-t border-line">
                    <Link href={`/clients/${c.id}`} className="block">
                      <div className="font-medium text-ink">{c.name}</div>
                      <div className="text-[12.5px] text-muted">{c.industry} · {c.contactEmail}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 border-t border-line font-mono-warm text-[12px] uppercase tracking-[0.12em] text-ink-2">
                    {c.planTier}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px]">
                    {partner ? (
                      <Link
                        href={`/partners/${partner.id}`}
                        className="text-accent-2 hover:underline underline-offset-2"
                      >
                        {partner.name}
                      </Link>
                    ) : (
                      <span className="text-muted">Direct</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">{formatCurrency(c.monthlyRevenue)}</td>
                  <td className="px-4 py-3 border-t border-line text-right tabular-nums">
                    {c.usage.activeUsers}<span className="text-muted">/{c.usage.seats}</span>
                  </td>
                  <td className="px-4 py-3 border-t border-line min-w-[170px]">
                    <SpendBar spend={c.usage.costThisMonth} allowance={c.tokenAllowance} />
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                </tr>
              )
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted border-t border-line">
                  No clients match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SpendBar({ spend, allowance }: { spend: number; allowance: number }) {
  const hasBudget = allowance > 0
  const pct = hasBudget ? Math.round((spend / allowance) * 100) : 0
  // green < 50%, yellow 50–80%, red > 80%
  const tone = !hasBudget
    ? 'bg-line-2'
    : pct > 80
      ? 'bg-status-down'
      : pct >= 50
        ? 'bg-status-warn'
        : 'bg-status-up'

  return (
    <div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[12.5px] text-ink tabular-nums">
          {formatSpend(spend)}
          <span className="text-muted"> / {hasBudget ? formatSpend(allowance) : '—'}</span>
        </span>
        {hasBudget ? (
          <span className="text-[11.5px] text-muted tabular-nums">{pct}%</span>
        ) : null}
      </div>
      <div className="mt-1.5 h-1.5 bg-paper rounded-full overflow-hidden border border-line">
        <div
          className={`h-full ${tone} transition-all`}
          style={{ width: `${hasBudget ? Math.min(100, pct) : 0}%` }}
        />
      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}>
      {children}
    </th>
  )
}
