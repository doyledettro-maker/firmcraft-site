'use client'

import { priorityStyle, statusStyle } from '@/lib/dispatch/status'
import type { JobPriority, JobStatus } from '@/lib/dispatch/types'

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(' ')
}

const base =
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] whitespace-nowrap'

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const s = statusStyle(status)
  return (
    <span className={cn(base, s.badge, className)}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: JobPriority; className?: string }) {
  const p = priorityStyle(priority)
  if (priority === 'standard') return null // standard is the default — no badge noise
  return <span className={cn(base, p.badge, className)}>{p.label}</span>
}
