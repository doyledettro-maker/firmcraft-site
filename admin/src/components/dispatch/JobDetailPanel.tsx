'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Phone, Mail, MapPin, User, Clock, StickyNote, Loader2 } from 'lucide-react'
import { JobStatusBadge, PriorityBadge } from './badges'
import { fetchJobDetail, patchJob } from '@/lib/dispatch/client'
import { statusStyle, VALID_TRANSITIONS } from '@/lib/dispatch/status'
import type { Job, JobDetail, JobStatus, Technician } from '@/lib/dispatch/types'

interface Props {
  jobId: string | null
  technicians: Technician[]
  timeZone: string
  onClose: () => void
  onPatched: (job: Job) => void
}

export function JobDetailPanel({ jobId, technicians, timeZone, onClose, onPatched }: Props) {
  const [detail, setDetail] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fmt = useDateFormatter(timeZone)
  // Uncontrolled reschedule inputs; read on Save, reset when the job changes.
  const pendingStart = useRef('')
  const pendingEnd = useRef('')

  useEffect(() => {
    pendingStart.current = ''
    pendingEnd.current = ''
    if (!jobId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchJobDetail(jobId)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [jobId])

  async function apply(patch: Parameters<typeof patchJob>[1]) {
    if (!jobId) return
    setBusy(true)
    setError(null)
    try {
      const updated = await patchJob(jobId, patch)
      setDetail((d) => (d ? { ...d, ...updated, history: d.history } : d))
      onPatched(updated)
      // Refresh history after a status change so the timeline reflects it.
      if (patch.status) {
        const fresh = await fetchJobDetail(jobId)
        setDetail(fresh)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const open = jobId != null
  const transitions: JobStatus[] = detail ? VALID_TRANSITIONS[detail.status] ?? [] : []

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-paper border-l border-line shadow-lift-lg flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {detail ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <JobStatusBadge status={detail.status} />
                  <PriorityBadge priority={detail.priority} />
                </div>
                <h2 className="font-serif-warm text-[22px] leading-tight mt-2 text-ink truncate">{detail.title}</h2>
                <div className="text-[12.5px] text-muted mt-0.5">
                  {detail.job_type_name ?? 'Job'}{detail.source ? ` · via ${detail.source}` : ''}
                </div>
              </>
            ) : (
              <h2 className="font-serif-warm text-[20px] text-ink">Job details</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-none w-8 h-8 grid place-items-center rounded-lg text-muted hover:text-ink hover:bg-paper-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid place-items-center h-40 text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : error && !detail ? (
            <div className="p-5 text-[13px] text-danger">{error}</div>
          ) : detail ? (
            <div className="p-5 space-y-6">
              {error ? (
                <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
                  {error}
                </div>
              ) : null}

              {/* Customer */}
              <Section icon={User} title="Customer">
                <div className="text-[14px] text-ink font-medium">{detail.customer?.name ?? detail.customer_name ?? '—'}</div>
                <div className="mt-1.5 space-y-1">
                  {detail.customer?.phone ? (
                    <a href={`tel:${detail.customer.phone}`} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-accent-3">
                      <Phone className="w-3.5 h-3.5" /> {detail.customer.phone}
                    </a>
                  ) : null}
                  {detail.customer?.email ? (
                    <a href={`mailto:${detail.customer.email}`} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-accent-3">
                      <Mail className="w-3.5 h-3.5" /> {detail.customer.email}
                    </a>
                  ) : null}
                  {detail.address?.street ? (
                    <div className="flex items-start gap-2 text-[13px] text-ink-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-none" />
                      <span>
                        {detail.address.street}
                        {detail.address.city ? `, ${detail.address.city}` : ''}
                        {detail.address.state ? ` ${detail.address.state}` : ''}
                        {detail.address.zip ? ` ${detail.address.zip}` : ''}
                      </span>
                    </div>
                  ) : null}
                </div>
              </Section>

              {/* Schedule */}
              <Section icon={Clock} title="Schedule">
                <div className="text-[13px] text-ink-2">
                  {detail.scheduled_start
                    ? `${fmt(detail.scheduled_start)} → ${fmt(detail.scheduled_end, true)}`
                    : 'Not yet scheduled'}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Field label="Start">
                    <input
                      key={`start-${detail.id}`}
                      type="datetime-local"
                      defaultValue={toLocalInput(detail.scheduled_start)}
                      onChange={(e) => (pendingStart.current = e.target.value)}
                      className="w-full rounded-md border border-line-2 bg-paper-2 px-2 py-1.5 text-[12.5px] text-ink"
                    />
                  </Field>
                  <Field label="End">
                    <input
                      key={`end-${detail.id}`}
                      type="datetime-local"
                      defaultValue={toLocalInput(detail.scheduled_end)}
                      onChange={(e) => (pendingEnd.current = e.target.value)}
                      className="w-full rounded-md border border-line-2 bg-paper-2 px-2 py-1.5 text-[12.5px] text-ink"
                    />
                  </Field>
                </div>
                <button
                  disabled={busy}
                  onClick={() =>
                    apply({
                      scheduled_start: pendingStart.current ? new Date(pendingStart.current).toISOString() : detail.scheduled_start,
                      scheduled_end: pendingEnd.current ? new Date(pendingEnd.current).toISOString() : detail.scheduled_end,
                    })
                  }
                  className="mt-2 w-full rounded-md border border-line-2 bg-paper-2 px-3 py-1.5 text-[12.5px] text-ink-2 hover:border-accent hover:text-ink transition-colors disabled:opacity-50"
                >
                  Reschedule
                </button>
              </Section>

              {/* Technician */}
              <Section icon={User} title="Technician">
                <select
                  value={detail.technician_id ?? ''}
                  disabled={busy}
                  onChange={(e) => apply({ technician_id: e.target.value || null })}
                  className="w-full rounded-md border border-line-2 bg-paper-2 px-2.5 py-2 text-[13px] text-ink disabled:opacity-50"
                >
                  <option value="">— Unassigned —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Section>

              {/* Notes */}
              {detail.description || detail.tech_notes || detail.internal_notes ? (
                <Section icon={StickyNote} title="Notes">
                  {detail.description ? <p className="text-[13px] text-ink-2">{detail.description}</p> : null}
                  {detail.internal_notes ? (
                    <p className="text-[12.5px] text-muted mt-2"><span className="text-accent-2">Internal:</span> {detail.internal_notes}</p>
                  ) : null}
                  {detail.tech_notes ? (
                    <p className="text-[12.5px] text-muted mt-2"><span className="text-accent-3">Tech:</span> {detail.tech_notes}</p>
                  ) : null}
                </Section>
              ) : null}

              {/* Status history timeline */}
              <Section icon={Clock} title="Status history">
                {detail.history.length === 0 ? (
                  <div className="text-[12.5px] text-muted">No status changes recorded.</div>
                ) : (
                  <ol className="relative ml-1.5 border-l border-line-2 space-y-3 pt-1">
                    {detail.history.map((h) => {
                      const s = statusStyle(h.new_status)
                      return (
                        <li key={h.id} className="pl-4 relative">
                          <span
                            className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
                            style={{ background: s.color }}
                          />
                          <div className="text-[12.5px] text-ink">
                            {h.previous_status ? `${labelFor(h.previous_status)} → ` : ''}
                            <span className="font-medium">{s.label}</span>
                          </div>
                          <div className="text-[11px] text-muted font-mono mt-0.5">
                            {fmt(h.created_at)}{h.changed_by ? ` · ${h.changed_by}` : ''}
                          </div>
                          {h.reason ? <div className="text-[11.5px] text-muted mt-0.5">{h.reason}</div> : null}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </Section>
            </div>
          ) : null}
        </div>

        {/* Quick actions */}
        {detail ? (
          <div className="px-5 py-3.5 border-t border-line flex flex-wrap gap-2">
            {transitions
              // `created` is the un-assign/backlog revert — done via the
              // technician dropdown (which also clears the schedule), not here.
              .filter((s) => s !== 'cancelled' && s !== 'created')
              .map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => apply({ status: s })}
                  className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12.5px] text-accent-3 hover:bg-accent/20 transition-colors disabled:opacity-50"
                >
                  Mark {statusStyle(s).label}
                </button>
              ))}
            {transitions.includes('cancelled') ? (
              <button
                disabled={busy}
                onClick={() => {
                  if (confirm('Cancel this job? The slot will be released.')) apply({ status: 'cancelled' })
                }}
                className="ml-auto rounded-full border border-danger/50 px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger hover:text-paper transition-colors disabled:opacity-50"
              >
                Cancel job
              </button>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted font-mono mb-2">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] text-muted mb-1">{label}</span>
      {children}
    </label>
  )
}

function labelFor(status: JobStatus) {
  return statusStyle(status).label
}

function useDateFormatter(timeZone: string) {
  return (iso: string | null, timeOnly = false): string => {
    if (!iso) return '—'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: timeOnly ? undefined : 'short',
      day: timeOnly ? undefined : 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  }
}

// ISO → value for <input type="datetime-local"> in the browser's local zone.
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
