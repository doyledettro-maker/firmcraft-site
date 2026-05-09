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
    color: 'var(--accent-2)',
    bg: 'rgba(107,142,90,.08)',
    border: 'rgba(107,142,90,.3)',
  },
  degraded: {
    label: 'Degraded performance',
    color: '#B45A3A',
    bg: 'rgba(180,90,58,.08)',
    border: 'rgba(180,90,58,.3)',
  },
  down: {
    label: 'Service disruption',
    color: '#B45A3A',
    bg: 'rgba(180,90,58,.10)',
    border: 'rgba(180,90,58,.4)',
  },
}

// When LiteLLM/Langfuse health endpoints are live, replace the literal below
// with a fetch (server-side, with a short revalidate window) and map the
// response to one of the keys in STATUS_MAP.
export function StatusBanner() {
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
        className="font-mono-warm text-[12px] uppercase tracking-[0.14em] font-medium"
        style={{ color: info.color }}
      >
        {info.label}
      </span>
      <span className="ml-auto font-mono-warm text-[11px] text-muted tracking-[0.06em]">
        Updated continuously
      </span>
    </div>
  )
}
