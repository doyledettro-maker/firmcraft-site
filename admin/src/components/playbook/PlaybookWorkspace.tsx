'use client'

import { useState } from 'react'
import { Calculator, MessageSquareQuote, ShieldQuestion, Target, BadgeCheck, Mail, Phone, Quote, Ban } from 'lucide-react'
import { Card, CardBody } from '@/components/ui'
import { CopyButton } from './CopyButton'
import { PricingCalculator } from './PricingCalculator'
import {
  ONE_LINERS,
  ELEVATOR_PITCH,
  COLD_CALL_SCRIPT,
  EMAIL_TEMPLATES,
  OBJECTIONS,
  TARGET_TYPES,
  IDEAL_SIGNALS,
  AVOID_SIGNALS,
} from './data'

type TabId = 'calculator' | 'pitch' | 'objections' | 'market'

const TABS: { id: TabId; label: string; icon: typeof Calculator }[] = [
  { id: 'calculator', label: 'Pricing calculator', icon: Calculator },
  { id: 'pitch', label: 'Scripts & email', icon: MessageSquareQuote },
  { id: 'objections', label: 'Objections', icon: ShieldQuestion },
  { id: 'market', label: 'Target market', icon: Target },
]

export function PlaybookWorkspace() {
  const [tab, setTab] = useState<TabId>('calculator')

  return (
    <div>
      {/* Tab nav */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1 rounded-full border border-line bg-paper-2/60 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 h-9 text-[13.5px] font-medium transition-colors ${
                active ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink hover:bg-paper-2'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'calculator' && <CalculatorTab />}
      {tab === 'pitch' && <PitchTab />}
      {tab === 'objections' && <ObjectionsTab />}
      {tab === 'market' && <MarketTab />}
    </div>
  )
}

/* ---------- Calculator ---------- */

function CalculatorTab() {
  return (
    <Card>
      <CardBody className="px-6 py-6">
        <SectionLabel
          eyebrow="Build the quote live"
          title="Pricing calculator"
          desc="Ask what they’re using, then toggle the modules that replace it. The total, what they pay now, and their savings update as you go. Start from the full stack and remove what doesn’t fit."
        />
        <PricingCalculator />
      </CardBody>
    </Card>
  )
}

/* ---------- Pitch ---------- */

function PitchTab() {
  return (
    <div className="space-y-6">
      {/* One-liners */}
      <Card>
        <CardBody className="px-6 py-6">
          <SectionLabel eyebrow="First 10 seconds" title="One-liners" desc="Pick by context — subject line, opener, or the top of a call." />
          <div className="grid md:grid-cols-2 gap-3">
            {ONE_LINERS.map((o) => (
              <div key={o.angle} className="rounded-xl border border-line-2 bg-paper px-4 py-3.5 flex items-start gap-3">
                <Quote className="w-4 h-4 text-accent-2 mt-1 flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted mb-1">{o.angle}</div>
                  <p className="text-[14px] text-ink leading-snug">{o.line}</p>
                </div>
                <CopyButton text={o.line} label="" className="flex-none" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Elevator pitch */}
      <ScriptCard
        icon={MessageSquareQuote}
        eyebrow="30 seconds"
        title="Elevator pitch"
        body={ELEVATOR_PITCH}
      />

      {/* Email templates */}
      <Card>
        <CardBody className="px-6 py-6">
          <SectionLabel eyebrow="Cold outbound" title="Email templates" desc="Personalize the first line before you send. Copy grabs subject + body." />
          <div className="space-y-4">
            {EMAIL_TEMPLATES.map((t) => (
              <div key={t.id} className="rounded-xl border border-line-2 bg-paper overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-paper-2/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-accent-3 flex-none" />
                    <span className="text-[13.5px] font-medium text-ink truncate">{t.name}</span>
                  </div>
                  <CopyButton text={`Subject: ${t.subject}\n\n${t.body}`} label="Copy email" className="flex-none" />
                </div>
                <div className="px-4 py-3.5">
                  <div className="text-[12px] text-muted mb-2">
                    <span className="font-mono-warm uppercase tracking-[0.12em] text-[10.5px]">Subject</span>{' '}
                    <span className="text-ink-2">{t.subject}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[13.5px] text-ink-2 leading-relaxed m-0">{t.body}</pre>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Cold call script */}
      <ScriptCard icon={Phone} eyebrow="On the phone" title="Cold call script" body={COLD_CALL_SCRIPT} mono />
    </div>
  )
}

function ScriptCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  mono,
}: {
  icon: typeof Phone
  eyebrow: string
  title: string
  body: string
  mono?: boolean
}) {
  return (
    <Card>
      <CardBody className="px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 text-accent-3">
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h3 className="font-serif-warm text-[22px] leading-tight tracking-[-0.01em]">{title}</h3>
            </div>
          </div>
          <CopyButton text={body} className="flex-none" />
        </div>
        <pre
          className={`whitespace-pre-wrap text-[13.5px] text-ink-2 leading-relaxed m-0 rounded-xl border border-line-2 bg-paper px-4 py-4 ${
            mono ? 'font-mono-warm text-[12.5px]' : 'font-sans'
          }`}
        >
          {body}
        </pre>
      </CardBody>
    </Card>
  )
}

/* ---------- Objections ---------- */

function ObjectionsTab() {
  return (
    <Card>
      <CardBody className="px-6 py-6">
        <SectionLabel
          eyebrow="They’ll push back — that’s normal"
          title="Handling objections"
          desc="The contractor’s line on the left, your response on the right. Never argue. One “no” is a no."
        />
        <div className="grid md:grid-cols-2 gap-3">
          {OBJECTIONS.map((o) => (
            <div key={o.q} className="rounded-xl border border-line-2 bg-paper p-4">
              <div className="flex items-start gap-2 mb-2.5">
                <span className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-accent-2 mt-0.5">They say</span>
              </div>
              <p className="text-[14.5px] text-ink font-medium leading-snug mb-3">“{o.q}”</p>
              <div className="pt-3 border-t border-line">
                <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-accent-3 mb-1.5">You say</div>
                <p className="text-[13.5px] text-ink-2 leading-relaxed">{o.a}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/* ---------- Market ---------- */

function MarketTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="px-6 py-6">
          <SectionLabel
            eyebrow="Houston only · 1–10 people"
            title="Who we’re targeting"
            desc="Houston-area trade contractors. No dental, no retail, no other verticals. In priority order:"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {TARGET_TYPES.map((t, i) => (
              <div key={t.type} className="rounded-xl border border-line-2 bg-paper px-4 py-3.5 flex items-start gap-3">
                <span className="flex-none grid place-items-center w-7 h-7 rounded-full bg-accent/10 border border-accent/25 text-accent-3 font-mono-warm text-[12px]">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[14px] font-medium text-ink">{t.type}</div>
                  <p className="text-[12.5px] text-ink-2 mt-0.5 leading-snug">{t.note}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardBody className="px-6 py-6">
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck className="w-5 h-5 text-status-up" />
              <h3 className="font-serif-warm text-[20px] tracking-[-0.01em]">Ideal prospect signals</h3>
            </div>
            <ul className="space-y-2.5">
              {IDEAL_SIGNALS.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-[13.5px] text-ink-2 leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-up flex-none" />
                  {s}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="px-6 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-status-down" />
              <h3 className="font-serif-warm text-[20px] tracking-[-0.01em]">Who NOT to target</h3>
            </div>
            <ul className="space-y-2.5">
              {AVOID_SIGNALS.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-[13.5px] text-ink-2 leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-down flex-none" />
                  {s}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Shared ---------- */

function SectionLabel({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="font-serif-warm text-[26px] md:text-[30px] leading-tight tracking-[-0.02em] mt-1.5">{title}</h2>
      {desc ? <p className="text-ink-2 text-[14px] leading-relaxed mt-2 max-w-[680px]">{desc}</p> : null}
    </div>
  )
}
