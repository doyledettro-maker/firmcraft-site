type Status = 'operational' | 'degraded' | 'down'

type StatusInfo = {
  label: string
  color: string
  bg: string
  border: string
}

const STATUS_MAP: Record<Status, StatusInfo> = {
  operational: {
    label: 'All systems operational',
    color: 'var(--color-ok)',
    bg: 'rgba(16,185,129,.08)',
    border: 'rgba(16,185,129,.3)',
  },
  degraded: {
    label: 'Degraded performance',
    color: 'var(--color-operator)',
    bg: 'rgba(251,124,80,.08)',
    border: 'rgba(251,124,80,.3)',
  },
  down: {
    label: 'Service disruption',
    color: 'var(--color-operator)',
    bg: 'rgba(251,124,80,.10)',
    border: 'rgba(251,124,80,.4)',
  },
}

// TODO: Wire to real health checks — currently hardcoded.
// Ping LiteLLM /health and per-client Hermes instances, map response to
// a STATUS_MAP key. Use a server-side fetch with a short revalidate window
// (e.g. `next: { revalidate: 30 }`) so the banner reflects live state.
export function StatusBanner() {
  // TODO: replace this literal with the resolved status from the health check
  const status: Status = 'operational'
  const info = STATUS_MAP[status]

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border px-5 py-3.5"
      style={{ background: info.bg, borderColor: info.border }}
    >
      <span className="relative flex h-2.5 w-2.5 flex-none">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: info.color }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ background: info.color }}
        />
      </span>
      <span
        className="font-mono text-[12px] uppercase tracking-[0.14em] font-medium"
        style={{ color: info.color }}
      >
        {info.label}
      </span>
      <span className="ml-auto font-mono text-[11px] text-muted tracking-[0.06em]">
        Updated continuously
      </span>
    </div>
  )
}
