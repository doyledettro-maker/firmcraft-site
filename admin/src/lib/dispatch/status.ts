// Job status + priority presentation: colors, labels, and the lifecycle state
// machine. The color map is the single source of truth shared by the calendar
// event blocks, the map pins, and the status badges — change a color here and
// every surface updates.

import type { JobStatus, JobPriority } from './types'

export interface StatusStyle {
  label: string
  /** Solid hex used for map pins and calendar event fill. */
  color: string
  /** Tailwind text/border classes for inline badges on the dark theme. */
  badge: string
}

export const STATUS_STYLES: Record<JobStatus, StatusStyle> = {
  created: { label: 'Created', color: '#94a3b8', badge: 'text-slate-300 border-slate-400/30 bg-slate-400/10' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', badge: 'text-blue-300 border-blue-400/30 bg-blue-400/10' },
  dispatched: { label: 'Dispatched', color: '#8b5cf6', badge: 'text-violet-300 border-violet-400/30 bg-violet-400/10' },
  en_route: { label: 'En Route', color: '#f97316', badge: 'text-orange-300 border-orange-400/30 bg-orange-400/10' },
  arrived: { label: 'Arrived', color: '#eab308', badge: 'text-yellow-300 border-yellow-400/30 bg-yellow-400/10' },
  in_progress: { label: 'In Progress', color: '#22c55e', badge: 'text-green-300 border-green-400/30 bg-green-400/10' },
  completed: { label: 'Completed', color: '#14b8a6', badge: 'text-teal-300 border-teal-400/30 bg-teal-400/10' },
  invoiced: { label: 'Invoiced', color: '#0ea5e9', badge: 'text-sky-300 border-sky-400/30 bg-sky-400/10' },
  cancelled: { label: 'Cancelled', color: '#ef4444', badge: 'text-red-300 border-red-400/30 bg-red-400/10' },
  on_hold: { label: 'On Hold', color: '#a16207', badge: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
}

export const STATUS_ORDER: JobStatus[] = [
  'created', 'scheduled', 'dispatched', 'en_route', 'arrived',
  'in_progress', 'on_hold', 'completed', 'invoiced', 'cancelled',
]

export function statusStyle(status: JobStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.created
}

export function statusColor(status: JobStatus): string {
  return statusStyle(status).color
}

// Valid transitions, mirrored from the Postgres trigger
// (20260609_007_scheduling_triggers.sql). Kept here so the UI can disable
// invalid quick-actions before the DB rejects them.
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  created: ['scheduled', 'cancelled'],
  scheduled: ['dispatched', 'cancelled'],
  dispatched: ['en_route', 'cancelled'],
  en_route: ['arrived'],
  arrived: ['in_progress'],
  in_progress: ['completed', 'on_hold'],
  on_hold: ['in_progress'],
  completed: ['invoiced'],
  invoiced: [],
  cancelled: [],
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export interface PriorityStyle {
  label: string
  badge: string
}

export const PRIORITY_STYLES: Record<JobPriority, PriorityStyle> = {
  emergency: { label: 'Emergency', badge: 'text-red-200 border-red-400/40 bg-red-500/20' },
  urgent: { label: 'Urgent', badge: 'text-orange-200 border-orange-400/40 bg-orange-500/15' },
  standard: { label: 'Standard', badge: 'text-slate-300 border-slate-400/30 bg-slate-400/10' },
  flexible: { label: 'Flexible', badge: 'text-sky-300 border-sky-400/30 bg-sky-400/10' },
}

export function priorityStyle(priority: JobPriority): PriorityStyle {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.standard
}
