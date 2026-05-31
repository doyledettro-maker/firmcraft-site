'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Send, Upload, X, Loader2, Check } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import { formatDate } from '@/lib/format'
import type { Prospect, ProspectStatus } from '@/lib/db/prospects'

const STATUS_OPTIONS: ProspectStatus[] = [
  'draft', 'queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed',
]

type Filter = 'all' | ProspectStatus

const STATUS_FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'queued', label: 'Queued' },
  { key: 'sent', label: 'Sent' },
  { key: 'opened', label: 'Opened' },
  { key: 'clicked', label: 'Clicked' },
  { key: 'replied', label: 'Replied' },
  { key: 'bounced', label: 'Bounced' },
]

export function OutreachTable({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [industry, setIndustry] = useState<string>('all')
  const [city, setCity] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  const [sendingAll, setSendingAll] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const industries = useMemo(() => {
    const s = new Set<string>()
    prospects.forEach((p) => { if (p.industry) s.add(p.industry) })
    return Array.from(s).sort()
  }, [prospects])

  const cities = useMemo(() => {
    const s = new Set<string>()
    prospects.forEach((p) => { if (p.city) s.add(p.city) })
    return Array.from(s).sort()
  }, [prospects])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false
      if (industry !== 'all' && p.industry !== industry) return false
      if (city !== 'all' && p.city !== city) return false
      if (q) {
        const hay = `${p.companyName} ${p.contactName ?? ''} ${p.email} ${p.industry ?? ''} ${p.city ?? ''}`
        if (!hay.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [prospects, filter, industry, city, query])

  const queuedCount = useMemo(() => prospects.filter((p) => p.status === 'queued').length, [prospects])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  async function sendOne(id: string) {
    if (sendingIds.has(id)) return
    setSendingIds((s) => new Set(s).add(id))
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prospectId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        flash(data.error ?? 'Send failed')
      } else if (data.results?.[0]?.ok) {
        flash('Sent')
        router.refresh()
      } else {
        flash(data.results?.[0]?.error ?? 'Send failed')
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSendingIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  async function sendAllQueued() {
    if (sendingAll || queuedCount === 0) return
    if (!confirm(`Send all ${queuedCount} queued prospects?`)) return
    setSendingAll(true)
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sendAllQueued: true }),
      })
      const data = await res.json()
      if (!res.ok) flash(data.error ?? 'Send failed')
      else flash(`Sent ${data.sent} · ${data.failed ?? 0} failed`)
      router.refresh()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSendingAll(false)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            placeholder="Search company, contact, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-9 py-0 w-[150px]">
            <option value="all">All industries</option>
            {industries.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
          <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 py-0 w-[140px]">
            <option value="all">All cities</option>
            {cities.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button size="sm" disabled={queuedCount === 0 || sendingAll} onClick={sendAllQueued}>
            {sendingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send all queued ({queuedCount})
          </Button>
        </div>
      </div>

      {/* Status pills */}
      <div className="px-4 py-2 border-b border-line flex gap-1 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
              filter === f.key ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink bg-paper'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>Contact</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Sent</Th>
              <Th>Opened</Th>
              <Th>Clicked</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr
                key={p.id}
                onClick={() => setEditing(p)}
                className="hover:bg-paper-2 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 border-t border-line">
                  <div className="font-medium text-ink">{p.companyName}</div>
                  <div className="text-[12.5px] text-muted">
                    {[p.city, p.state].filter(Boolean).join(', ') || '—'}
                    {p.employeeCount ? ` · ${p.employeeCount} emp` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">{p.industry ?? '—'}</td>
                <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">{p.contactName ?? '—'}</td>
                <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 font-mono-warm">{p.email}</td>
                <td className="px-4 py-3 border-t border-line"><ProspectStatusBadge status={p.status} /></td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] text-ink-2 whitespace-nowrap">
                  {p.sentAt ? formatDate(p.sentAt) : '—'}
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] text-ink-2 whitespace-nowrap">
                  {p.openedAt ? formatDate(p.openedAt) : '—'}
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] text-ink-2 whitespace-nowrap">
                  {p.clickedAt ? formatDate(p.clickedAt) : '—'}
                </td>
                <td
                  className="px-4 py-3 border-t border-line text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={sendingIds.has(p.id) || !p.email || !p.subjectLine || !p.emailBody}
                    onClick={() => sendOne(p.id)}
                  >
                    {sendingIds.has(p.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </Button>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted border-t border-line">
                  No prospects match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <EditDrawer
          prospect={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
            flash('Saved')
          }}
          onSent={() => {
            setEditing(null)
            router.refresh()
            flash('Sent')
          }}
        />
      ) : null}

      {importOpen ? (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={(n) => {
            setImportOpen(false)
            router.refresh()
            flash(`Imported ${n} prospect${n === 1 ? '' : 's'}`)
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 bg-paper-2 border border-line-2 rounded-full px-4 py-2 text-[13px] text-ink shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-accent-2" />
          {toast}
        </div>
      ) : null}
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

/* -------- Edit Drawer -------- */

function EditDrawer({
  prospect,
  onClose,
  onSaved,
  onSent,
}: {
  prospect: Prospect
  onClose: () => void
  onSaved: () => void
  onSent: () => void
}) {
  const [form, setForm] = useState({
    companyName: prospect.companyName,
    industry: prospect.industry ?? '',
    employeeCount: prospect.employeeCount?.toString() ?? '',
    city: prospect.city ?? '',
    state: prospect.state ?? '',
    contactName: prospect.contactName ?? '',
    email: prospect.email,
    phone: prospect.phone ?? '',
    website: prospect.website ?? '',
    subjectLine: prospect.subjectLine ?? '',
    emailBody: prospect.emailBody ?? '',
    notes: prospect.notes ?? '',
    status: prospect.status as ProspectStatus,
  })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const body = {
        companyName: form.companyName,
        industry: form.industry || null,
        employeeCount: form.employeeCount ? Number(form.employeeCount) : null,
        city: form.city || null,
        state: form.state || null,
        contactName: form.contactName || null,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        subjectLine: form.subjectLine || null,
        emailBody: form.emailBody || null,
        notes: form.notes || null,
        status: form.status,
      }
      const res = await fetch(`/api/outreach/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveAndSend() {
    await save()
    if (error) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prospectId: prospect.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.results?.[0]?.ok) {
        setError(data.results?.[0]?.error ?? data.error ?? 'Send failed')
        return
      }
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-[640px] h-full bg-paper border-l border-line flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-paper border-b border-line px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="eyebrow">Prospect</div>
            <h2 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-0.5 truncate">
              {prospect.companyName}
            </h2>
          </div>
          <button
            className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            </Field>
            <Field label="Industry">
              <Input value={form.industry} onChange={(e) => set('industry', e.target.value)} />
            </Field>
            <Field label="Contact name">
              <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={(e) => set('website', e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
            </Field>
            <Field label="Employees">
              <Input
                type="number"
                value={form.employeeCount}
                onChange={(e) => set('employeeCount', e.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value as ProspectStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Subject line">
            <Input value={form.subjectLine} onChange={(e) => set('subjectLine', e.target.value)} />
          </Field>
          <Field label="Email body">
            <Textarea
              rows={14}
              value={form.emailBody}
              onChange={(e) => set('emailBody', e.target.value)}
              className="min-h-[260px] font-mono-warm text-[13px]"
            />
          </Field>
          <Field label="Notes (internal)">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>

          {error ? (
            <div className="text-[13px] text-danger bg-[#2D1410] border border-[#E8907B]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 bg-paper border-t border-line px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="ghost" onClick={save} disabled={saving || sending}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </Button>
          <Button onClick={saveAndSend} disabled={saving || sending || !form.email || !form.subjectLine || !form.emailBody}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save & send
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/* -------- Import Modal -------- */

function ImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported: (count: number) => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setText(await f.text())
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('Invalid JSON')
      }
      const res = await fetch('/api/outreach/prospects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      onImported(data.created ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <Card
        className="relative w-full max-w-[640px] mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="eyebrow">Import</div>
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-0.5">Bulk import prospects</h3>
          </div>
          <button
            className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid gap-3 overflow-y-auto">
          <p className="text-[13.5px] text-ink-2">
            Paste a JSON array of prospects, or upload a .json file. Each entry needs at minimum
            <span className="font-mono-warm text-[12px]"> companyName </span> and
            <span className="font-mono-warm text-[12px]"> email</span>.
          </p>
          <input type="file" accept=".json,application/json" onChange={handleFile} className="text-[13px] text-ink-2" />
          <Textarea
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='[{"companyName":"Acme","email":"hi@acme.com","industry":"HVAC","city":"Springfield","state":"IL"}]'
            className="min-h-[280px] font-mono-warm text-[12.5px]"
          />
          {error ? (
            <div className="text-[13px] text-danger bg-[#2D1410] border border-[#E8907B]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !text.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import
          </Button>
        </div>
      </Card>
    </div>
  )
}
