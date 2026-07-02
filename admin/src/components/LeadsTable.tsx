'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Mail, Phone, Building2, Target, ArrowUpRight, Loader2, X, Plus } from 'lucide-react'
import { Input, Select, Textarea, Button, Badge, Card, Label, Radio } from './ui'
import { formatDate } from '@/lib/format'
import { STAGE_LABELS } from '@/lib/opportunity-signals'
import { LEAD_STATUSES, type Lead, type LeadStatus } from '@/lib/db/leads'
import type { Company } from '@/lib/db/companies'
import type { OpportunityStage } from '@/lib/db/opportunities'

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
  const [converting, setConverting] = useState<Lead | null>(null)

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
                  onConvert={() => setConverting(l)}
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

      {converting ? (
        <ConvertLeadModal
          lead={converting}
          onClose={() => setConverting(null)}
          onConverted={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
            setConverting(null)
          }}
        />
      ) : null}
    </div>
  )
}

function LeadRow({
  lead,
  open,
  onToggle,
  onStatusChange,
  onSaveNotes,
  onConvert,
}: {
  lead: Lead
  open: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onSaveNotes: (notes: string) => Promise<Lead>
  onConvert: () => void
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
              {lead.opportunityId ? (
                <span
                  title="Converted to opportunity"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-accent-2/30 bg-accent-2/10 text-accent-2 font-mono text-[10px] uppercase tracking-[0.1em] flex-none"
                >
                  <Target className="w-3 h-3" />
                  Opp
                </span>
              ) : null}
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
        <td className="px-4 py-3 border-t border-line font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">
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
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted mb-1.5">
                  Message
                </div>
                <div className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap bg-paper border border-line rounded-lg px-4 py-3 min-h-[64px]">
                  {lead.message?.trim() || <span className="text-muted">No message.</span>}
                </div>
              </div>

              {/* Internal notes + pipeline */}
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted mb-1.5">
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

                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted mt-5 mb-1.5">
                  Pipeline
                </div>
                {lead.opportunityId ? (
                  <Link
                    href={`/opportunities?opp=${lead.opportunityId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 text-accent-2 text-[12.5px] font-medium hover:border-accent-2 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5" />
                    View opportunity on board
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div>
                    <Button variant="ghost" size="sm" onClick={onConvert}>
                      <Target className="w-4 h-4" />
                      Convert to opportunity
                    </Button>
                    <p className="text-[12px] text-muted mt-1.5 leading-snug">
                      Creates/links the outreach company &amp; contact, keeps this message as
                      correspondence, and opens a Qualified opportunity.
                    </p>
                  </div>
                )}
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
      className={`px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Convert lead → opportunity modal                                   */
/* ------------------------------------------------------------------ */

type CompanySuggestion = {
  company: Company
  openOpportunityId: string | null
  openOpportunityStage: OpportunityStage | null
}

function ConvertLeadModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: Lead
  onClose: () => void
  onConverted: (lead: Lead) => void
}) {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[] | null>(null)
  const [choice, setChoice] = useState<string>('__new__')
  const [companyName, setCompanyName] = useState(lead.company?.trim() || lead.name)
  const [owner, setOwner] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/leads/${lead.id}/convert`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const s: CompanySuggestion[] = data.suggestions ?? []
        setSuggestions(s)
        if (data.defaultCompanyName) setCompanyName(data.defaultCompanyName)
        // Preselect the best match so linking beats duplicating by default.
        if (s.length > 0) setChoice(s[0].company.id)
      })
      .catch(() => setSuggestions([]))
    return () => { cancelled = true }
  }, [lead.id])

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: choice === '__new__' ? undefined : choice,
          companyName: choice === '__new__' ? companyName : undefined,
          owner: owner.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.status === 409 && data.opportunityId) {
        onConverted({ ...lead, status: 'converted', opportunityId: data.opportunityId })
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Convert failed')
      onConverted(data.lead as Lead)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Convert failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <Card className="relative w-full max-w-[560px] mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="eyebrow">Convert lead</div>
            <h3 className="font-sans font-semibold text-[20px] tracking-[-0.01em] mt-0.5">
              {lead.name}
              <span className="text-muted font-normal text-[14px]"> · {lead.email}</span>
            </h3>
          </div>
          <button
            className="w-8 h-8 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid gap-3 overflow-y-auto">
          <div>
            <Label>Outreach company</Label>
            {suggestions === null ? (
              <div className="text-[13px] text-muted py-3 text-center">Looking for matches…</div>
            ) : (
              <div className="grid gap-2">
                {suggestions.map((s) => (
                  <Radio
                    key={s.company.id}
                    name="convert-company"
                    checked={choice === s.company.id}
                    onChange={() => setChoice(s.company.id)}
                    label={
                      <span className="flex items-center gap-2">
                        {s.company.companyName}
                        {s.openOpportunityId && s.openOpportunityStage ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-accent-2/30 bg-accent-2/10 text-accent-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                            <Target className="w-3 h-3" />
                            {STAGE_LABELS[s.openOpportunityStage]}
                          </span>
                        ) : null}
                      </span>
                    }
                    description={
                      <>
                        {[s.company.city, s.company.state].filter(Boolean).join(', ') || 'Existing outreach company'}
                        {s.openOpportunityId ? ' — will link to its open opportunity' : ''}
                      </>
                    }
                  />
                ))}
                <Radio
                  name="convert-company"
                  checked={choice === '__new__'}
                  onChange={() => setChoice('__new__')}
                  label="Create a new company"
                  description="No good match — add it to outreach."
                />
                {choice === '__new__' ? (
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                  />
                ) : null}
              </div>
            )}
          </div>

          <div>
            <Label>Owner</Label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Robert" />
          </div>

          <p className="text-[12.5px] text-muted leading-snug">
            The lead stays here (marked converted). Its message becomes a correspondence entry, the
            person becomes a contact, and a Qualified opportunity opens on the board — or links to
            the company&apos;s existing one.
          </p>

          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || (choice === '__new__' && !companyName.trim())}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Convert
          </Button>
        </div>
      </Card>
    </div>
  )
}
