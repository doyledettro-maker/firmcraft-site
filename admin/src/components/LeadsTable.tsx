'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronDown, Mail, Phone, Building2 } from 'lucide-react'
import { Input, Select, Textarea, Button, Badge } from './ui'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES, type Lead, type LeadStatus } from '@/lib/db/leads'

const STATUS_TONE: Record<LeadStatus, 'blue' | 'amber' | 'green' | 'neutral'> = {
  new: 'blue',
  contacted: 'amber',
  qualified: 'amber',
  converted: 'green',
  archived: 'neutral',
}

const FILTERS: Array<{ key: 'all' | LeadStatus; label: string }> = [
  { key: 'all', label: 'All' },
  ...LEAD_STATUSES.map((s) => ({ key: s, label: s[0].toUpperCase() + s.slice(1) })),
]

export function LeadsTable({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false
      if (q) {
        const hay = `${l.name} ${l.email} ${l.company ?? ''} ${l.source ?? ''} ${l.message ?? ''}`
        if (!hay.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [leads, filter, query])

  const patchLead = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Update failed')
    }
    const { lead } = (await res.json()) as { lead: Lead }
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)))
    return lead
  }

  const onStatusChange = async (id: string, status: LeadStatus) => {
    // optimistic
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    try {
      await patchLead(id, { status })
    } catch {
      // revert by refetching the original from initial set
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? initialLeads.find((o) => o.id === id) ?? l : l)),
      )
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-line flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            placeholder="Search by name, email, company, message…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-paper-2 p-1 rounded-full">
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
              <Th>Lead</Th>
              <Th>Source</Th>
              <Th>Segment</Th>
              <Th>Status</Th>
              <Th>Received</Th>
              <Th className="text-right">{''}</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => {
              const open = expanded === l.id
              return (
                <LeadRow
                  key={l.id}
                  lead={l}
                  open={open}
                  onToggle={() => setExpanded(open ? null : l.id)}
                  onStatusChange={onStatusChange}
                  onSaveNotes={(notes) => patchLead(l.id, { notes })}
                />
              )
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted border-t border-line">
                  No leads match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LeadRow({
  lead,
  open,
  onToggle,
  onStatusChange,
  onSaveNotes,
}: {
  lead: Lead
  open: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onSaveNotes: (notes: string) => Promise<Lead>
}) {
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveNotes = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await onSaveNotes(notes.trim() ? notes : '')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-paper-2 transition-colors">
        <td className="px-4 py-3 border-t border-line">
          <button onClick={onToggle} className="block text-left">
            <div className="font-medium text-ink flex items-center gap-2">
              {lead.name}
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </div>
            <div className="text-[12.5px] text-muted">
              {lead.company ? `${lead.company} · ` : ''}
              {lead.email}
            </div>
          </button>
        </td>
        <td className="px-4 py-3 border-t border-line font-mono-warm text-[12px] uppercase tracking-[0.1em] text-ink-2">
          {lead.source || '—'}
        </td>
        <td className="px-4 py-3 border-t border-line">
          {lead.segment ? (
            <Badge tone={lead.segment === 'pe' ? 'blue' : 'neutral'}>{lead.segment}</Badge>
          ) : (
            <span className="text-muted text-[13px]">—</span>
          )}
        </td>
        <td className="px-4 py-3 border-t border-line">
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[lead.status]}>● {lead.status}</Badge>
            <Select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className="h-8 py-0 text-[12.5px] w-[130px]"
              aria-label="Change status"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </td>
        <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">
          {formatDate(lead.createdAt)}
        </td>
        <td className="px-4 py-3 border-t border-line text-right">
          <button
            onClick={onToggle}
            className="text-[12.5px] text-accent-2 hover:underline underline-offset-2"
          >
            {open ? 'Hide' : 'View'}
          </button>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={6} className="px-4 pb-5 pt-1 border-t border-line bg-paper-2/40">
            <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 max-w-[1000px]">
              {/* Message + contact */}
              <div>
                <div className="flex flex-wrap gap-4 mb-3 text-[13px] text-ink-2">
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 text-accent-2 hover:underline underline-offset-2"
                  >
                    <Mail className="w-3.5 h-3.5" /> {lead.email}
                  </a>
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-accent-2 hover:underline underline-offset-2"
                    >
                      <Phone className="w-3.5 h-3.5" /> {lead.phone}
                    </a>
                  ) : null}
                  {lead.company ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted" /> {lead.company}
                    </span>
                  ) : null}
                </div>
                <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.12em] text-muted mb-1.5">
                  Message
                </div>
                <div className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap bg-paper border border-line rounded-lg px-4 py-3 min-h-[64px]">
                  {lead.message?.trim() || <span className="text-muted italic">No message.</span>}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.12em] text-muted mb-1.5">
                  Internal notes
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note — context, next step, who's following up…"
                  className="min-h-[96px]"
                />
                <div className="flex items-center gap-3 mt-2">
                  <Button size="sm" onClick={saveNotes} disabled={saving}>
                    {saving ? 'Saving…' : 'Save notes'}
                  </Button>
                  {saved ? <span className="text-[12.5px] text-accent-2">Saved ✓</span> : null}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
