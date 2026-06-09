'use client'

import { useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import type {
  EventDropArg, EventClickArg, EventContentArg, DatesSetArg,
} from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { FULLCALENDAR_LICENSE_KEY } from '@/lib/dispatch/fullcalendar-license'
import { statusStyle } from '@/lib/dispatch/status'
import type { Job, Technician } from '@/lib/dispatch/types'
import './calendar-theme.css'

export type BoardView = 'day' | 'week'

export interface CalendarMove {
  jobId: string
  technicianId: string | null
  start: string
  end: string
}

interface Props {
  technicians: Technician[]
  jobs: Job[]
  view: BoardView
  date: Date
  selectedJobId: string | null
  timeZone: string
  onJobClick: (jobId: string) => void
  onJobMove: (move: CalendarMove) => Promise<void>
  onJobResize: (move: { jobId: string; start: string; end: string }) => Promise<void>
  onExternalAssign: (assign: { jobId: string; technicianId: string; start: string; durationMin: number }) => Promise<void>
  onDatesSet: (window: { from: string; to: string }) => void
}

// Statuses that still occupy a slot but are "closed" — dimmed on the board.
const DIMMED = new Set(['completed', 'invoiced', 'cancelled'])

/** Mark job ids that overlap another job on the same technician. */
function computeConflicts(jobs: Job[]): Set<string> {
  const byTech = new Map<string, Job[]>()
  for (const j of jobs) {
    if (!j.technician_id || !j.scheduled_start || !j.scheduled_end) continue
    if (DIMMED.has(j.status)) continue
    const list = byTech.get(j.technician_id) ?? []
    list.push(j)
    byTech.set(j.technician_id, list)
  }
  const conflicts = new Set<string>()
  for (const list of Array.from(byTech.values())) {
    list.sort((a: Job, b: Job) => a.scheduled_start!.localeCompare(b.scheduled_start!))
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const cur = list[i]
      if (cur.scheduled_start! < prev.scheduled_end!) {
        conflicts.add(cur.id)
        conflicts.add(prev.id)
      }
    }
  }
  return conflicts
}

export function DispatchCalendar({
  technicians, jobs, view, date, selectedJobId, timeZone,
  onJobClick, onJobMove, onJobResize, onExternalAssign, onDatesSet,
}: Props) {
  const calRef = useRef<FullCalendar | null>(null)

  // Drive the calendar imperatively from the controlled date/view props.
  useEffect(() => {
    const api = calRef.current?.getApi()
    if (!api) return
    const target = view === 'day' ? 'resourceTimelineDay' : 'resourceTimelineWeek'
    if (api.view.type !== target) api.changeView(target)
  }, [view])

  useEffect(() => {
    const api = calRef.current?.getApi()
    if (!api) return
    if (api.getDate().toDateString() !== date.toDateString()) api.gotoDate(date)
  }, [date])

  const conflicts = useMemo(() => computeConflicts(jobs), [jobs])

  const resources = useMemo(
    () => technicians.map((t) => ({ id: t.id, title: t.name, eventColor: t.color ?? '#2C6BF0', extendedProps: { tech: t } })),
    [technicians],
  )

  const events = useMemo(
    () =>
      jobs
        .filter((j) => j.technician_id && j.scheduled_start && j.scheduled_end)
        .map((j) => {
          const style = statusStyle(j.status)
          const classes: string[] = []
          if (conflicts.has(j.id)) classes.push('dispatch-conflict')
          if (DIMMED.has(j.status)) classes.push('dispatch-dimmed')
          return {
            id: j.id,
            resourceId: j.technician_id!,
            title: j.title,
            start: j.scheduled_start!,
            end: j.scheduled_end!,
            backgroundColor: style.color,
            borderColor: style.color,
            editable: !DIMMED.has(j.status),
            classNames: classes,
            extendedProps: { job: j },
          }
        }),
    [jobs, conflicts],
  )

  async function handleDrop(arg: EventDropArg) {
    const job = arg.event.extendedProps.job as Job
    const newResourceId = arg.newResource?.id ?? arg.event.getResources()[0]?.id ?? job.technician_id
    try {
      await onJobMove({
        jobId: job.id,
        technicianId: newResourceId ?? null,
        start: arg.event.start!.toISOString(),
        end: (arg.event.end ?? arg.event.start)!.toISOString(),
      })
    } catch {
      arg.revert()
    }
  }

  async function handleResize(arg: EventResizeDoneArg) {
    const job = arg.event.extendedProps.job as Job
    try {
      await onJobResize({
        jobId: job.id,
        start: arg.event.start!.toISOString(),
        end: (arg.event.end ?? arg.event.start)!.toISOString(),
      })
    } catch {
      arg.revert()
    }
  }

  function handleClick(arg: EventClickArg) {
    onJobClick((arg.event.extendedProps.job as Job).id)
  }

  return (
    <div className="dispatch-calendar h-full">
      <FullCalendar
        ref={calRef}
        schedulerLicenseKey={FULLCALENDAR_LICENSE_KEY}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView={view === 'day' ? 'resourceTimelineDay' : 'resourceTimelineWeek'}
        initialDate={date}
        timeZone={timeZone}
        headerToolbar={false}
        height="100%"
        nowIndicator
        editable
        droppable
        eventResizableFromStart
        resourceAreaHeaderContent="Technician"
        resourceAreaWidth="180px"
        resources={resources}
        events={events}
        slotMinTime="06:00:00"
        slotMaxTime="20:00:00"
        slotDuration={view === 'day' ? '00:30:00' : { days: 1 }}
        snapDuration="00:15:00"
        scrollTime="07:00:00"
        eventClick={handleClick}
        eventDrop={handleDrop}
        eventResize={handleResize}
        datesSet={(arg: DatesSetArg) =>
          onDatesSet({ from: arg.start.toISOString(), to: arg.end.toISOString() })
        }
        // External drop from the unassigned sidebar (interactionPlugin Draggable).
        eventReceive={(info) => {
          const el = info.draggedEl as HTMLElement
          const jobId = el.dataset.jobId
          const durationMin = Number(el.dataset.durationMin || '60')
          const resourceId = info.event.getResources()[0]?.id
          const start = info.event.start
          // Remove the auto-created placeholder; our board state re-adds the
          // real event after the PATCH succeeds (events are controlled).
          info.event.remove()
          if (jobId && resourceId && start) {
            void onExternalAssign({ jobId, technicianId: resourceId, start: start.toISOString(), durationMin })
          }
        }}
        eventContent={renderEvent}
      />
    </div>
  )
}

function renderEvent(arg: EventContentArg) {
  const job = arg.event.extendedProps.job as Job | undefined
  const time = arg.timeText
  return (
    <div className="px-1.5 py-1 leading-tight overflow-hidden">
      <div className="text-[11px] font-semibold text-white/95 truncate">{arg.event.title}</div>
      {job?.customer_name ? (
        <div className="text-[10px] text-white/80 truncate">{job.customer_name}</div>
      ) : null}
      {time ? <div className="text-[9.5px] font-mono text-white/70 truncate">{time}</div> : null}
    </div>
  )
}
