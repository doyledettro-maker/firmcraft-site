'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DispatchCalendar, type BoardView, type CalendarMove } from '@/components/dispatch/DispatchCalendar'
import { MapView } from '@/components/dispatch/MapView'
import { UnassignedSidebar } from '@/components/dispatch/UnassignedSidebar'
import { JobDetailPanel } from '@/components/dispatch/JobDetailPanel'
import { FilterBar, type BoardFilters } from '@/components/dispatch/FilterBar'
import { fetchBoard, patchJob } from '@/lib/dispatch/client'
import { useDispatchRealtime } from '@/lib/dispatch/use-realtime'
import type { BoardData, Job } from '@/lib/dispatch/types'

export interface InitialState {
  date: string // ISO date (yyyy-mm-dd)
  view: BoardView
  filters: BoardFilters
}

interface Props {
  initialBoard: BoardData
  initial: InitialState
}

export function DispatchBoard({ initialBoard, initial }: Props) {
  const [board, setBoard] = useState<BoardData>(initialBoard)
  const [date, setDate] = useState<Date>(() => parseDate(initial.date))
  const [view, setView] = useState<BoardView>(initial.view)
  const [filters, setFilters] = useState<BoardFilters>(initial.filters)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const windowRef = useRef<{ from: string; to: string } | null>(null)
  const timeZone = board.tenant.timezone || 'America/Chicago'

  // ---- Data loading -------------------------------------------------------
  const reload = useCallback(async () => {
    const w = windowRef.current
    try {
      const fresh = await fetchBoard(w ?? {})
      setBoard(fresh)
    } catch {
      /* keep last good board; realtime/poll will retry */
    }
  }, [])

  const handleDatesSet = useCallback(
    (w: { from: string; to: string }) => {
      const prev = windowRef.current
      windowRef.current = w
      if (!prev || prev.from !== w.from || prev.to !== w.to) void reload()
    },
    [reload],
  )

  // Realtime: refetch the active window whenever a job/location changes.
  useDispatchRealtime(reload, { onStatus: setLive })

  // ---- URL persistence (no navigation; just keep the address bar in sync) -
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('date', toDateStr(date))
    params.set('view', view)
    if (filters.techIds.length) params.set('tech', filters.techIds.join(','))
    if (filters.statuses.length) params.set('status', filters.statuses.join(','))
    if (filters.jobTypeIds.length) params.set('type', filters.jobTypeIds.join(','))
    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [date, view, filters])

  // ---- Mutations ----------------------------------------------------------
  const showError = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  /** Merge a server-updated job into local board state for snappy UI. */
  const mergeJob = useCallback((job: Job) => {
    setBoard((b) => ({ ...b, jobs: b.jobs.map((j) => (j.id === job.id ? job : j)) }))
  }, [])

  const onJobMove = useCallback(
    async (m: CalendarMove) => {
      try {
        const updated = await patchJob(m.jobId, {
          technician_id: m.technicianId,
          scheduled_start: m.start,
          scheduled_end: m.end,
        })
        mergeJob(updated)
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Move failed')
        throw e // let the calendar revert
      }
    },
    [mergeJob],
  )

  const onJobResize = useCallback(
    async (m: { jobId: string; start: string; end: string }) => {
      try {
        const updated = await patchJob(m.jobId, { scheduled_start: m.start, scheduled_end: m.end })
        mergeJob(updated)
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Resize failed')
        throw e
      }
    },
    [mergeJob],
  )

  const onExternalAssign = useCallback(
    async (a: { jobId: string; technicianId: string; start: string; durationMin: number }) => {
      const end = new Date(new Date(a.start).getTime() + a.durationMin * 60_000).toISOString()
      try {
        const updated = await patchJob(a.jobId, {
          technician_id: a.technicianId,
          scheduled_start: a.start,
          scheduled_end: end,
        })
        mergeJob(updated)
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Assign failed')
        void reload() // re-sync the sidebar/calendar on failure
      }
    },
    [mergeJob, reload],
  )

  // ---- Derived (filtered) data -------------------------------------------
  const passes = useCallback(
    (j: Job) => {
      if (filters.techIds.length && (!j.technician_id || !filters.techIds.includes(j.technician_id))) return false
      if (filters.statuses.length && !filters.statuses.includes(j.status)) return false
      if (filters.jobTypeIds.length && (!j.job_type_id || !filters.jobTypeIds.includes(j.job_type_id))) return false
      return true
    },
    [filters],
  )

  const visibleTechs = useMemo(
    () => (filters.techIds.length ? board.technicians.filter((t) => filters.techIds.includes(t.id)) : board.technicians),
    [board.technicians, filters.techIds],
  )

  const filteredJobs = useMemo(() => board.jobs.filter(passes), [board.jobs, passes])

  const unassigned = useMemo(
    () => filteredJobs.filter((j) => j.status === 'created' && !j.technician_id),
    [filteredJobs],
  )

  const dateLabel = useMemo(() => formatDateLabel(date, view, timeZone), [date, view, timeZone])

  // ---- Navigation ---------------------------------------------------------
  const step = (dir: -1 | 1) =>
    setDate((d) => addDays(d, dir * (view === 'day' ? 1 : 7)))

  return (
    <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden">
      <FilterBar
        dateLabel={dateLabel}
        view={view}
        filters={filters}
        technicians={board.technicians}
        jobTypes={board.jobTypes}
        live={live}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onToday={() => setDate(new Date())}
        onViewChange={setView}
        onFiltersChange={setFilters}
      />

      <div className="flex-1 flex min-h-0">
        <div className="w-[260px] flex-none hidden lg:block">
          <UnassignedSidebar jobs={unassigned} selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} />
        </div>

        <SplitPane
          left={
            <DispatchCalendar
              technicians={visibleTechs}
              jobs={filteredJobs}
              view={view}
              date={date}
              selectedJobId={selectedJobId}
              timeZone={timeZone}
              onJobClick={setSelectedJobId}
              onJobMove={onJobMove}
              onJobResize={onJobResize}
              onExternalAssign={onExternalAssign}
              onDatesSet={handleDatesSet}
            />
          }
          right={
            <MapView
              jobs={filteredJobs}
              technicians={visibleTechs}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
            />
          }
        />
      </div>

      <JobDetailPanel
        jobId={selectedJobId}
        technicians={board.technicians}
        timeZone={timeZone}
        onClose={() => setSelectedJobId(null)}
        onPatched={mergeJob}
      />

      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] rounded-lg border border-danger/50 bg-paper-2 px-4 py-2.5 text-[13px] text-danger shadow-lift-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Resizable split: calendar (left) / map (right). Divider drag persists to
// localStorage so the layout survives reloads.
// ---------------------------------------------------------------------------
function SplitPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const [leftPct, setLeftPct] = useState(62)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const saved = Number(localStorage.getItem('dispatch.splitPct'))
    if (saved >= 30 && saved <= 80) setLeftPct(saved)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(80, Math.max(30, pct))
      setLeftPct(clamped)
    }
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false
        document.body.style.cursor = ''
        localStorage.setItem('dispatch.splitPct', String(Math.round(leftPctRef.current)))
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const leftPctRef = useRef(leftPct)
  leftPctRef.current = leftPct

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 relative">
      <div style={{ width: `${leftPct}%` }} className="min-w-0 h-full border-r border-line">
        {left}
      </div>
      <div
        onPointerDown={() => {
          dragging.current = true
          document.body.style.cursor = 'col-resize'
        }}
        className="w-1.5 cursor-col-resize bg-line-2 hover:bg-accent/60 active:bg-accent transition-colors flex-none"
        role="separator"
        aria-orientation="vertical"
      />
      <div className="flex-1 min-w-0 h-full">{right}</div>
    </div>
  )
}

// ---- date helpers ---------------------------------------------------------
function parseDate(s: string): Date {
  const d = new Date(`${s}T12:00:00`) // noon avoids DST edge flips
  return isNaN(d.getTime()) ? new Date() : d
}
function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function formatDateLabel(date: Date, view: BoardView, timeZone: string): string {
  if (view === 'day') {
    return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'long', day: 'numeric' }).format(date)
  }
  const start = startOfWeek(date)
  const end = addDays(start, 6)
  const f = (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(d)
  return `${f(start)} – ${f(end)}`
}
function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay()) // Sunday-start, matches FullCalendar default
  return x
}
