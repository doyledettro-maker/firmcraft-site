'use client'

import { useMemo, useState } from 'react'
import { Check, RotateCcw, TrendingDown } from 'lucide-react'
import { MODULES, SETUP_NOTE } from './data'

function money(n: number) {
  return `$${n.toLocaleString('en-US')}`
}

export function PricingCalculator() {
  // All modules start selected — the full-stack story is the strongest open.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(MODULES.map((m) => m.id)))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totals = useMemo(() => {
    const picked = MODULES.filter((m) => selected.has(m.id))
    const firmcraft = picked.reduce((s, m) => s + m.price, 0)
    const legacyLow = picked.reduce((s, m) => s + m.legacyLow, 0)
    const legacyHigh = picked.reduce((s, m) => s + m.legacyHigh, 0)
    const setup = picked.length >= 3 ? 1500 : picked.length * 500
    return { count: picked.length, firmcraft, legacyLow, legacyHigh, setup }
  }, [selected])

  const saveLow = Math.max(0, totals.legacyLow - totals.firmcraft)
  const saveHigh = Math.max(0, totals.legacyHigh - totals.firmcraft)

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Module picker */}
      <div className="grid sm:grid-cols-2 gap-3">
        {MODULES.map((m) => {
          const on = selected.has(m.id)
          const Icon = m.icon
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              aria-pressed={on}
              className={`text-left rounded-2xl border p-4 transition-all ${
                on
                  ? 'border-accent bg-accent/[0.06] shadow-lift'
                  : 'border-line-2 bg-paper hover:border-ink-2/40 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid place-items-center w-9 h-9 rounded-xl border ${
                      on ? 'bg-accent/15 border-accent/30 text-accent-3' : 'bg-paper-2 border-line-2 text-muted'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-medium text-ink leading-tight">{m.name}</div>
                    <div className="font-mono-warm text-[12px] text-accent-3 mt-0.5">{money(m.price)}/mo</div>
                  </div>
                </div>
                <span
                  className={`flex-none grid place-items-center w-5 h-5 rounded-md border transition-colors ${
                    on ? 'bg-accent border-accent text-white' : 'border-line-2 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[12.5px] text-ink-2 mt-3 leading-snug">{m.tagline}</p>
              <div className="mt-3 pt-3 border-t border-line text-[11.5px] leading-snug">
                <span className="text-muted">Replaces </span>
                <span className="text-ink-2">{m.replacesTools}</span>
                <span className="text-muted"> · they pay </span>
                <span className="text-accent-2 font-medium">
                  {m.legacyLow === 0 ? `up to ${money(m.legacyHigh)}` : `${money(m.legacyLow)}–${money(m.legacyHigh)}`}/mo
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Live quote */}
      <div className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-line-2 bg-paper overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div className="font-mono-warm text-[11px] uppercase tracking-[0.16em] text-muted">Live quote</div>
            <button
              type="button"
              onClick={() => setSelected(new Set(MODULES.map((m) => m.id)))}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Full stack
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            <Row label="Modules selected" value={`${totals.count} of ${MODULES.length}`} />

            <div className="rounded-xl bg-accent/[0.07] border border-accent/20 px-4 py-3.5">
              <div className="text-[12px] text-ink-2">Firmcraft — one platform</div>
              <div className="font-serif-warm text-[34px] leading-none text-ink mt-1 tabular-nums">
                {money(totals.firmcraft)}
                <span className="text-[15px] text-muted font-sans">/mo</span>
              </div>
            </div>

            <Row
              label="What they pay now"
              value={
                totals.count === 0
                  ? '—'
                  : `${money(totals.legacyLow)}–${money(totals.legacyHigh)}/mo`
              }
              valueClass="text-accent-2"
            />

            {saveHigh > 0 && (
              <div className="rounded-xl bg-status-up/[0.08] border border-status-up/25 px-4 py-3 flex items-start gap-2.5">
                <TrendingDown className="w-4 h-4 text-status-up mt-0.5 flex-none" />
                <div>
                  <div className="text-[12px] text-ink-2">Estimated monthly savings</div>
                  <div className="font-serif-warm text-[22px] leading-tight text-status-up tabular-nums mt-0.5">
                    {saveLow > 0 ? `${money(saveLow)}–${money(saveHigh)}` : `up to ${money(saveHigh)}`}
                  </div>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    {saveLow > 0 ? `${money(saveLow * 12)}–${money(saveHigh * 12)}` : `up to ${money(saveHigh * 12)}`} a
                    year
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-line">
              <Row label="One-time setup" value={totals.count === 0 ? '—' : money(totals.setup)} />
            </div>
          </div>
        </div>
        <p className="text-[11.5px] text-muted leading-snug mt-3 px-1">{SETUP_NOTE}</p>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className={`text-[14px] font-medium tabular-nums ${valueClass ?? 'text-ink'}`}>{value}</span>
    </div>
  )
}
