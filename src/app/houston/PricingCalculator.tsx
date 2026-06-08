'use client'

import { useMemo, useState } from 'react'

type Module = {
  id: string
  name: string
  desc: string
  /** Firmcraft monthly price for this module. */
  fc: number
  /** What it replaces, shown as the "before". */
  replaces: string
  /** Representative monthly cost of the tools it replaces. */
  current: number
  /** When true, the "current" figure is a soft estimate / mostly hidden cost. */
  softCurrent?: boolean
}

const MODULES: Module[] = [
  {
    id: 'reception',
    name: 'AI Receptionist',
    desc: 'Answers every call in your business voice, books the job, takes the message. Never sends a customer to voicemail.',
    fc: 199,
    replaces: 'Ruby · Smith.ai · AnswerConnect',
    current: 300,
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Dispatch',
    desc: 'Drag-and-drop the crew, auto-text confirmations and reminders, route the day. No more whiteboard.',
    fc: 149,
    replaces: 'Jobber · Housecall Pro · ServiceTitan',
    current: 300,
  },
  {
    id: 'invoicing',
    name: 'Invoicing & Payments',
    desc: 'Invoice from the truck, take a card on site, chase the unpaid balances automatically.',
    fc: 99,
    replaces: 'QuickBooks · FreshBooks',
    current: 55,
  },
  {
    id: 'portal',
    name: 'Customer Portal & Booking',
    desc: 'Customers book, reschedule, approve quotes, and pay from one branded link. No phone tag.',
    fc: 79,
    replaces: 'Calendly · manual booking',
    current: 40,
    softCurrent: true,
  },
  {
    id: 'ops',
    name: 'Operations Dashboard',
    desc: 'Every job, call, invoice, and crew in one screen. The view you have never actually had.',
    fc: 49,
    replaces: 'Spreadsheets · gut feel',
    current: 0,
    softCurrent: true,
  },
]

const money = (n: number) => `$${n.toLocaleString('en-US')}`

export function PricingCalculator() {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULES.map((m) => [m.id, true]))
  )

  const toggle = (id: string) =>
    setOn((prev) => ({ ...prev, [id]: !prev[id] }))

  const { fcTotal, currentTotal, anySoft, selectedCount } = useMemo(() => {
    let fcTotal = 0
    let currentTotal = 0
    let anySoft = false
    let selectedCount = 0
    for (const m of MODULES) {
      if (!on[m.id]) continue
      selectedCount += 1
      fcTotal += m.fc
      currentTotal += m.current
      if (m.softCurrent && m.current === 0) anySoft = true
    }
    return { fcTotal, currentTotal, anySoft, selectedCount }
  }, [on])

  const savings = Math.max(currentTotal - fcTotal, 0)
  const annual = savings * 12

  return (
    <div className="htx-calc">
      <div className="htx-calc-modules">
        {MODULES.map((m) => {
          const active = on[m.id]
          return (
            <button
              key={m.id}
              type="button"
              className={`htx-mod${active ? ' on' : ''}`}
              onClick={() => toggle(m.id)}
              aria-pressed={active}
            >
              <span className="htx-mod-check" aria-hidden>
                {active ? '✓' : ''}
              </span>
              <span className="htx-mod-body">
                <span className="htx-mod-top">
                  <span className="htx-mod-name">{m.name}</span>
                  <span className="htx-mod-price">
                    {money(m.fc)}
                    <span className="per">/mo</span>
                  </span>
                </span>
                <span className="htx-mod-desc">{m.desc}</span>
                <span className="htx-mod-replaces">
                  Replaces <b>{m.replaces}</b>
                  {m.current > 0 && (
                    <span className="htx-mod-was">
                      {' '}
                      · {m.softCurrent ? '~' : ''}
                      {money(m.current)}/mo today
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <aside className="htx-calc-summary">
        <div className="htx-sum-head">
          <span className="htx-sum-label">Your Firmcraft plan</span>
          <span className="htx-sum-count">{selectedCount} of {MODULES.length} modules</span>
        </div>

        <div className="htx-sum-total">
          <span className="htx-sum-total-num">{money(fcTotal)}</span>
          <span className="htx-sum-total-per">/month</span>
        </div>

        <div className="htx-sum-rows">
          <div className="htx-sum-row">
            <span>What you pay today{anySoft ? '*' : ''}</span>
            <span className="htx-strike">{money(currentTotal)}/mo</span>
          </div>
          <div className="htx-sum-row">
            <span>Firmcraft</span>
            <span>{money(fcTotal)}/mo</span>
          </div>
          <div className="htx-sum-row htx-sum-save">
            <span>You save</span>
            <span>{money(savings)}/mo</span>
          </div>
        </div>

        <div className="htx-sum-annual">
          <span className="htx-sum-annual-label">That&apos;s</span>
          <span className="htx-sum-annual-num">{money(annual)}</span>
          <span className="htx-sum-annual-label">back in your pocket every year.</span>
        </div>

        <a className="btn primary lg htx-sum-cta" href="/demo">
          Book a 15-minute demo <span className="arr">→</span>
        </a>

        {anySoft && (
          <p className="htx-sum-note">
            *Tools like the dashboard replace spreadsheets and lost time —
            real cost, hard to put a number on. Savings shown count only what
            you&apos;re writing a check for today.
          </p>
        )}
      </aside>
    </div>
  )
}
