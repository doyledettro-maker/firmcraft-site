'use client'

import { useEffect, useRef } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import { Inbox, MapPin } from 'lucide-react'
import { PriorityBadge } from './badges'
import type { Job } from '@/lib/dispatch/types'

interface Props {
  jobs: Job[]
  selectedJobId: string | null
  onSelectJob: (jobId: string) => void
}

/**
 * Backlog of unassigned `created` jobs. Each card is a FullCalendar external
 * Draggable — dropping one onto a technician row in the calendar assigns + dates
 * the job (handled by the calendar's eventReceive → onExternalAssign).
 */
export function UnassignedSidebar({ jobs, selectedJobId, onSelectJob }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.dispatch-unassigned-card',
      eventData(el) {
        const durationMin = Number((el as HTMLElement).dataset.durationMin || '60')
        return {
          title: (el as HTMLElement).dataset.title || 'Job',
          duration: { minutes: durationMin },
        }
      },
    })
    return () => draggable.destroy()
  }, [])

  return (
    <div className="flex flex-col h-full bg-paper border-r border-line">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <Inbox className="w-4 h-4 text-accent-2" />
        <span className="text-[13px] font-semibold text-ink">Unassigned</span>
        <span className="ml-auto text-[11px] font-mono text-muted">{jobs.length}</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {jobs.length === 0 ? (
          <div className="text-center text-muted text-[12.5px] py-10 px-4">
            No unassigned jobs. Drag a job here by un-assigning it, or new bookings land here.
          </div>
        ) : (
          jobs.map((j) => (
            <div
              key={j.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectJob(j.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectJob(j.id)
                }
              }}
              data-job-id={j.id}
              data-title={j.title}
              data-duration-min={j.estimated_duration ?? 60}
              className={`dispatch-unassigned-card cursor-grab active:cursor-grabbing select-none rounded-lg border bg-paper-2 px-3 py-2.5 transition-colors ${
                j.id === selectedJobId ? 'border-accent' : 'border-line-2 hover:border-accent/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-ink leading-tight">{j.customer_name ?? 'Customer'}</span>
                <PriorityBadge priority={j.priority} />
              </div>
              <div className="text-[12px] text-ink-2 mt-0.5 leading-tight">{j.job_type_name ?? j.title}</div>
              {j.address?.street ? (
                <div className="flex items-center gap-1 text-[11px] text-muted mt-1.5">
                  <MapPin className="w-3 h-3 flex-none" />
                  <span className="truncate">{j.address.street}{j.address.city ? `, ${j.address.city}` : ''}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 mt-1.5 text-[10.5px] font-mono text-muted">
                <span>{j.estimated_duration ?? 60}m</span>
                {j.estimated_revenue ? <span>· ${j.estimated_revenue.toFixed(0)}</span> : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-line text-[11px] text-muted leading-snug">
        Drag a card onto a technician&apos;s row to schedule it.
      </div>
    </div>
  )
}
