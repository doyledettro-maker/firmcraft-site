import { resolveTenant, getBoardData } from '@/lib/dispatch/server'
import { DispatchBoard, type InitialState } from './DispatchBoard'
import type { BoardView } from '@/components/dispatch/DispatchCalendar'
import type { JobStatus } from '@/lib/dispatch/types'

export const metadata = { title: 'Dispatch Board' }
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function csv(v: string | string[] | undefined): string[] {
  if (!v) return []
  const s = Array.isArray(v) ? v[0] : v
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default async function DispatchPage({ searchParams }: { searchParams: SearchParams }) {
  const tenant = await resolveTenant()
  if (!tenant) {
    return (
      <div className="h-screen grid place-items-center bg-paper text-center p-8">
        <div>
          <h1 className="font-serif-warm text-3xl text-ink mb-2">No workspace found</h1>
          <p className="text-muted max-w-[420px]">
            This dispatch board could not resolve a tenant. Make sure Supabase is configured and the
            demo tenant is seeded (slug <code className="font-mono text-accent-3">demo</code>).
          </p>
        </div>
      </div>
    )
  }

  const view: BoardView = csv(searchParams.view)[0] === 'week' ? 'week' : 'day'
  const dateParam = csv(searchParams.date)[0]
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(`${dateParam}T12:00:00`) : new Date()

  // First-paint window: a generous band around the active date (the client
  // refines it precisely from FullCalendar's datesSet on mount). Kept bounded
  // rather than unbounded so this scales past the demo's handful of jobs.
  const from = new Date(date)
  from.setDate(from.getDate() - 8)
  const to = new Date(date)
  to.setDate(to.getDate() + 9)

  const board = await getBoardData(tenant.id, { from: from.toISOString(), to: to.toISOString() })
  if (!board) {
    return (
      <div className="h-screen grid place-items-center bg-paper">
        <p className="text-muted">Failed to load board data.</p>
      </div>
    )
  }

  const initial: InitialState = {
    date: dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : dateStr(new Date()),
    view,
    filters: {
      techIds: csv(searchParams.tech),
      statuses: csv(searchParams.status) as JobStatus[],
      jobTypeIds: csv(searchParams.type),
    },
  }

  return <DispatchBoard initialBoard={board} initial={initial} />
}
