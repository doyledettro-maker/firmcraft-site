'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArchiveRestore,
  Calendar,
  Check,
  CheckCircle2,
  Columns3,
  Flame,
  List,
  Loader2,
  MessageSquare,
  PauseCircle,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { Button, Card, Checkbox, Input, Label, Select, Textarea, Badge } from '@/components/ui'
import { TimelineRow } from '@/components/outreach/CorrespondenceTimeline'
import { formatCurrency, formatDate } from '@/lib/format'
import { PLAN_PRICING } from '@/lib/pricing'
import {
  ACTIVE_STAGES,
  RESOLVED_STAGES,
  STAGE_LABELS,
  PLAN_TIER_LABELS,
  PRIORITY_LABELS,
  formatCloseWindow,
  isNextActionOverdue,
  needsAttention,
  isStale,
  isClosingSoon,
  type OpportunitySignal,
} from '@/lib/opportunity-signals'
import type { Company } from '@/lib/db/companies'
import type { Contact } from '@/lib/db/contacts'
import type { Correspondence } from '@/lib/db/correspondence'
import type {
  OpportunityPlanTier,
  OpportunityPriority,
  OpportunityStage,
  OpportunityWithRelations,
} from '@/lib/db/opportunities'

const STAGE_OPTIONS: OpportunityStage[] = [...ACTIVE_STAGES, ...RESOLVED_STAGES]
const PRIORITY_OPTIONS: OpportunityPriority[] = ['low', 'medium', 'high']
const PLAN_TIER_OPTIONS: OpportunityPlanTier[] = ['solo', 'team', 'pro', 'pilot']

const STAGE_TONE: Record<OpportunityStage, 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'teal'> = {
  qualified: 'neutral',
  discovery: 'blue',
  pilot_scoped: 'teal',
  proposal: 'amber',
  closed_won: 'green',
  closed_lost: 'red',
  parked: 'neutral',
}

const SIGNAL_META: Record<OpportunitySignal, { label: string; tone: 'red' | 'amber' | 'teal' }> = {
  needs_attention: { label: 'Needs attention', tone: 'red' },
  stale: { label: 'Stale', tone: 'amber' },
  closing_soon: { label: 'Closing soon', tone: 'teal' },
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return <Badge tone={STAGE_TONE[stage]}>● {STAGE_LABELS[stage]}</Badge>
}

function signalsFor(opp: OpportunityWithRelations): OpportunitySignal[] {
  const out: OpportunitySignal[] = []
  if (needsAttention(opp)) out.push('needs_attention')
  if (isStale(opp)) out.push('stale')
  if (isClosingSoon(opp)) out.push('closing_soon')
  return out
}

/** ISO timestamptz → value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export type OpportunityBoardProps = {
  opportunities: OpportunityWithRelations[]
  companies: Company[]
  initialOpenId: string | null
}

export function OpportunityBoard({ opportunities, companies, initialOpenId }: OpportunityBoardProps) {
  const router = useRouter()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState('all')
  const [showResolved, setShowResolved] = useState(false)
  const [openId, setOpenId] = useState<string | null>(initialOpenId)
  const [newOppOpen, setNewOppOpen] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  const owners = useMemo(() => {
    const s = new Set<string>()
    opportunities.forEach((o) => { if (o.owner) s.add(o.owner) })
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [opportunities])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return opportunities.filter((o) => {
      if (owner === '__unassigned__') {
        if (o.owner) return false
      } else if (owner !== 'all' && o.owner !== owner) {
        return false
      }
      if (q) {
        const hay = [
          o.name,
          o.company.companyName,
          o.primaryContact?.contactName ?? '',
          o.primaryContact?.email ?? '',
          o.owner ?? '',
          o.nextAction ?? '',
          o.useCase ?? '',
        ].join(' ')
        if (!hay.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [opportunities, owner, query])

  const byStage = useMemo(() => {
    const map = new Map<OpportunityStage, OpportunityWithRelations[]>()
    STAGE_OPTIONS.forEach((s) => map.set(s, []))
    filtered.forEach((o) => map.get(o.stage)?.push(o))
    // Special attention floats to the top of every column; then soonest close.
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => {
        if (a.specialAttention !== b.specialAttention) return a.specialAttention ? -1 : 1
        const aClose = a.expectedCloseEnd ?? a.expectedCloseStart ?? '9999'
        const bClose = b.expectedCloseEnd ?? b.expectedCloseStart ?? '9999'
        return aClose.localeCompare(bClose)
      })
    }
    return map
  }, [filtered])

  const specialAttention = useMemo(
    () =>
      filtered
        .filter((o) => o.specialAttention && (ACTIVE_STAGES as OpportunityStage[]).includes(o.stage))
        .sort((a, b) => (a.expectedCloseEnd ?? '9999').localeCompare(b.expectedCloseEnd ?? '9999')),
    [filtered],
  )

  const open = openId ? opportunities.find((o) => o.id === openId) ?? null : null

  async function changeStage(id: string, stage: OpportunityStage) {
    const opp = opportunities.find((o) => o.id === id)
    if (!opp || opp.stage === stage) return
    const body: Record<string, unknown> = { stage }
    if (stage === 'closed_lost') {
      const reason = prompt('Lost reason (optional):')
      if (reason === null) return
      body.lostReason = reason || null
    }
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      flash(data.error ?? 'Stage change failed')
      return
    }
    flash(`Moved to ${STAGE_LABELS[stage]}`)
    router.refresh()
  }

  const columns = showResolved ? STAGE_OPTIONS : ACTIVE_STAGES

  return (
    <Card className="hover:border-line">
      {/* Special attention strip */}
      {specialAttention.length > 0 ? (
        <div className="px-4 py-3 border-b border-line bg-accent-2/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-accent-2" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
              Special attention
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {specialAttention.map((o) => {
              const overdue = isNextActionOverdue(o)
              const attention = needsAttention(o)
              return (
                <button
                  key={o.id}
                  onClick={() => setOpenId(o.id)}
                  className={`flex-none w-[300px] text-left rounded-lg border px-3.5 py-2.5 bg-paper transition-colors hover:border-accent-2 ${
                    attention ? 'border-accent-2/60' : 'border-line-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink text-[14px] truncate">{o.company.companyName}</span>
                    <StageBadge stage={o.stage} />
                  </div>
                  <div className="text-[12px] text-ink-2 mt-1 truncate">
                    {o.nextAction ?? 'No next action set'}
                    {o.nextActionDueAt ? (
                      <span className={`font-mono ml-1.5 ${overdue ? 'text-danger' : 'text-muted'}`}>
                        · due {formatDate(o.nextActionDueAt)}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11.5px] text-muted font-mono mt-1">
                    closes {formatCloseWindow(o.expectedCloseStart, o.expectedCloseEnd)}
                    {attention ? <span className="text-danger ml-1.5">· needs attention</span> : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            placeholder="Search opportunity, company, contact…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 py-0 w-[150px]">
            <option value="all">All owners</option>
            <option value="__unassigned__">Unassigned</option>
            {owners.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
          <button
            onClick={() => setShowResolved((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap border ${
              showResolved
                ? 'bg-accent text-white border-accent'
                : 'text-ink-2 hover:text-ink bg-paper border-line-2'
            }`}
          >
            Closed &amp; parked
          </button>
          <div className="flex rounded-lg border border-line-2 overflow-hidden">
            <ViewToggle active={view === 'board'} onClick={() => setView('board')} icon={Columns3} label="Board" />
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} icon={List} label="List" />
          </div>
        </div>
        <Button size="sm" onClick={() => setNewOppOpen(true)}>
          <Plus className="w-4 h-4" />
          New opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Target className="w-8 h-8 text-muted mx-auto mb-3" />
          <div className="text-ink font-medium">No opportunities yet</div>
          <p className="text-[13.5px] text-muted mt-1 max-w-[420px] mx-auto">
            Convert a qualified company from Outreach (company drawer → Create opportunity), or add
            one here.
          </p>
        </div>
      ) : view === 'board' ? (
        <div className="overflow-x-auto">
          <div className="flex gap-3 p-4 min-w-max items-start">
            {columns.map((stage) => {
              const items = byStage.get(stage) ?? []
              const total = items.reduce((s, o) => s + (o.estimatedValue ?? 0), 0)
              return (
                <div
                  key={stage}
                  className={`w-[290px] flex-none rounded-lg border bg-paper-2/40 transition-colors ${
                    dragId ? 'border-accent/40' : 'border-line'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain')
                    setDragId(null)
                    if (id) void changeStage(id, stage)
                  }}
                >
                  <div className="px-3.5 py-2.5 border-b border-line flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-2 font-medium">
                      {STAGE_LABELS[stage]}
                      <span className="text-muted ml-1.5">{items.length}</span>
                    </span>
                    {total > 0 ? (
                      <span className="font-mono text-[10.5px] text-muted">{formatCurrency(total)}</span>
                    ) : null}
                  </div>
                  <div className="p-2 grid gap-2 min-h-[80px] content-start">
                    {items.map((o) => (
                      <OpportunityCard
                        key={o.id}
                        opp={o}
                        onOpen={() => setOpenId(o.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', o.id)
                          setDragId(o.id)
                        }}
                        onDragEnd={() => setDragId(null)}
                      />
                    ))}
                    {items.length === 0 ? (
                      <div className="text-[12px] text-muted text-center py-5 border border-dashed border-line rounded-md">
                        Drop here
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <OpportunityTable
          opportunities={columns.flatMap((s) => byStage.get(s) ?? [])}
          onOpen={(id) => setOpenId(id)}
        />
      )}

      {open ? (
        <OpportunityDrawer
          opp={open}
          onClose={() => setOpenId(null)}
          onSaved={(msg) => { router.refresh(); flash(msg ?? 'Saved') }}
          onDeleted={() => { setOpenId(null); router.refresh(); flash('Opportunity deleted') }}
        />
      ) : null}

      {newOppOpen ? (
        <NewOpportunityModal
          companies={companies}
          onClose={() => setNewOppOpen(false)}
          onCreated={(id) => {
            setNewOppOpen(false)
            setOpenId(id)
            router.refresh()
            flash('Opportunity created')
          }}
          onExisting={(id) => {
            setNewOppOpen(false)
            setOpenId(id)
            flash('Company already has an open opportunity')
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[70] bg-paper-2 border border-line-2 rounded-full px-4 py-2 text-[13px] text-ink shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-accent-2" />
          {toast}
        </div>
      ) : null}
    </Card>
  )
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-9 text-[12.5px] font-medium transition-colors ${
        active ? 'bg-paper-2 text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Kanban card                                                        */
/* ------------------------------------------------------------------ */

function OpportunityCard({
  opp,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  opp: OpportunityWithRelations
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  const signals = signalsFor(opp)
  const overdue = isNextActionOverdue(opp)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="rounded-lg border border-line bg-paper px-3 py-2.5 cursor-pointer hover:border-accent transition-colors shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-ink text-[13.5px] leading-snug min-w-0 truncate">
          {opp.company.companyName}
        </div>
        <div className="flex items-center gap-1 flex-none">
          {opp.priority === 'high' ? (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#FCD34D] border border-[#FCD34D]/25 bg-[#2A2410] rounded-full px-1.5 py-px">
              High
            </span>
          ) : null}
          {opp.specialAttention ? (
            <Star className="w-3.5 h-3.5 text-accent-2 fill-accent-2" />
          ) : null}
        </div>
      </div>
      {opp.primaryContact ? (
        <div className="text-[12px] text-ink-2 mt-0.5 truncate">
          {opp.primaryContact.contactName ?? opp.primaryContact.email}
          {opp.primaryContact.title ? (
            <span className="text-muted"> · {opp.primaryContact.title}</span>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2 mt-1.5 text-[11.5px] font-mono text-muted">
        <span className="inline-flex items-center gap-1 min-w-0 truncate">
          <Calendar className="w-3 h-3 flex-none" />
          {formatCloseWindow(opp.expectedCloseStart, opp.expectedCloseEnd)}
        </span>
        <span className="flex-none">
          {opp.estimatedValue != null ? formatCurrency(opp.estimatedValue) : ''}
          {opp.confidence != null ? ` · ${opp.confidence}%` : ''}
        </span>
      </div>
      {opp.nextAction || opp.nextActionDueAt ? (
        <div className={`text-[12px] mt-1.5 leading-snug ${overdue ? 'text-danger' : 'text-ink-2'}`}>
          → {opp.nextAction ?? 'Next action'}
          {opp.nextActionDueAt ? (
            <span className="font-mono text-[11px]"> · {formatDate(opp.nextActionDueAt)}</span>
          ) : null}
        </div>
      ) : null}
      {(signals.length > 0 || opp.owner || opp.lastTouchAt) ? (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {signals.map((s) => (
            <Badge key={s} tone={SIGNAL_META[s].tone} className="!px-2 !text-[9.5px]">
              {SIGNAL_META[s].label}
            </Badge>
          ))}
          {opp.owner ? (
            <span className="inline-flex items-center px-1.5 py-px rounded-full border border-accent/30 bg-accent/10 text-accent text-[10.5px] font-medium">
              {opp.owner}
            </span>
          ) : null}
          {opp.lastTouchAt ? (
            <span className="text-[10.5px] font-mono text-muted ml-auto">
              touched {formatDate(opp.lastTouchAt)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  List view                                                          */
/* ------------------------------------------------------------------ */

function OpportunityTable({
  opportunities,
  onOpen,
}: {
  opportunities: OpportunityWithRelations[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <Th>Company</Th>
            <Th>Stage</Th>
            <Th>Contact</Th>
            <Th>Close window</Th>
            <Th>Value</Th>
            <Th>Conf.</Th>
            <Th>Next action</Th>
            <Th>Owner</Th>
            <Th>Signals</Th>
            <Th>Last touch</Th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((o) => {
            const signals = signalsFor(o)
            const overdue = isNextActionOverdue(o)
            return (
              <tr
                key={o.id}
                onClick={() => onOpen(o.id)}
                className="hover:bg-paper-2 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 border-t border-line">
                  <div className="font-medium text-ink flex items-center gap-1.5">
                    <span className="truncate">{o.company.companyName}</span>
                    {o.specialAttention ? <Star className="w-3.5 h-3.5 text-accent-2 fill-accent-2 flex-none" /> : null}
                  </div>
                  <div className="text-[12px] text-muted truncate max-w-[240px]">{o.name}</div>
                </td>
                <td className="px-4 py-3 border-t border-line"><StageBadge stage={o.stage} /></td>
                <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">
                  {o.primaryContact?.contactName ?? o.primaryContact?.email ?? '—'}
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] font-mono text-ink-2 whitespace-nowrap">
                  {formatCloseWindow(o.expectedCloseStart, o.expectedCloseEnd)}
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] font-mono text-ink-2 whitespace-nowrap">
                  {o.estimatedValue != null ? formatCurrency(o.estimatedValue) : '—'}
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] font-mono text-ink-2">
                  {o.confidence != null ? `${o.confidence}%` : '—'}
                </td>
                <td className={`px-4 py-3 border-t border-line text-[13px] max-w-[220px] ${overdue ? 'text-danger' : 'text-ink-2'}`}>
                  <div className="truncate">{o.nextAction ?? '—'}</div>
                  {o.nextActionDueAt ? (
                    <div className="font-mono text-[11px]">{formatDate(o.nextActionDueAt)}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 border-t border-line text-[13px] text-ink-2 whitespace-nowrap">
                  {o.owner ?? '—'}
                </td>
                <td className="px-4 py-3 border-t border-line">
                  <div className="flex gap-1 flex-wrap">
                    {signals.map((s) => (
                      <Badge key={s} tone={SIGNAL_META[s].tone} className="!px-2 !text-[9.5px]">
                        {SIGNAL_META[s].label}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-line text-[12.5px] font-mono text-ink-2 whitespace-nowrap">
                  {o.lastTouchAt ? formatDate(o.lastTouchAt) : '—'}
                </td>
              </tr>
            )
          })}
          {opportunities.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-10 text-center text-muted border-t border-line">
                No opportunities match.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium">
      {children}
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail drawer                                                      */
/* ------------------------------------------------------------------ */

type OpportunityDetail = {
  contacts: Contact[]
  correspondence: Correspondence[]
}

function OpportunityDrawer({
  opp,
  onClose,
  onSaved,
  onDeleted,
}: {
  opp: OpportunityWithRelations
  onClose: () => void
  onSaved: (msg?: string) => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState({
    name: opp.name,
    stage: opp.stage,
    priority: opp.priority,
    specialAttention: opp.specialAttention,
    primaryContactId: opp.primaryContactId ?? '',
    expectedCloseStart: opp.expectedCloseStart ?? '',
    expectedCloseEnd: opp.expectedCloseEnd ?? '',
    estimatedValue: opp.estimatedValue?.toString() ?? '',
    planTier: opp.planTier ?? '',
    confidence: opp.confidence?.toString() ?? '',
    owner: opp.owner ?? '',
    nextAction: opp.nextAction ?? '',
    nextActionDueAt: toLocalInput(opp.nextActionDueAt),
    useCase: opp.useCase ?? '',
    notes: opp.notes ?? '',
    lostReason: opp.lostReason ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<OpportunityDetail | null>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  useEffect(() => {
    let cancelled = false
    fetch(`/api/opportunities/${opp.id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.contacts) {
          setDetail({ contacts: data.contacts, correspondence: data.correspondence ?? [] })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [opp.id])

  async function patch(body: Record<string, unknown>, msg?: string): Promise<boolean> {
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return false
      }
      onSaved(msg)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    }
  }

  async function save() {
    setSaving(true)
    await patch({
      name: form.name,
      stage: form.stage,
      priority: form.priority,
      specialAttention: form.specialAttention,
      primaryContactId: form.primaryContactId || null,
      expectedCloseStart: form.expectedCloseStart || null,
      expectedCloseEnd: form.expectedCloseEnd || null,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      planTier: form.planTier || null,
      confidence: form.confidence ? Number(form.confidence) : null,
      owner: form.owner || null,
      nextAction: form.nextAction || null,
      nextActionDueAt: form.nextActionDueAt ? new Date(form.nextActionDueAt).toISOString() : null,
      useCase: form.useCase || null,
      notes: form.notes || null,
      lostReason: form.lostReason || null,
    })
    setSaving(false)
  }

  async function quickStage(stage: OpportunityStage, label: string) {
    setBusyAction(stage)
    const body: Record<string, unknown> = { stage }
    if (stage === 'closed_lost') {
      const reason = prompt('Lost reason (optional):', form.lostReason)
      if (reason === null) { setBusyAction(null); return }
      body.lostReason = reason || null
    }
    if (stage === 'closed_won') body.confidence = 100
    await patch(body, label)
    setBusyAction(null)
  }

  async function del() {
    if (!confirm(`Delete opportunity "${opp.name}"? The company and its history stay in Outreach.`)) return
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, { method: 'DELETE' })
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

  const isClosed = opp.stage === 'closed_won' || opp.stage === 'closed_lost'
  const contacts = detail?.contacts ?? []

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-[720px] h-full bg-paper border-l border-line flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-paper border-b border-line px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow flex items-center gap-2">
              Opportunity
              <StageBadge stage={opp.stage} />
            </div>
            <h2 className="font-sans font-semibold text-[22px] tracking-[-0.01em] mt-0.5 truncate">
              {opp.company.companyName}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button
              title={form.specialAttention ? 'Unmark special attention' : 'Mark special attention'}
              onClick={() => {
                const next = !form.specialAttention
                set('specialAttention', next)
                void patch({ specialAttention: next }, next ? 'Marked special attention' : 'Special attention cleared')
              }}
              className={`w-9 h-9 grid place-items-center rounded-full border transition-colors ${
                form.specialAttention
                  ? 'border-accent-2 text-accent-2 bg-accent-2/10'
                  : 'border-line-2 text-ink-2 hover:border-accent-2 hover:text-accent-2'
              }`}
            >
              <Star className={`w-4 h-4 ${form.specialAttention ? 'fill-accent-2' : ''}`} />
            </button>
            <button
              className="w-9 h-9 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick close actions */}
        <div className="px-6 py-3 border-b border-line flex items-center gap-2 flex-wrap">
          {isClosed ? (
            <Button variant="ghost" size="sm" onClick={() => quickStage('qualified', 'Reopened')} disabled={busyAction !== null}>
              {busyAction === 'qualified' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
              Reopen
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => quickStage('closed_won', 'Closed won 🎉')} disabled={busyAction !== null} className="!text-status-up !border-status-up/40 hover:!bg-status-up/10">
                {busyAction === 'closed_won' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Close won
              </Button>
              <Button variant="ghost" size="sm" onClick={() => quickStage('closed_lost', 'Closed lost')} disabled={busyAction !== null} className="!text-danger !border-danger/40 hover:!bg-danger/10">
                {busyAction === 'closed_lost' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Close lost
              </Button>
              {opp.stage !== 'parked' ? (
                <Button variant="ghost" size="sm" onClick={() => quickStage('parked', 'Parked')} disabled={busyAction !== null}>
                  {busyAction === 'parked' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Park
                </Button>
              ) : null}
            </>
          )}
          {opp.closedAt ? (
            <span className="text-[12px] text-muted font-mono ml-auto">
              closed {formatDate(opp.closedAt)}
            </span>
          ) : null}
        </div>

        {/* Fields */}
        <div className="px-6 py-5 grid gap-4 border-b border-line">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Stage">
              <Select value={form.stage} onChange={(e) => set('stage', e.target.value as OpportunityStage)}>
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Primary contact">
              <Select value={form.primaryContactId} onChange={(e) => set('primaryContactId', e.target.value)}>
                <option value="">— none —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contactName ?? c.email ?? c.id}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner">
              <Input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Robert" />
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value as OpportunityPriority)}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Plan tier">
              <Select
                value={form.planTier}
                onChange={(e) => {
                  const tier = e.target.value as OpportunityPlanTier | ''
                  set('planTier', tier)
                  // Auto-suggest year-1 value (12× monthly + setup) when empty.
                  if (tier && !form.estimatedValue) {
                    const p = PLAN_PRICING[tier]
                    set('estimatedValue', String(p.monthlyPrice * 12 + p.setupFee))
                  }
                }}
              >
                <option value="">— none —</option>
                {PLAN_TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>{PLAN_TIER_LABELS[t]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estimated value ($)">
              <Input type="number" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} />
            </Field>
            <Field label="Confidence (%)">
              <Input type="number" min={0} max={100} value={form.confidence} onChange={(e) => set('confidence', e.target.value)} />
            </Field>
            <Field label="Close window start">
              <Input type="date" value={form.expectedCloseStart} onChange={(e) => set('expectedCloseStart', e.target.value)} />
            </Field>
            <Field label="Close window end">
              <Input type="date" value={form.expectedCloseEnd} onChange={(e) => set('expectedCloseEnd', e.target.value)} />
            </Field>
            <Field label="Next action">
              <Input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Send pilot proposal" />
            </Field>
            <Field label="Next action due">
              <Input type="datetime-local" value={form.nextActionDueAt} onChange={(e) => set('nextActionDueAt', e.target.value)} />
            </Field>
          </div>
          <Field label="Pain / use case">
            <Textarea rows={3} value={form.useCase} onChange={(e) => set('useCase', e.target.value)} placeholder="What ops workflows would Managed AI take over for them?" />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          {form.stage === 'closed_lost' || opp.stage === 'closed_lost' ? (
            <Field label="Lost reason">
              <Input value={form.lostReason} onChange={(e) => set('lostReason', e.target.value)} />
            </Field>
          ) : null}

          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={del}
              className="text-[12px] text-muted hover:text-danger inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.12em]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete opportunity
            </button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save opportunity
            </Button>
          </div>
        </div>

        {/* Linked company context */}
        <div className="px-6 py-5 border-b border-line">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-muted" />
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Company</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[13px]">
            <ContextRow label="Company" value={opp.company.companyName} />
            <ContextRow label="Industry" value={opp.company.industry} />
            <ContextRow
              label="Location"
              value={[opp.company.city, opp.company.state].filter(Boolean).join(', ') || null}
            />
            <ContextRow label="Phone" value={opp.company.phone} />
            <ContextRow label="Website" value={opp.company.website} />
            <ContextRow label="Assigned to" value={opp.company.assignedTo} />
          </div>
          {opp.company.notes ? (
            <div className="text-[12.5px] text-ink-2 mt-3 whitespace-pre-wrap bg-paper-2 border border-line rounded-lg px-3 py-2.5 leading-relaxed">
              {opp.company.notes}
            </div>
          ) : null}
        </div>

        {/* Contacts */}
        <div className="px-6 py-5 border-b border-line">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted" />
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Contacts ({contacts.length})
            </h3>
          </div>
          {contacts.length === 0 ? (
            <div className="text-[13px] text-muted py-4 text-center bg-paper-2 border border-dashed border-line rounded-lg">
              {detail ? 'No contacts on this company yet.' : 'Loading…'}
            </div>
          ) : (
            <div className="border border-line rounded-lg overflow-hidden">
              {contacts.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] text-ink font-medium truncate">
                      {c.contactName ?? c.email ?? '—'}
                    </div>
                    <div className="text-[12.5px] text-muted truncate font-mono">
                      {c.title ? `${c.title} · ` : ''}{c.email ?? ''}
                    </div>
                  </div>
                  {form.primaryContactId === c.id ? (
                    <Badge tone="teal">Primary</Badge>
                  ) : (
                    <button
                      className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted hover:text-ink"
                      onClick={() => {
                        set('primaryContactId', c.id)
                        void patch({ primaryContactId: c.id }, 'Primary contact updated')
                      }}
                    >
                      Make primary
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Correspondence */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-muted" />
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Correspondence
            </h3>
          </div>
          {!detail ? (
            <div className="text-[13px] text-muted py-4 text-center">Loading timeline…</div>
          ) : detail.correspondence.length === 0 ? (
            <div className="text-[13px] text-muted py-4 text-center bg-paper-2 border border-dashed border-line rounded-lg">
              No correspondence yet. Log touches from the Outreach contact drawer.
            </div>
          ) : (
            <ol className="relative border-l border-line ml-3 pl-5 space-y-4">
              {detail.correspondence.map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted flex-none">{label}</span>
      <span className="text-ink-2 truncate text-right">{value ?? '—'}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  New opportunity modal                                              */
/* ------------------------------------------------------------------ */

function NewOpportunityModal({
  companies,
  onClose,
  onCreated,
  onExisting,
}: {
  companies: Company[]
  onClose: () => void
  onCreated: (id: string) => void
  onExisting: (id: string) => void
}) {
  const [companyQuery, setCompanyQuery] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState({
    name: '',
    primaryContactId: '',
    stage: 'qualified' as OpportunityStage,
    priority: 'medium' as OpportunityPriority,
    specialAttention: false,
    owner: '',
    planTier: '' as OpportunityPlanTier | '',
    estimatedValue: '',
    confidence: '50',
    expectedCloseStart: '',
    expectedCloseEnd: '',
    nextAction: '',
    useCase: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const matches = useMemo(() => {
    const q = companyQuery.trim().toLowerCase()
    if (!q) return companies.slice(0, 25)
    return companies.filter((c) => c.companyName.toLowerCase().includes(q)).slice(0, 25)
  }, [companies, companyQuery])

  function pickCompany(id: string) {
    setCompanyId(id)
    const company = companies.find((c) => c.id === id)
    if (!company) return
    // Prefill opportunity context from the outreach record.
    setForm((f) => ({
      ...f,
      name: f.name || `${company.companyName} — Managed AI`,
      owner: f.owner || company.assignedTo || '',
      useCase: f.useCase || company.notes || '',
    }))
    setContacts([])
    fetch(`/api/outreach/companies/${id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.contacts) setContacts(data.contacts)
      })
      .catch(() => {})
  }

  async function submit() {
    if (!companyId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: form.name || undefined,
          primaryContactId: form.primaryContactId || null,
          stage: form.stage,
          priority: form.priority,
          specialAttention: form.specialAttention,
          owner: form.owner || null,
          planTier: form.planTier || null,
          estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
          confidence: form.confidence ? Number(form.confidence) : null,
          expectedCloseStart: form.expectedCloseStart || null,
          expectedCloseEnd: form.expectedCloseEnd || null,
          nextAction: form.nextAction || null,
          useCase: form.useCase || null,
        }),
      })
      const data = await res.json()
      if (res.status === 409 && data.opportunity?.id) {
        onExisting(data.opportunity.id)
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create')
      onCreated(data.opportunity.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <Card className="relative w-full max-w-[640px] mx-4 max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-sans font-semibold text-[20px] tracking-[-0.01em]">New opportunity</h3>
          <button
            className="w-8 h-8 grid place-items-center rounded-full border border-line-2 hover:border-accent text-ink-2 hover:text-ink"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 grid gap-3 overflow-y-auto">
          <Field label="Company *">
            <div className="grid gap-2">
              <Input
                placeholder="Search companies…"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
              />
              <Select value={companyId} onChange={(e) => pickCompany(e.target.value)}>
                <option value="">— select company —</option>
                {matches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}{c.city ? ` · ${c.city}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme — Managed AI" />
            </Field>
            <Field label="Primary contact">
              <Select
                value={form.primaryContactId}
                onChange={(e) => set('primaryContactId', e.target.value)}
                disabled={!companyId}
              >
                <option value="">— none —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.contactName ?? c.email ?? c.id}</option>
                ))}
              </Select>
            </Field>
            <Field label="Stage">
              <Select value={form.stage} onChange={(e) => set('stage', e.target.value as OpportunityStage)}>
                {ACTIVE_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value as OpportunityPriority)}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Owner">
              <Input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Robert" />
            </Field>
            <Field label="Plan tier">
              <Select
                value={form.planTier}
                onChange={(e) => {
                  const tier = e.target.value as OpportunityPlanTier | ''
                  set('planTier', tier)
                  if (tier && !form.estimatedValue) {
                    const p = PLAN_PRICING[tier]
                    set('estimatedValue', String(p.monthlyPrice * 12 + p.setupFee))
                  }
                }}
              >
                <option value="">— none —</option>
                {PLAN_TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>{PLAN_TIER_LABELS[t]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estimated value ($)">
              <Input type="number" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} />
            </Field>
            <Field label="Confidence (%)">
              <Input type="number" min={0} max={100} value={form.confidence} onChange={(e) => set('confidence', e.target.value)} />
            </Field>
            <Field label="Close window start">
              <Input type="date" value={form.expectedCloseStart} onChange={(e) => set('expectedCloseStart', e.target.value)} />
            </Field>
            <Field label="Close window end">
              <Input type="date" value={form.expectedCloseEnd} onChange={(e) => set('expectedCloseEnd', e.target.value)} />
            </Field>
          </div>
          <Field label="Next action">
            <Input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Book discovery call" />
          </Field>
          <Field label="Pain / use case">
            <Textarea rows={3} value={form.useCase} onChange={(e) => set('useCase', e.target.value)} />
          </Field>
          <Checkbox
            label="Special attention"
            description="Pin to the top of the board and the dashboard."
            checked={form.specialAttention}
            onChange={(e) => set('specialAttention', e.target.checked)}
          />
          {error ? (
            <div className="text-[13px] text-danger bg-[#2A1520] border border-[#FCA5A5]/25 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !companyId}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create
          </Button>
        </div>
      </Card>
    </div>
  )
}
