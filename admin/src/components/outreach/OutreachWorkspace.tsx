'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Send,
  Upload,
  X,
  Loader2,
  Check,
  Plus,
  Mail,
  Users,
  Phone,
  Calendar,
  StickyNote,
  Trash2,
  MessageSquare,
  MousePointerClick,
  MailOpen,
  Reply,
  AlertCircle,
  UserX,
} from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui'
import { CompanyStatusBadge, ContactStatusBadge } from './StatusBadges'
import { formatDate } from '@/lib/format'
import type { Company, CompanyStatus, CompanySegment } from '@/lib/db/companies'
import type { Contact, ContactStatus, ContactWithCompany } from '@/lib/db/contacts'
import type { Correspondence, CorrespondenceType } from '@/lib/db/correspondence'

const COMPANY_STATUS_OPTIONS: CompanyStatus[] = ['active', 'opened', 'engaged', 'customer', 'archived']
const COMPANY_SEGMENT_OPTIONS: CompanySegment[] = ['small', 'midmarket', 'enterprise', 'pe']
const SEGMENT_LABELS: Record<CompanySegment, string> = {
  small: 'Small',
  midmarket: 'Mid-market',
  enterprise: 'Enterprise',
  pe: 'PE',
}
const CONTACT_STATUS_OPTIONS: ContactStatus[] = [
  'targeted', 'draft', 'queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed',
]

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  targeted: 'Targeted',
  draft: 'Draft',
  queued: 'Queued',
  sent: 'Sent',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
  bounced: 'Bounced',
  unsubscribed: 'Unsubscribed',
}

type CompanyFilter = 'all' | CompanyStatus

const COMPANY_FILTERS: Array<{ key: CompanyFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'opened', label: 'Opened' },
  { key: 'engaged', label: 'Engaged' },
  { key: 'customer', label: 'Customer' },
  { key: 'archived', label: 'Archived' },
]

const ENGAGEMENT_RANK: Record<ContactStatus, number> = {
  replied: 6,
  clicked: 5,
  opened: 4,
  sent: 3,
  queued: 2,
  bounced: 1,
  unsubscribed: 1,
  draft: 0,
  targeted: -1,
}

export type OutreachWorkspaceProps = {
  companies: Company[]
  contacts: ContactWithCompany[]
}

export function OutreachWorkspace({ companies, contacts }: OutreachWorkspaceProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<CompanyFilter>('all')
  const [industry, setIndustry] = useState<string>('all')
  const [city, setCity] = useState<string>('all')
  const [segment, setSegment] = useState<'all' | CompanySegment>('all')
  const [contactStatus, setContactStatus] = useState<'all' | ContactStatus>('all')
  const [query, setQuery] = useState('')
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null)
  const [openContactId, setOpenContactId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [newCompanyOpen, setNewCompanyOpen] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const industries = useMemo(() => {
    const s = new Set<string>()
    companies.forEach((c) => { if (c.industry) s.add(c.industry) })
    return Array.from(s).sort()
  }, [companies])

  const cities = useMemo(() => {
    const s = new Set<string>()
    companies.forEach((c) => { if (c.city) s.add(c.city) })
    return Array.from(s).sort()
  }, [companies])

  // Group contacts by companyId for fast lookup
  const contactsByCompany = useMemo(() => {
    const map = new Map<string, ContactWithCompany[]>()
    contacts.forEach((c) => {
      const list = map.get(c.companyId) ?? []
      list.push(c)
      map.set(c.companyId, list)
    })
    return map
  }, [contacts])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return companies.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (industry !== 'all' && c.industry !== industry) return false
      if (city !== 'all' && c.city !== city) return false
      if (segment !== 'all' && c.segment !== segment) return false
      if (contactStatus !== 'all') {
        const companyContacts = contactsByCompany.get(c.id) ?? []
        if (!companyContacts.some((ct) => ct.status === contactStatus)) return false
      }
      if (q) {
        const companyContacts = contactsByCompany.get(c.id) ?? []
        const contactHay = companyContacts
          .map((ct) => `${ct.contactName ?? ''} ${ct.email}`)
          .join(' ')
        const hay = `${c.companyName} ${c.industry ?? ''} ${c.city ?? ''} ${contactHay}`
        if (!hay.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [companies, filter, industry, city, segment, contactStatus, query, contactsByCompany])

  const queuedCount = useMemo(
    () => contacts.filter((c) => c.status === 'queued').length,
    [contacts],
  )

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  async function sendAllQueued() {
    if (sendingAll || queuedCount === 0) return
    if (!confirm(`Send all ${queuedCount} queued contacts?`)) return
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

  const openCompany = openCompanyId ? companies.find((c) => c.id === openCompanyId) ?? null : null
  const openContact = openContactId ? contacts.find((c) => c.id === openContactId) ?? null : null

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
          <Select
            value={segment}
            onChange={(e) => setSegment(e.target.value as 'all' | CompanySegment)}
            className="h-9 py-0 w-[140px]"
          >
            <option value="all">All segments</option>
            {COMPANY_SEGMENT_OPTIONS.map((v) => (
              <option key={v} value={v}>{SEGMENT_LABELS[v]}</option>
            ))}
          </Select>
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-9 py-0 w-[150px]">
            <option value="all">All industries</option>
            {industries.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
          <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 py-0 w-[140px]">
            <option value="all">All cities</option>
            {cities.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
          <Select
            value={contactStatus}
            onChange={(e) => setContactStatus(e.target.value as 'all' | ContactStatus)}
            className="h-9 py-0 w-[150px]"
          >
            <option value="all">All statuses</option>
            {CONTACT_STATUS_OPTIONS.map((v) => (
              <option key={v} value={v}>{CONTACT_STATUS_LABELS[v]}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setNewCompanyOpen(true)}>
            <Plus className="w-4 h-4" />
            New company
          </Button>
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
        {COMPANY_FILTERS.map((f) => (
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
              <Th>Segment</Th>
              <Th>Location</Th>
              <Th>Contacts</Th>
              <Th>Status</Th>
              <Th>Last touch</Th>
              <Th>Latest engagement</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const companyContacts = contactsByCompany.get(c.id) ?? []
              const top = companyContacts.reduce<ContactWithCompany | null>(
                (acc, ct) => (acc && ENGAGEMENT_RANK[acc.status] >= ENGAGEMENT_RANK[ct.status] ? acc : ct),
                null,
              )
              const lastTouch = companyContacts
                .map((ct) => latestTouch(ct))
                .filter((d): d is string => Boolean(d))
                .sort()
                .reverse()[0]
              return (
                <tr
                  key={c.id}
                  onClick={() => setOpenCompanyId(c.id)}
                  className="hover:bg-paper-2 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 border-t border-line">
                    <div className="font-medium text-ink">{c.companyName}</div>
                    {c.website ? (
                      <div className="text-[12.5px] text-muted truncate max-w-[260px]">{c.website}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">{c.industry ?? '—'}</td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">
                    <SegmentBadge segment={c.segment} />
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2">
                    {companyContacts.length}
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    <CompanyStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 border-t border-line text-[12.5px] text-ink-2 whitespace-nowrap">
                    {lastTouch ? formatDate(lastTouch) : '—'}
                  </td>
                  <td className="px-4 py-3 border-t border-line">
                    {top ? <ContactStatusBadge status={top.status} /> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted border-t border-line">
                  No companies match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {openCompany ? (
        <CompanyDrawer
          company={openCompany}
          contacts={contactsByCompany.get(openCompany.id) ?? []}
          onClose={() => setOpenCompanyId(null)}
          onSaved={() => { router.refresh(); flash('Saved') }}
          onContactOpen={(id) => setOpenContactId(id)}
          onContactCreated={() => { router.refresh(); flash('Contact added') }}
          onDeleted={() => { setOpenCompanyId(null); router.refresh(); flash('Company deleted') }}
        />
      ) : null}

      {openContact ? (
        <ContactDrawer
          contact={openContact}
          onClose={() => setOpenContactId(null)}
          onSaved={() => { router.refresh(); flash('Saved') }}
          onSent={() => { router.refresh(); flash('Sent') }}
          onDeleted={() => { setOpenContactId(null); router.refresh(); flash('Contact deleted') }}
        />
      ) : null}

      {importOpen ? (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={(n, nc) => {
            setImportOpen(false)
            router.refresh()
            flash(`Imported ${n} compan${n === 1 ? 'y' : 'ies'} · ${nc} contact${nc === 1 ? '' : 's'}`)
          }}
        />
      ) : null}

      {newCompanyOpen ? (
        <NewCompanyModal
          onClose={() => setNewCompanyOpen(false)}
          onCreated={() => { setNewCompanyOpen(false); router.refresh(); flash('Company created') }}
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

const SEGMENT_BADGE_CLASS: Record<CompanySegment, string> = {
  small: 'bg-paper-2 text-ink-2 border-line-2',
  midmarket: 'bg-accent/10 text-accent border-accent/30',
  enterprise: 'bg-[#2A2410] text-[#FCD34D] border-[#FCD34D]/30',
  pe: 'bg-[#0F2A1E] text-[#6EE7B7] border-[#6EE7B7]/30',
}

function SegmentBadge({ segment }: { segment: CompanySegment }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${SEGMENT_BADGE_CLASS[segment]}`}
    >
      {SEGMENT_LABELS[segment]}
    </span>
  )
}

function latestTouch(c: Contact): string | null {
  const times = [c.sentAt, c.openedAt, c.clickedAt, c.repliedAt, c.bouncedAt, c.unsubscribedAt]
    .filter((t): t is string => Boolean(t))
  if (times.length === 0) return null
  return times.sort().reverse()[0]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Company drawer                                                     */
/* ------------------------------------------------------------------ */

function CompanyDrawer({
  company,
  contacts,
  onClose,
  onSaved,
  onContactOpen,
  onContactCreated,
  onDeleted,
}: {
  company: Company
  contacts: Contact[]
  onClose: () => void
  onSaved: () => void
  onContactOpen: (id: string) => void
  onContactCreated: () => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState({
    companyName: company.companyName,
    industry: company.industry ?? '',
    employeeCount: company.employeeCount?.toString() ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    city: company.city ?? '',
    state: company.state ?? '',
    notes: company.notes ?? '',
    status: company.status,
    segment: company.segment,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingContact, setAddingContact] = useState(false)

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
        phone: form.phone || null,
        website: form.website || null,
        city: form.city || null,
        state: form.state || null,
        notes: form.notes || null,
        status: form.status,
        segment: form.segment,
      }
      const res = await fetch(`/api/outreach/companies/${company.id}`, {
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

  async function deleteCompany() {
    if (!confirm(`Delete ${company.companyName} and all of its contacts? This can't be undone.`)) return
    try {
      const res = await fetch(`/api/outreach/companies/${company.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Delete failed')
        return
      }
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-[720px] h-full bg-paper border-l border-line flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-paper border-b border-line px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="eyebrow">Company</div>
            <h2 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-0.5 truncate">
              {company.companyName}
            </h2>
          </div>
          <button
            className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid gap-4 border-b border-line">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            </Field>
            <Field label="Industry">
              <Input value={form.industry} onChange={(e) => set('industry', e.target.value)} />
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
              <Select value={form.status} onChange={(e) => set('status', e.target.value as CompanyStatus)}>
                {COMPANY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Segment">
              <Select value={form.segment} onChange={(e) => set('segment', e.target.value as CompanySegment)}>
                {COMPANY_SEGMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>

          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={deleteCompany}
              className="text-[12px] text-muted hover:text-danger inline-flex items-center gap-1.5 font-mono-warm uppercase tracking-[0.12em]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete company
            </button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save company
            </Button>
          </div>
        </div>

        {/* Contacts */}
        <div className="px-6 py-5 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-ink">
              <Users className="w-4 h-4 text-muted" />
              <h3 className="font-mono-warm text-[11px] uppercase tracking-[0.16em] text-muted">
                Contacts ({contacts.length})
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAddingContact(true)}>
              <Plus className="w-4 h-4" />
              Add contact
            </Button>
          </div>
          {contacts.length === 0 ? (
            <div className="text-[13px] text-muted py-4 text-center bg-paper-2 border border-dashed border-line rounded-lg">
              No contacts yet. Add one to start sending.
            </div>
          ) : (
            <div className="border border-line rounded-lg overflow-hidden">
              {contacts.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onContactOpen(c.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper-2 transition-colors ${
                    i > 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] text-ink font-medium truncate">
                      {c.contactName ?? c.email}
                    </div>
                    <div className="text-[12.5px] text-muted truncate font-mono-warm">
                      {c.title ? `${c.title} · ` : ''}{c.email}
                    </div>
                  </div>
                  <ContactStatusBadge status={c.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        {addingContact ? (
          <AddContactModal
            companyId={company.id}
            onClose={() => setAddingContact(false)}
            onCreated={() => { setAddingContact(false); onContactCreated() }}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Contact drawer                                                     */
/* ------------------------------------------------------------------ */

function ContactDrawer({
  contact,
  onClose,
  onSaved,
  onSent,
  onDeleted,
}: {
  contact: ContactWithCompany
  onClose: () => void
  onSaved: () => void
  onSent: () => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState({
    contactName: contact.contactName ?? '',
    title: contact.title ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    subjectLine: contact.subjectLine ?? '',
    emailBody: contact.emailBody ?? '',
    notes: contact.notes ?? '',
    status: contact.status,
  })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<Correspondence[] | null>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [addingNote, setAddingNote] = useState<CorrespondenceType | null>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function loadTimeline() {
    setLoadingTimeline(true)
    try {
      const res = await fetch(`/api/outreach/contacts/${contact.id}/correspondence`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setTimeline(data.correspondence ?? [])
    } finally {
      setLoadingTimeline(false)
    }
  }

  // Load on first mount.
  if (timeline === null && !loadingTimeline) {
    void loadTimeline()
  }

  async function save(): Promise<boolean> {
    setSaving(true)
    setError(null)
    try {
      const body = {
        contactName: form.contactName || null,
        title: form.title || null,
        email: form.email,
        phone: form.phone || null,
        subjectLine: form.subjectLine || null,
        emailBody: form.emailBody || null,
        notes: form.notes || null,
        status: form.status,
      }
      const res = await fetch(`/api/outreach/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return false
      }
      onSaved()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveAndSend() {
    const ok = await save()
    if (!ok) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
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

  async function deleteContact() {
    if (!confirm(`Delete ${contact.contactName ?? contact.email}? This can't be undone.`)) return
    try {
      const res = await fetch(`/api/outreach/contacts/${contact.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Delete failed')
        return
      }
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[720px] h-full bg-paper border-l border-line flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-paper border-b border-line px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="eyebrow">Contact · {contact.company.companyName}</div>
            <h2 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-0.5 truncate">
              {contact.contactName ?? contact.email}
            </h2>
          </div>
          <button
            className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid gap-4 border-b border-line">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name">
              <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value as ContactStatus)}>
                {CONTACT_STATUS_OPTIONS.map((s) => (
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
              rows={12}
              value={form.emailBody}
              onChange={(e) => set('emailBody', e.target.value)}
              className="min-h-[220px] font-mono-warm text-[13px]"
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
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={deleteContact}
              className="text-[12px] text-muted hover:text-danger inline-flex items-center gap-1.5 font-mono-warm uppercase tracking-[0.12em]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete contact
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={save} disabled={saving || sending}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </Button>
              <Button
                onClick={saveAndSend}
                disabled={saving || sending || !form.email || !form.subjectLine || !form.emailBody}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Save & send
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-ink">
              <MessageSquare className="w-4 h-4 text-muted" />
              <h3 className="font-mono-warm text-[11px] uppercase tracking-[0.16em] text-muted">
                Correspondence
              </h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setAddingNote('note')}>
                <StickyNote className="w-3.5 h-3.5" />
                Note
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingNote('call')}>
                <Phone className="w-3.5 h-3.5" />
                Call
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingNote('meeting')}>
                <Calendar className="w-3.5 h-3.5" />
                Meeting
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingNote('email_replied')}>
                <Reply className="w-3.5 h-3.5" />
                Reply
              </Button>
            </div>
          </div>

          {loadingTimeline && timeline === null ? (
            <div className="text-[13px] text-muted py-4 text-center">Loading timeline…</div>
          ) : (timeline ?? []).length === 0 ? (
            <div className="text-[13px] text-muted py-4 text-center bg-paper-2 border border-dashed border-line rounded-lg">
              No correspondence yet.
            </div>
          ) : (
            <ol className="relative border-l border-line ml-3 pl-5 space-y-4">
              {(timeline ?? []).map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </div>

        {addingNote ? (
          <AddCorrespondenceModal
            contactId={contact.id}
            initialType={addingNote}
            onClose={() => setAddingNote(null)}
            onAdded={async () => {
              setAddingNote(null)
              await loadTimeline()
              onSaved()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Timeline row                                                       */
/* ------------------------------------------------------------------ */

const TIMELINE_META: Record<CorrespondenceType, { label: string; icon: React.ComponentType<{ className?: string }>; tint: string }> = {
  email_sent:         { label: 'Email sent',        icon: Send,               tint: 'text-blue-300' },
  email_opened:       { label: 'Email opened',      icon: MailOpen,           tint: 'text-blue-300' },
  email_clicked:      { label: 'Link clicked',      icon: MousePointerClick,  tint: 'text-emerald-300' },
  email_replied:      { label: 'Email reply',       icon: Reply,              tint: 'text-emerald-300' },
  email_bounced:      { label: 'Bounced',           icon: AlertCircle,        tint: 'text-rose-300' },
  email_unsubscribed: { label: 'Unsubscribed',      icon: UserX,              tint: 'text-rose-300' },
  call:               { label: 'Call',              icon: Phone,              tint: 'text-amber-300' },
  meeting:            { label: 'Meeting',           icon: Calendar,           tint: 'text-amber-300' },
  note:               { label: 'Note',              icon: StickyNote,         tint: 'text-muted' },
  sms:                { label: 'SMS',               icon: Mail,               tint: 'text-amber-300' },
}

function TimelineRow({ entry }: { entry: Correspondence }) {
  const meta = TIMELINE_META[entry.type]
  const Icon = meta.icon
  const occurred = new Date(entry.occurredAt)
  return (
    <li className="relative">
      <span className="absolute -left-[30px] top-0.5 grid place-items-center w-6 h-6 rounded-full bg-paper border border-line">
        <Icon className={`w-3 h-3 ${meta.tint}`} />
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[13px] text-ink font-medium">{meta.label}</div>
        <div className="text-[11.5px] text-muted font-mono-warm whitespace-nowrap">
          {occurred.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      {entry.subject ? (
        <div className="text-[13px] text-ink-2 mt-0.5">{entry.subject}</div>
      ) : null}
      {entry.body ? (
        <div className="text-[12.5px] text-ink-2 whitespace-pre-wrap mt-1 leading-relaxed">
          {entry.body}
        </div>
      ) : null}
      {Object.keys(entry.metadata).length > 0 && (entry.type === 'email_clicked' && entry.metadata.link_url) ? (
        <div className="text-[11.5px] text-muted font-mono-warm mt-1 truncate">
          → {String(entry.metadata.link_url)}
        </div>
      ) : null}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/*  Add correspondence modal                                           */
/* ------------------------------------------------------------------ */

function AddCorrespondenceModal({
  contactId,
  initialType,
  onClose,
  onAdded,
}: {
  contactId: string
  initialType: CorrespondenceType
  onClose: () => void
  onAdded: () => void
}) {
  const [type, setType] = useState<CorrespondenceType>(initialType)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/contacts/${contactId}/correspondence`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject || null,
          body: body || null,
          occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add')
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <Card className="relative w-full max-w-[520px] mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-serif-warm text-[20px] tracking-[-0.01em]">Log correspondence</h3>
          <button
            className="w-8 h-8 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid gap-3">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as CorrespondenceType)}>
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="email_replied">Email reply (received)</option>
              <option value="sms">SMS</option>
            </Select>
          </Field>
          <Field label="When">
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </Field>
          <Field label="Subject / summary">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Details">
            <Textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px]"
            />
          </Field>
          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add contact modal                                                  */
/* ------------------------------------------------------------------ */

function AddContactModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [contactName, setContactName] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subjectLine, setSubjectLine] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [status, setStatus] = useState<ContactStatus>('draft')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/contacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId,
          contactName: contactName || null,
          title: title || null,
          email,
          phone: phone || null,
          subjectLine: subjectLine || null,
          emailBody: emailBody || null,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add contact')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <Card className="relative w-full max-w-[560px] mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-serif-warm text-[20px] tracking-[-0.01em]">Add contact</h3>
          <button
            className="w-8 h-8 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid gap-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Email *">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
                {CONTACT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Subject line">
            <Input value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} />
          </Field>
          <Field label="Email body">
            <Textarea
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="min-h-[160px] font-mono-warm text-[13px]"
            />
          </Field>
          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !email}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add contact
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  New company modal                                                  */
/* ------------------------------------------------------------------ */

function NewCompanyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [segment, setSegment] = useState<CompanySegment>('small')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: {
            companyName,
            industry: industry || null,
            employeeCount: employeeCount ? Number(employeeCount) : null,
            phone: phone || null,
            website: website || null,
            city: city || null,
            state: state || null,
            status: 'active',
            segment,
          },
          contacts: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <Card className="relative w-full max-w-[520px] mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-serif-warm text-[20px] tracking-[-0.01em]">New company</h3>
          <button
            className="w-8 h-8 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company *">
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="Industry">
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </Field>
            <Field label="Employees">
              <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
            </Field>
            <Field label="Segment">
              <Select value={segment} onChange={(e) => setSegment(e.target.value as CompanySegment)}>
                {COMPANY_SEGMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
          </div>
          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !companyName}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Import modal                                                       */
/* ------------------------------------------------------------------ */

function ImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported: (companies: number, contacts: number) => void
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
      const res = await fetch('/api/outreach/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      onImported(data.created ?? 0, data.contactsCreated ?? 0)
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
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-0.5">Bulk import</h3>
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
            Paste a JSON array of contacts. Rows are auto-grouped into companies by{' '}
            <span className="font-mono-warm text-[12px]">companyName</span>. Each entry needs{' '}
            <span className="font-mono-warm text-[12px]">companyName</span> and{' '}
            <span className="font-mono-warm text-[12px]">email</span>.
          </p>
          <input type="file" accept=".json,application/json" onChange={handleFile} className="text-[13px] text-ink-2" />
          <Textarea
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='[{"companyName":"Acme","contactName":"Jane","email":"jane@acme.com","industry":"HVAC","city":"Springfield","state":"IL"}]'
            className="min-h-[280px] font-mono-warm text-[12.5px]"
          />
          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
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
