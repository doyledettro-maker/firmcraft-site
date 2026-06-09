'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ListFilter, Check, Wifi, WifiOff } from 'lucide-react'
import { STATUS_ORDER, statusStyle } from '@/lib/dispatch/status'
import type { JobStatus, JobType, Technician } from '@/lib/dispatch/types'
import type { BoardView } from './DispatchCalendar'

export interface BoardFilters {
  techIds: string[]
  statuses: JobStatus[]
  jobTypeIds: string[]
}

interface Props {
  dateLabel: string
  view: BoardView
  filters: BoardFilters
  technicians: Technician[]
  jobTypes: JobType[]
  live: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: BoardView) => void
  onFiltersChange: (f: BoardFilters) => void
}

export function FilterBar({
  dateLabel, view, filters, technicians, jobTypes, live,
  onPrev, onNext, onToday, onViewChange, onFiltersChange,
}: Props) {
  const activeCount = filters.techIds.length + filters.statuses.length + filters.jobTypeIds.length

  return (
    <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 border-b border-line bg-paper">
      {/* Date navigation */}
      <div className="flex items-center gap-1">
        <NavBtn onClick={onPrev} aria-label="Previous"><ChevronLeft className="w-4 h-4" /></NavBtn>
        <button
          onClick={onToday}
          className="h-8 px-3 rounded-lg border border-line-2 text-[12.5px] text-ink-2 hover:border-accent hover:text-ink transition-colors"
        >
          Today
        </button>
        <NavBtn onClick={onNext} aria-label="Next"><ChevronRight className="w-4 h-4" /></NavBtn>
      </div>

      <div className="text-[14px] font-medium text-ink min-w-[150px]">{dateLabel}</div>

      {/* View toggle */}
      <div className="flex rounded-lg border border-line-2 overflow-hidden">
        {(['day', 'week'] as BoardView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`h-8 px-3.5 text-[12.5px] capitalize transition-colors ${
              view === v ? 'bg-accent text-white' : 'text-ink-2 hover:bg-paper-2'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Realtime indicator */}
        <span
          className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md ${
            live ? 'text-status-up' : 'text-muted'
          }`}
          title={live ? 'Live — realtime connected' : 'Reconnecting…'}
        >
          {live ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {live ? 'Live' : 'Offline'}
        </span>

        {/* Technician filter */}
        <FilterMenu
          label="Technicians"
          options={technicians.map((t) => ({ id: t.id, label: t.name, color: t.color ?? undefined }))}
          selected={filters.techIds}
          onChange={(techIds) => onFiltersChange({ ...filters, techIds })}
        />
        {/* Status filter */}
        <FilterMenu
          label="Status"
          options={STATUS_ORDER.map((s) => ({ id: s, label: statusStyle(s).label, color: statusStyle(s).color }))}
          selected={filters.statuses}
          onChange={(statuses) => onFiltersChange({ ...filters, statuses: statuses as JobStatus[] })}
        />
        {/* Job type filter */}
        <FilterMenu
          label="Type"
          options={jobTypes.map((t) => ({ id: t.id, label: t.name, color: t.color ?? undefined }))}
          selected={filters.jobTypeIds}
          onChange={(jobTypeIds) => onFiltersChange({ ...filters, jobTypeIds })}
        />

        {activeCount > 0 ? (
          <button
            onClick={() => onFiltersChange({ techIds: [], statuses: [], jobTypeIds: [] })}
            className="h-8 px-3 rounded-lg text-[12px] text-accent-2 hover:bg-paper-2 transition-colors"
          >
            Clear ({activeCount})
          </button>
        ) : null}
      </div>
    </div>
  )
}

function NavBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="h-8 w-8 grid place-items-center rounded-lg border border-line-2 text-ink-2 hover:border-accent hover:text-ink transition-colors"
    >
      {children}
    </button>
  )
}

interface Option {
  id: string
  label: string
  color?: string
}

function FilterMenu({
  label, options, selected, onChange,
}: {
  label: string
  options: Option[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-lg border text-[12.5px] transition-colors ${
          selected.length > 0 ? 'border-accent text-ink bg-accent/10' : 'border-line-2 text-ink-2 hover:border-accent/60'
        }`}
      >
        <ListFilter className="w-3.5 h-3.5" />
        {label}
        {selected.length > 0 ? <span className="font-mono text-[11px]">{selected.length}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-1.5 w-56 max-h-72 overflow-y-auto rounded-xl border border-line-2 bg-paper-2 shadow-lift-lg z-30 p-1.5">
          {options.map((o) => {
            const on = selected.includes(o.id)
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-ink-2 hover:bg-paper hover:text-ink transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded grid place-items-center border ${on ? 'bg-accent border-accent' : 'border-line-2'}`}
                >
                  {on ? <Check className="w-3 h-3 text-white" /> : null}
                </span>
                {o.color ? <span className="w-2 h-2 rounded-full flex-none" style={{ background: o.color }} /> : null}
                <span className="truncate text-left flex-1">{o.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
