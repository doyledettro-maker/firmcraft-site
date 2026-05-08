'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Scene data ──────────────────────────────────────────────────────────────
//
// Four scenes rotate in the hero. Each scene = a workspace + channel + a short
// chat with the firmcraft operator handling a real-feeling job. Content stays
// in this file (not props) because it's tightly coupled to the visual rhythm —
// avatar colors, status step counts, and bot-card row counts are all tuned to
// the height of the chat container.

type Step = { ic: string; k: string; text: string; pending?: boolean }
type BotCard = {
  iconLabel: string
  title: string
  subtitle?: string
  rows: { l: string; r: string }[]
}
type Message = {
  av: 'a1' | 'a2' | 'a3'
  avLabel: string
  name: string
  ts: string
  body: React.ReactNode
  steps?: Step[]
  card?: BotCard
}
type Scene = {
  workspace: string
  channels: string[]
  activeChannel: string
  channelMembers: string
  title: string
  messages: Message[]
}

const SCENES: Scene[] = [
  {
    workspace: 'Canopy Tree Co.',
    channels: ['general', 'field-ops', 'bookings', 'google-leads'],
    activeChannel: 'field-ops',
    channelMembers: '2 members · 1 operator',
    title: 'canopy-tree-co · #field-ops · Tuesday 10:42 AM',
    messages: [
      {
        av: 'a1', avLabel: 'DR', name: 'Danny (on-site)', ts: '10:42 AM',
        body: (
          <>
            <span className="men">@firmcraft</span> Mrs. Chen wants the oak removed
            and stump ground. Quoted $2,400 + $400 stump. She&apos;s good. Send the
            contract — she&apos;s standing here.
          </>
        ),
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '10:42 AM · operator',
        body: <>Drafting the contract for 14 Oak Ridge Ln now. Pulling the property photos you took Monday and your standard liability terms.</>,
        steps: [
          { ic: '✓', k: '[01]', text: 'Contract drafted — oak removal + stump grind, $2,800 total' },
          { ic: '✓', k: '[02]', text: 'Insurance + liability terms attached (your standard rider)' },
          { ic: '✓', k: '[03]', text: 'Sent via DocuSign to chen.linda@gmail.com' },
          { ic: '', k: '[04]', text: 'Awaiting client signature', pending: true },
        ],
        card: {
          iconLabel: 'PDF',
          title: 'Contract_Chen_OakRemoval.pdf',
          subtitle: '· sent · awaiting signature',
          rows: [
            { l: 'Service', r: 'Oak removal + stump grind' },
            { l: 'Total', r: '$2,800.00' },
            { l: 'Schedule window', r: 'Sat 5/10 — 7am–11am' },
            { l: 'Sent to', r: 'chen.linda@gmail.com' },
          ],
        },
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '10:46 AM · operator',
        body: <>✅ Signed by Linda Chen at 10:46 AM. Calendar invite sent to the crew for Saturday. I&apos;ll send her a &ldquo;see you Saturday&rdquo; text now and a reminder Friday evening.</>,
      },
    ],
  },
  {
    workspace: 'Bright Smile Dental',
    channels: ['general', 'front-desk', 'insurance', 'recall'],
    activeChannel: 'front-desk',
    channelMembers: '3 members · 1 operator',
    title: 'bright-smile-dental · #front-desk · Monday 9:18 AM',
    messages: [
      {
        av: 'a3', avLabel: 'MR', name: 'Maya (front desk)', ts: '9:18 AM',
        body: (
          <>
            <span className="men">@firmcraft</span> Patel claim — porcelain crown,
            tooth #14, did Friday. Delta Dental. Can you submit?
          </>
        ),
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '9:18 AM · operator',
        body: <>Pulling Mr. Patel&apos;s chart from Eaglesoft. Drafting the D2750 now.</>,
        steps: [
          { ic: '✓', k: '[01]', text: 'Pulled clinical notes + bitewings' },
          { ic: '✓', k: '[02]', text: 'Verified Delta Dental — 50% major, deductible met' },
          { ic: '✓', k: '[03]', text: 'Drafted ADA D2750 — porcelain crown, tooth 14' },
          { ic: '✓', k: '[04]', text: 'Submitted via Delta provider portal' },
          { ic: '', k: '[05]', text: 'Awaiting EOB', pending: true },
        ],
        card: {
          iconLabel: 'Rx',
          title: 'Claim_Patel_DD-882041.pdf',
          subtitle: '· submitted',
          rows: [
            { l: 'Patient', r: 'A. Patel' },
            { l: 'Procedure', r: 'D2750 · crown · tooth 14' },
            { l: 'Billed', r: '$1,420.00' },
            { l: 'Carrier', r: 'Delta Dental of NJ' },
          ],
        },
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '11:42 AM · operator',
        body: <>✅ Approved. Insurance pays $710, patient owes $284. Drafted the patient text with payment link — ready when you are.</>,
      },
    ],
  },
  {
    workspace: 'Northwind Payments',
    channels: ['general', 'marketing', 'pipeline', 'weekly'],
    activeChannel: 'marketing',
    channelMembers: '8 members · 1 operator',
    title: 'northwind-payments · #marketing · Wednesday 1:47 PM',
    messages: [
      {
        av: 'a3', avLabel: 'PR', name: 'Priya (Marketing)', ts: '1:47 PM',
        body: (
          <>
            <span className="men">@firmcraft</span> drowning. Need this week&apos;s
            restaurant-vertical email + LinkedIn post + a retargeting list of last
            week&apos;s signups. Thursday send.
          </>
        ),
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '1:47 PM · operator',
        body: <>On it. Pulling the Romeo&apos;s Pizza case study you closed Monday — strongest hook for the segment.</>,
        steps: [
          { ic: '✓', k: '[01]', text: 'Drafted email — "How Romeo\'s cut chargebacks 41%"' },
          { ic: '✓', k: '[02]', text: '3 LinkedIn variants in your voice' },
          { ic: '✓', k: '[03]', text: 'Pulled 412 signups from HubSpot' },
          { ic: '✓', k: '[04]', text: 'Built segment: restaurants, $2M+ GMV (147)' },
        ],
        card: {
          iconLabel: 'Dr',
          title: 'Drive › Marketing › Week 19',
          subtitle: '· 3 files',
          rows: [
            { l: 'Email_Restaurants_W19.draft', r: 'review' },
            { l: 'LinkedIn_3variants.md', r: 'review' },
            { l: 'HubSpot_segment_412.csv', r: 'ready' },
            { l: 'Send window', r: 'Thu 10:30 AM ET' },
          ],
        },
      },
      {
        av: 'a1', avLabel: 'PR', name: 'Priya', ts: '1:51 PM',
        body: <>You&apos;re saving my week. Approve all three. Ship Thursday.</>,
      },
    ],
  },
  {
    workspace: 'Dvorak ERP Advisory',
    channels: ['general', 'intake', 'projects', 'invoices'],
    activeChannel: 'intake',
    channelMembers: '1 member · 1 operator',
    title: 'dvorak-erp · #intake · Thursday 4:05 PM',
    messages: [
      {
        av: 'a1', avLabel: 'HD', name: 'Helena (you)', ts: '4:05 PM',
        body: (
          <>
            <span className="men">@firmcraft</span> new lead from the contact form —
            Ridgewood Mfg, 80 seats, NetSuite migration. Qualify them and book me
            Tuesday if they&apos;re real.
          </>
        ),
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '4:05 PM · operator',
        body: <>Looking up Ridgewood — cross-checking LinkedIn, their site, and your CRM for prior touches.</>,
        steps: [
          { ic: '✓', k: '[01]', text: 'Verified: Ridgewood Mfg · Cleveland · ~$48M rev · 82 staff' },
          { ic: '✓', k: '[02]', text: 'Currently on Sage 100 — confirmed via job posting' },
          { ic: '✓', k: '[03]', text: 'Scored STRONG — matches your last 3 closes' },
          { ic: '✓', k: '[04]', text: 'Sent qualification email + Calendly to Eric Larsen, COO' },
          { ic: '', k: '[05]', text: 'Awaiting Eric to book', pending: true },
        ],
        card: {
          iconLabel: 'PDF',
          title: 'Ridgewood_Manufacturing_brief.pdf',
          subtitle: '· saved to Drive',
          rows: [
            { l: 'Fit score', r: 'Strong (matches Acme, Northstar, BWX)' },
            { l: 'Likely engagement', r: '$140k–$180k · 14 wks' },
            { l: 'Decision-maker', r: 'Eric Larsen, COO' },
          ],
        },
      },
      {
        av: 'a2', avLabel: 'FC', name: 'firmcraft', ts: '4:38 PM · operator',
        body: <>✅ Eric booked Tue 5/13 11:00 AM. I&apos;ll prep your discovery questions + intro deck Tuesday morning.</>,
      },
    ],
  },
]

const TAB_LABELS = ['Trades', 'Healthcare', 'B2B', 'Solo']
const ROTATE_DURATION_MS = 8000

// ─── Component ────────────────────────────────────────────────────────────────

export function RotatingChatHero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0) // forces progress-bar reset
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-rotate every ROTATE_DURATION_MS unless paused
  useEffect(() => {
    if (paused) return
    intervalRef.current = setTimeout(() => {
      setActive((cur) => (cur + 1) % SCENES.length)
      setProgressKey((k) => k + 1)
    }, ROTATE_DURATION_MS)
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [active, paused])

  const handleTab = (i: number) => {
    setActive(i)
    setProgressKey((k) => k + 1)
  }

  const scene = SCENES[active]

  return (
    <div
      className="chat"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="chat-bar">
        <div className="dots"><i /><i /><i /></div>
        <span className="title">{scene.title}</span>
      </div>

      <div className="scene-tabs" role="tablist" aria-label="Industry scenarios">
        {TAB_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`scene-tab ${i === active ? 'active' : ''}`}
            onClick={() => handleTab(i)}
          >
            {label}
          </button>
        ))}
        <span
          key={progressKey}
          className="scene-rotator"
          aria-hidden="true"
          style={{
            width: paused ? '0%' : '100%',
            transition: paused
              ? 'none'
              : `width ${ROTATE_DURATION_MS}ms linear`,
          }}
        />
      </div>

      <div className="chat-body">
        <aside className="chat-side">
          <div className="ws"><span className="ws-mark" /> {scene.workspace}</div>
          <h6>Channels</h6>
          {scene.channels.map((ch) => (
            <div
              key={ch}
              className={`ch ${ch === scene.activeChannel ? 'active' : ''}`}
            >
              <span className="h">#</span> {ch}
            </div>
          ))}
          <h6>Operators</h6>
          <div className="ch bot">firmcraft</div>
        </aside>

        <div className="chat-main">
          <div className="chat-head">
            <div className="ch-title">
              <span className="h">#</span> {scene.activeChannel}
            </div>
            <div className="meta">{scene.channelMembers}</div>
          </div>
          <div className="chat-msgs">
            {scene.messages.map((m, i) => (
              <div key={i} className="msg">
                <div className={`av ${m.av}`}>{m.avLabel}</div>
                <div>
                  <div>
                    <span className="name">{m.name}</span>
                    <span className="ts">{m.ts}</span>
                  </div>
                  <div className="body">{m.body}</div>
                  {m.steps && (
                    <div className="bot-status">
                      {m.steps.map((s, si) => (
                        <div
                          key={si}
                          className={`step ${s.pending ? 'pending' : ''}`}
                        >
                          <span className="ic">{s.ic}</span>
                          <span className="k">{s.k}</span> {s.text}
                        </div>
                      ))}
                    </div>
                  )}
                  {m.card && (
                    <div className="bot-card">
                      <div className="head">
                        <span className="ic">{m.card.iconLabel}</span>
                        <b>{m.card.title}</b>{m.card.subtitle && ` ${m.card.subtitle}`}
                      </div>
                      <div className="body2">
                        {m.card.rows.map((r, ri) => (
                          <div key={ri} className="row">
                            <span className="l">{r.l}</span>
                            <span>{r.r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">Message #{scene.activeChannel}</div>
        </div>
      </div>
    </div>
  )
}
