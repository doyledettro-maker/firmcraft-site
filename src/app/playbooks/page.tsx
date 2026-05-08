'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

type Cat = 'trades' | 'health' | 'solo' | 'prof' | 'b2b' | 'any'
type Trigger = 'mention' | 'cron' | 'event'

type Playbook = {
  id: string
  cat: Cat
  catLabel: string
  title: React.ReactNode
  body: string
  touches: string[]
  trigger: Trigger
  triggerLabel: string
  search: string
}

const PLAYBOOKS: Playbook[] = [
  // TRADES
  {
    id: '#001', cat: 'trades', catLabel: 'Trades',
    title: <>On-site contract <em>→ DocuSign</em></>,
    body: 'Customer says yes in the driveway. Operator drafts contract from your standard rider, sends via DocuSign, and chases the signature before you pull off the property.',
    touches: ['DocuSign', 'Drive', 'SMS'], trigger: 'mention', triggerLabel: '@mention',
    search: 'contract docusign on-site signature trades',
  },
  {
    id: '#002', cat: 'trades', catLabel: 'Trades',
    title: <>Certificate of Insurance <em>on demand</em></>,
    body: 'Property manager wants a COI before crew arrives. Operator pulls from carrier portal, fills the additional-insured details, sends the PDF — minutes, not days.',
    touches: ['Carrier portal', 'Email', 'Drive'], trigger: 'mention', triggerLabel: '@mention',
    search: 'coi insurance certificate carrier portal',
  },
  {
    id: '#003', cat: 'trades', catLabel: 'Trades',
    title: <>Google reviews <em>flywheel</em></>,
    body: 'Job complete → text customer the review link. Got 5★? Ask for a photo, attach to the listing. Got 4★? Ask what to fix. Aggregated weekly recap to the owner.',
    touches: ['Google Business', 'SMS', 'Sheets'], trigger: 'event', triggerLabel: 'job complete',
    search: 'google reviews flywheel reputation seo',
  },
  {
    id: '#004', cat: 'trades', catLabel: 'Trades',
    title: <>Crew dispatch <em>from intake</em></>,
    body: 'New booking lands in your scheduling tool. Operator assigns the right crew based on job type + load, texts the client an arrival window, sends a reminder the night before.',
    touches: ['Jobber / ServiceTitan', 'SMS', 'Calendar'], trigger: 'event', triggerLabel: 'booking created',
    search: 'dispatch crew booking arrival window',
  },
  {
    id: '#005', cat: 'trades', catLabel: 'Trades',
    title: <>Unsigned-quote <em>follow-up</em></>,
    body: 'Quote sent and not signed in 24h, 72h, or 7 days? Operator sends a calibrated nudge in your voice. Auto-pauses the moment the signature lands.',
    touches: ['DocuSign', 'Email', 'CRM'], trigger: 'cron', triggerLabel: 'scheduled',
    search: 'quote follow-up unsigned estimate chase',
  },
  {
    id: '#006', cat: 'trades', catLabel: 'Trades',
    title: <>Permit watcher</>,
    body: 'Pulls active-permit status from county/city portals every Monday morning. Flags any approaching expiration, opens a renewal task with the right documents pre-attached.',
    touches: ['Municipal portals', 'Drive', 'Tasks'], trigger: 'cron', triggerLabel: 'Mon 7:00 AM',
    search: 'permit tracker city portal expiration',
  },
  {
    id: '#007', cat: 'trades', catLabel: 'Trades',
    title: <>Equipment maintenance <em>watcher</em></>,
    body: "Reads the daily truck-inspection log, flags overdue services, books the shop visit, blocks the truck on the schedule so you don't dispatch it by accident.",
    touches: ['Forms', 'Calendar', 'Sheets'], trigger: 'cron', triggerLabel: 'daily',
    search: 'maintenance equipment truck inspection log',
  },
  {
    id: '#008', cat: 'trades', catLabel: 'Trades',
    title: <>Invoice → payment <em>chase</em></>,
    body: 'Invoice sent on completion, follow-ups at 14 / 30 / 60 days, escalation to the partner past 60. Marks paid the moment QuickBooks sees the deposit.',
    touches: ['QuickBooks', 'Stripe', 'Email'], trigger: 'cron', triggerLabel: 'scheduled',
    search: 'invoice payment chase ar receivables collections',
  },
  // HEALTHCARE
  {
    id: '#009', cat: 'health', catLabel: 'Healthcare',
    title: <>Insurance claim <em>submission</em></>,
    body: 'Pulls clinical notes, X-rays, and procedure codes from the practice management system, drafts the ADA / CMS-1500 form, submits to the carrier portal, tracks the EOB.',
    touches: ['Eaglesoft / Open Dental', 'Carrier portals', 'Drive'], trigger: 'mention', triggerLabel: '@mention',
    search: 'dental insurance claim ada delta cigna submit',
  },
  {
    id: '#010', cat: 'health', catLabel: 'Healthcare',
    title: <>Denial / underpayment <em>appeals</em></>,
    body: 'EOB shows denied or underpaid? Operator drafts the appeal letter with chart documentation, narrative, and supporting CDT codes — partner reviews and signs.',
    touches: ['Practice mgmt', 'Carrier portals', 'Drive'], trigger: 'event', triggerLabel: 'EOB received',
    search: 'claim denial appeal eob underpayment',
  },
  {
    id: '#011', cat: 'health', catLabel: 'Healthcare',
    title: <>Patient recall <em>reactivation</em></>,
    body: 'Pulls every patient overdue for a cleaning. Drafts personalized texts referencing their last visit and last hygienist. Loads into the queue for front-desk approval.',
    touches: ['Practice mgmt', 'SMS'], trigger: 'cron', triggerLabel: 'weekly',
    search: 'recall reactivation patient overdue cleaning',
  },
  {
    id: '#012', cat: 'health', catLabel: 'Healthcare',
    title: <>Treatment-plan <em>follow-up</em></>,
    body: "Patient was presented work and didn't book. Three-touch sequence over 30 days — financing options, schedule offer, \"still thinking?\" check-in.",
    touches: ['Practice mgmt', 'SMS', 'Email'], trigger: 'cron', triggerLabel: 'scheduled',
    search: 'treatment plan follow-up unscheduled work',
  },
  {
    id: '#013', cat: 'health', catLabel: 'Healthcare',
    title: <>Pre-authorization <em>requests</em></>,
    body: 'For implants, crowns, ortho, and major surgical procedures: assembles the clinical packet, submits the pre-auth, tracks status, surfaces the result before the appointment.',
    touches: ['Practice mgmt', 'Carrier portals', 'Drive'], trigger: 'event', triggerLabel: 'procedure planned',
    search: 'pre-authorization major procedure carrier',
  },
  {
    id: '#014', cat: 'health', catLabel: 'Healthcare',
    title: <>New-patient <em>intake</em></>,
    body: 'Texts the new patient HIPAA-compliant intake forms, populates the chart on submit, flags incomplete fields the day before the appointment.',
    touches: ['Forms', 'Practice mgmt', 'SMS'], trigger: 'event', triggerLabel: 'appt booked',
    search: 'intake new patient forms hipaa',
  },
  {
    id: '#015', cat: 'health', catLabel: 'Healthcare',
    title: <>End-of-day <em>reconciliation</em></>,
    body: "Matches collections to scheduled procedures, flags any patient that left without a payment plan, drafts the doctor's nightly summary.",
    touches: ['Practice mgmt', 'Stripe', 'Sheets'], trigger: 'cron', triggerLabel: 'daily 6 PM',
    search: 'end of day reconciliation collections deposit',
  },
  {
    id: '#016', cat: 'health', catLabel: 'Healthcare',
    title: <>Birthday + recall <em>campaign</em></>,
    body: 'Once a month, drafts personalized birthday messages bundled with a recall offer for every patient with a birthday in the next 30 days. Front desk approves the batch.',
    touches: ['Practice mgmt', 'SMS', 'Email'], trigger: 'cron', triggerLabel: 'monthly',
    search: 'birthday recall campaign monthly',
  },
  // SOLO
  {
    id: '#017', cat: 'solo', catLabel: 'Solo',
    title: <>Inbound lead <em>qualifier</em></>,
    body: 'New form submission → operator researches LinkedIn + the company site, scores fit against your last closes, books the call if strong, sends a polite "not a fit" if not.',
    touches: ['Forms', 'Calendly', 'Email'], trigger: 'event', triggerLabel: 'form submitted',
    search: 'lead qualification inbound research score',
  },
  {
    id: '#018', cat: 'solo', catLabel: 'Solo',
    title: <>Calendar <em>defender</em></>,
    body: 'Guards your deep-work blocks. Politely declines or reroutes meeting requests that would land on protected time, offers your real availability instead.',
    touches: ['Calendar', 'Calendly', 'Email'], trigger: 'event', triggerLabel: 'meeting requested',
    search: 'calendar protect deep work block',
  },
  {
    id: '#019', cat: 'solo', catLabel: 'Solo',
    title: <>Invoice → <em>cash</em></>,
    body: 'Project closed? Operator generates the invoice from the SOW, sends it, follows up on schedule, marks paid in QBO when the deposit lands. You stay billable.',
    touches: ['QuickBooks', 'Stripe', 'Email'], trigger: 'event', triggerLabel: 'project closed',
    search: 'invoice cash close consultant generate',
  },
  {
    id: '#020', cat: 'solo', catLabel: 'Solo',
    title: <>Quarterly client <em>review packs</em></>,
    body: 'Once a quarter, pulls project status across every active client and drafts a one-page review packet — wins, blockers, next-quarter priorities — ready for your review.',
    touches: ['Notion / Linear', 'Drive', 'Email'], trigger: 'cron', triggerLabel: 'quarterly',
    search: 'quarterly client review packets',
  },
  {
    id: '#021', cat: 'solo', catLabel: 'Solo',
    title: <>New-engagement <em>kickoff</em></>,
    body: 'Proposal accepted? Operator spins up the project folder, kickoff doc, calendar holds, kickoff email — every artifact your last engagement had, day one.',
    touches: ['Drive', 'Calendar', 'Email'], trigger: 'event', triggerLabel: 'proposal accepted',
    search: 'new business kickoff project folder',
  },
  {
    id: '#022', cat: 'solo', catLabel: 'Solo',
    title: <>Friday <em>recap</em></>,
    body: "Every Friday at 4: wins this week, what's open, what's next week's three priorities. Lands in your inbox so the weekend starts clean.",
    touches: ['Calendar', 'Tasks', 'Email'], trigger: 'cron', triggerLabel: 'Fri 4 PM',
    search: 'end of week recap friday summary priorities',
  },
  // PROFESSIONAL FIRMS
  {
    id: '#023', cat: 'prof', catLabel: 'Pro firms',
    title: <>Tax extension <em>batch</em></>,
    body: 'For every client with an extension due, drafts the 4868, ties out estimated liability against last year, routes for partner review in one consolidated thread.',
    touches: ['QuickBooks', 'Drive', 'Tax software'], trigger: 'cron', triggerLabel: 'seasonal',
    search: 'tax extension 4868 cpa batch',
  },
  {
    id: '#024', cat: 'prof', catLabel: 'Pro firms',
    title: <>1099 <em>prep season</em></>,
    body: 'January batch: pulls vendor data from QBO, drafts the 1099-NECs, chases missing W-9s, queues the batch send to vendors and IRS.',
    touches: ['QuickBooks', 'Drive', 'Email'], trigger: 'cron', triggerLabel: 'January',
    search: '1099 vendor prep nec batch',
  },
  {
    id: '#025', cat: 'prof', catLabel: 'Pro firms',
    title: <>Client doc <em>chase</em></>,
    body: 'Sequenced doc requests with auto-reconciliation — when the client uploads, operator names, files, and OCRs the document, then strikes it from the missing list.',
    touches: ['SmartVault / Drive', 'Email', 'Tasks'], trigger: 'cron', triggerLabel: 'scheduled',
    search: 'document request reconcile chase client',
  },
  {
    id: '#026', cat: 'prof', catLabel: 'Pro firms',
    title: <>Conflict check <em>on intake</em></>,
    body: 'New legal matter? Operator runs the conflict search across all parties, attaches the result to the engagement letter, flags any hit for partner review before the EL goes out.',
    touches: ['Practice mgmt', 'Drive', 'Email'], trigger: 'event', triggerLabel: 'matter created',
    search: 'conflict check legal new matter',
  },
  {
    id: '#027', cat: 'prof', catLabel: 'Pro firms',
    title: <>Engagement letter <em>generation</em></>,
    body: "Intake form submitted → tailored engagement letter drafted from your standard template + scope of work → DocuSign → matter opened the moment it's signed.",
    touches: ['DocuSign', 'Practice mgmt', 'Drive'], trigger: 'event', triggerLabel: 'intake submitted',
    search: 'engagement letter docusign matter open',
  },
  {
    id: '#028', cat: 'prof', catLabel: 'Pro firms',
    title: <>Monthly close <em>package</em></>,
    body: 'For each bookkeeping client: pulls QBO, reconciles the bank feeds, builds the partner review package, flags the three things that need a human eye.',
    touches: ['QuickBooks', 'Drive', 'Sheets'], trigger: 'cron', triggerLabel: 'monthly',
    search: 'monthly close package qbo review',
  },
  {
    id: '#029', cat: 'prof', catLabel: 'Pro firms',
    title: <>Court filing <em>prep brief</em></>,
    body: 'Seven days before each filing or hearing on the case calendar, operator assembles the materials, drafts a one-page prep brief, and books the partner-associate prep block.',
    touches: ['Practice mgmt', 'Calendar', 'Drive'], trigger: 'cron', triggerLabel: '7 days out',
    search: 'court filing case calendar prep',
  },
  {
    id: '#030', cat: 'prof', catLabel: 'Pro firms',
    title: <>Quarterly advisory <em>review</em></>,
    body: "For each advisory client, drafts the quarterly review pack — performance, IPS check, RMD reminders, suitability notes — ready for the partner's call prep.",
    touches: ['Custodian / Orion', 'Drive', 'Email'], trigger: 'cron', triggerLabel: 'quarterly',
    search: 'advisory quarterly review ips rmd',
  },
  // B2B
  {
    id: '#031', cat: 'b2b', catLabel: 'B2B',
    title: <>Weekly content <em>engine</em></>,
    body: "Pulls last week's wins / case studies / product launches and drafts the weekly email + 3 LinkedIn variants in your house voice. Marketer reviews and ships.",
    touches: ['HubSpot', 'LinkedIn', 'Drive'], trigger: 'cron', triggerLabel: 'Mon 9 AM',
    search: 'marketing email linkedin content engine weekly',
  },
  {
    id: '#032', cat: 'b2b', catLabel: 'B2B',
    title: <>Demo-request <em>qualifier</em></>,
    body: 'New demo request → enriches with LinkedIn + their site + your CRM history, scores the lead, routes to the right AE with a pre-call brief in hand.',
    touches: ['HubSpot', 'Calendly', 'Slack'], trigger: 'event', triggerLabel: 'demo requested',
    search: 'demo request qualification ae brief',
  },
  {
    id: '#033', cat: 'b2b', catLabel: 'B2B',
    title: <>Customer <em>onboarding</em></>,
    body: 'New logo signed → kicks off the 14-day onboarding playbook, schedules the kickoff, sends the welcome series, hands off to CS on day 15 with a status memo.',
    touches: ['CRM', 'Email', 'Calendar'], trigger: 'event', triggerLabel: 'deal closed-won',
    search: 'onboarding new customer 14 day signed',
  },
  {
    id: '#034', cat: 'b2b', catLabel: 'B2B',
    title: <>Failed-payment <em>recovery</em></>,
    body: "Stripe webhook fires on failure. Operator sends a personalized retry email referencing the customer's plan, retries the card, escalates to CS on day three.",
    touches: ['Stripe', 'Email', 'CRM'], trigger: 'event', triggerLabel: 'payment failed',
    search: 'dunning failed payment stripe recovery',
  },
  {
    id: '#035', cat: 'b2b', catLabel: 'B2B',
    title: <>QBR <em>deck builder</em></>,
    body: 'For each top-tier customer, pulls product usage, support history, and revenue data; assembles the QBR deck; flags the two risks for the AM to address on the call.',
    touches: ['Product analytics', 'CRM', 'Slides'], trigger: 'cron', triggerLabel: 'quarterly',
    search: 'qbr quarterly business review usage data deck',
  },
  {
    id: '#036', cat: 'b2b', catLabel: 'B2B',
    title: <>Pipeline <em>hygiene</em></>,
    body: "Every Friday: flags every deal that's been stuck in stage for more than 14 days, drafts a re-engagement message in the AE's voice, queues for review.",
    touches: ['CRM', 'Email', 'Slack'], trigger: 'cron', triggerLabel: 'Fri 2 PM',
    search: 'pipeline hygiene stale deals re-engage',
  },
  {
    id: '#037', cat: 'b2b', catLabel: 'B2B',
    title: <>Renewal <em>automation</em></>,
    body: '90 / 60 / 30 days before each renewal: usage check-in, uplift proposal, signature request. Auto-pauses if the customer has an open support escalation.',
    touches: ['CRM', 'DocuSign', 'Email'], trigger: 'cron', triggerLabel: 'scheduled',
    search: 'renewal automation 90 60 30 uplift',
  },
  {
    id: '#038', cat: 'b2b', catLabel: 'B2B',
    title: <>Win / loss <em>synthesis</em></>,
    body: 'Records the win-loss call, transcribes, extracts the three deltas vs. the last ten outcomes, posts the takeaways into the sales channel for the team to learn from.',
    touches: ['Zoom', 'Drive', 'Slack'], trigger: 'event', triggerLabel: 'call recorded',
    search: 'win loss interview transcript synthesis knowledge',
  },
  // ANY
  {
    id: '#039', cat: 'any', catLabel: 'Cross-industry',
    title: <>Inbox <em>triage</em></>,
    body: 'Sorts the morning inbox into "needs you," "I drafted a reply," and "handled." You start the day with the actual five emails that mattered, not eighty.',
    touches: ['Gmail / Outlook', 'Drafts'], trigger: 'cron', triggerLabel: 'daily 7 AM',
    search: 'inbox triage email priority',
  },
  {
    id: '#040', cat: 'any', catLabel: 'Cross-industry',
    title: <>Vendor renewal <em>watcher</em></>,
    body: 'Tracks every SaaS subscription you pay for. Surfaces upcoming auto-renewals 30 days out with usage data, so you cancel what nobody opens before it bills.',
    touches: ['QuickBooks', 'Stripe', 'Email'], trigger: 'cron', triggerLabel: 'monthly',
    search: 'vendor saas renewal subscription tracker',
  },
]

const CHIP_DEFS: { key: 'all' | Cat; label: React.ReactNode; mk?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trades', label: 'Trades & field', mk: 'var(--tr)' },
  { key: 'health', label: 'Healthcare', mk: 'var(--hc)' },
  { key: 'solo', label: 'Solo & owner-op', mk: 'var(--so)' },
  { key: 'prof', label: 'Professional firms', mk: 'var(--pf)' },
  { key: 'b2b', label: 'B2B services', mk: 'var(--b2)' },
  { key: 'any', label: 'Cross-industry', mk: 'var(--xa)' },
]

const CAT_VAR: Record<Cat, string> = {
  trades: 'var(--tr)',
  health: 'var(--hc)',
  solo: 'var(--so)',
  prof: 'var(--pf)',
  b2b: 'var(--b2)',
  any: 'var(--xa)',
}

const TRIGGER_COLOR: Record<Trigger, string> = {
  mention: 'var(--accent)',
  cron: 'var(--accent-2)',
  event: 'var(--accent-3)',
}

function PlaybookCard({ pb }: { pb: Playbook }) {
  const dotColor = CAT_VAR[pb.cat]
  const trigColor = TRIGGER_COLOR[pb.trigger]
  return (
    <article className="card-lift bg-white border border-[var(--line)] rounded-2xl p-[22px] flex flex-col gap-[14px] relative">
      <div className="flex justify-between items-center font-mono-warm text-[10.5px] tracking-[0.12em] uppercase text-muted">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full bg-paper text-ink-2 border border-[var(--line)]">
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: dotColor }}
          />
          {pb.catLabel}
        </span>
        <span>{pb.id}</span>
      </div>
      <h3 className="font-serif-warm font-medium text-[21px] tracking-[-0.01em] leading-[1.2] m-0 text-balance serif-h">
        {pb.title}
      </h3>
      <p className="m-0 text-[14px] leading-[1.5] text-ink-2">{pb.body}</p>
      <div className="flex items-center gap-2 font-mono-warm text-[11px] text-muted uppercase tracking-[0.08em] pt-2.5 border-t border-dashed border-[var(--line)] flex-wrap">
        <span className="text-muted min-w-[54px]">Touches</span>
        <div className="flex gap-[5px] flex-wrap">
          {pb.touches.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 py-[3px] rounded-md bg-paper font-mono-warm text-[10.5px] text-ink border border-[var(--line)] normal-case tracking-normal"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 font-mono-warm text-[11px] uppercase tracking-[0.08em] pt-2.5 border-t border-dashed border-[var(--line)] flex-wrap">
        <span className="text-muted min-w-[54px]">Trigger</span>
        <span
          className="inline-flex items-center gap-1.5 font-mono-warm text-[10.5px] uppercase tracking-[0.1em]"
          style={{ color: trigColor }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: trigColor }}
          />
          {pb.triggerLabel}
        </span>
      </div>
    </article>
  )
}

const COUNTS: Record<'all' | Cat, number> = {
  all: PLAYBOOKS.length,
  trades: PLAYBOOKS.filter((p) => p.cat === 'trades').length,
  health: PLAYBOOKS.filter((p) => p.cat === 'health').length,
  solo: PLAYBOOKS.filter((p) => p.cat === 'solo').length,
  prof: PLAYBOOKS.filter((p) => p.cat === 'prof').length,
  b2b: PLAYBOOKS.filter((p) => p.cat === 'b2b').length,
  any: PLAYBOOKS.filter((p) => p.cat === 'any').length,
}

export default function PlaybooksPage() {
  const [active, setActive] = useState<'all' | Cat>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLAYBOOKS.filter((p) => {
      if (active !== 'all' && p.cat !== active) return false
      if (!q) return true
      const hay = (p.search + ' ' + p.body + ' ' + p.touches.join(' ') + ' ' + p.triggerLabel + ' ' + p.catLabel).toLowerCase()
      return hay.includes(q)
    })
  }, [active, query])

  return (
    <>
      <SiteHeader current="playbooks" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-8">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[180px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#F4D9B7,transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[180px] w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle,#DEEAD2,transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-end">
            <div>
              <div className="font-mono-warm text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
                <Link href="/" className="text-accent hover:underline underline-offset-[3px]">
                  ← Back to home
                </Link>{' '}
                &nbsp;·&nbsp; The Playbooks Library
              </div>
              <div className="eyebrow">Vol. 01 · Spring 2026</div>
              <h1 className="font-serif-warm font-medium text-[clamp(46px,5.6vw,80px)] leading-[1.02] tracking-[-0.024em] mt-4 mb-4 text-balance serif-h">
                The first <em>40 playbooks.</em>
                <br />
                Pick yours.
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[540px] mb-6">
                A playbook is a named, versioned piece of work the operator can run on its own —
                triggered by a mention, a schedule, or an event in your tools. Browse the full
                library by industry. Don&apos;t see yours? We build a custom one in week one.
              </p>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-5 border-t border-[var(--line)] pt-6">
                <div>
                  <div className="font-mono-warm text-[11px] tracking-[0.14em] text-muted uppercase">
                    Live playbooks
                  </div>
                  <div className="font-serif-warm text-[42px] font-medium tracking-[-0.02em] leading-none mt-1.5 serif-h">
                    <em>40</em>
                  </div>
                  <div className="text-[13px] text-ink-2 mt-1.5 leading-[1.4]">
                    Across five customer types — and growing every week.
                  </div>
                </div>
                <div>
                  <div className="font-mono-warm text-[11px] tracking-[0.14em] text-muted uppercase">
                    Custom builds
                  </div>
                  <div className="font-serif-warm text-[42px] font-medium tracking-[-0.02em] leading-none mt-1.5 serif-h">
                    Wk <em>1</em>
                  </div>
                  <div className="text-[13px] text-ink-2 mt-1.5 leading-[1.4]">
                    If your workflow isn&apos;t here, we ship it during onboarding.
                  </div>
                </div>
                <div>
                  <div className="font-mono-warm text-[11px] tracking-[0.14em] text-muted uppercase">
                    Improves with use
                  </div>
                  <div className="font-serif-warm text-[42px] font-medium tracking-[-0.02em] leading-none mt-1.5 serif-h">
                    <em>∞</em>
                  </div>
                  <div className="text-[13px] text-ink-2 mt-1.5 leading-[1.4]">
                    Each playbook gets sharper every time the operator runs it.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div
        className="sticky top-16 z-40 border-y border-[var(--line)] py-3.5 mt-12"
        style={{
          background: 'rgba(251,244,234,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-8 flex items-center gap-3.5 flex-wrap justify-between">
          <div className="flex gap-2 flex-wrap">
            {CHIP_DEFS.map((chip) => {
              const isActive = active === chip.key
              const ct = COUNTS[chip.key]
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActive(chip.key)}
                  className={[
                    'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] transition-colors border',
                    isActive
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-white text-ink-2 border-[var(--line)] hover:border-[var(--ink-2)] hover:text-ink',
                  ].join(' ')}
                >
                  {chip.mk && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: chip.mk }}
                    />
                  )}
                  {chip.label}
                  <span
                    className={[
                      'font-mono-warm text-[10.5px] px-1.5 py-px rounded-full',
                      isActive ? 'bg-white/15 text-[#D5C5B0]' : 'bg-paper text-muted',
                    ].join(' ')}
                  >
                    {ct}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative">
            <span
              aria-hidden
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm"
            >
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search 40 playbooks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-sans text-[13.5px] py-2.5 pl-9 pr-3.5 rounded-full border border-[var(--line)] bg-white text-ink w-[260px] outline-none transition-all focus:border-ink focus:w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* LIBRARY */}
      <section className="pt-9 pb-14">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-baseline mb-4 font-mono-warm text-[11.5px] tracking-[0.1em] text-muted uppercase">
            <span>
              Showing <b className="text-ink font-medium">{visible.length}</b> of{' '}
              <b className="text-ink font-medium">{PLAYBOOKS.length}</b> playbooks
            </span>
            <span>Sorted by industry</span>
          </div>
          {visible.length === 0 ? (
            <div className="text-center py-16 text-muted font-serif-warm italic text-[22px]">
              No playbooks match. Try a broader filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {visible.map((pb) => (
                <PlaybookCard key={pb.id} pb={pb} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-[88px] border-t border-[var(--line)]"
        style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="eyebrow">Don&apos;t see yours?</div>
              <h2 className="font-serif-warm font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance serif-h">
                We build a <em>custom playbook</em> in week one.
              </h2>
              <p className="text-[18px] text-ink-2 leading-[1.55] mb-6 max-w-[520px]">
                About a third of our customers&apos; best playbooks aren&apos;t in this library —
                they&apos;re bespoke to one firm, one workflow, one weird tool nobody else uses.
                The intake call scopes one. By Friday it&apos;s running.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="btn btn-primary btn-lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
                >
                  Book a 20-min call →
                </a>
                <Link className="btn btn-ghost btn-lg" href="/#pricing">
                  See plans
                </Link>
              </div>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-[18px] p-6">
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>
                How a custom playbook ships
              </div>
              <h4 className="font-serif-warm font-medium italic text-[21px] m-0 mt-1.5 mb-1.5 tracking-[-0.005em]">
                Intake → live, in five days.
              </h4>
              <p className="text-[14.5px] m-0 mb-3.5 text-ink-2">
                The same five-day arc that gets a stock playbook live, built around your specific
                work.
              </p>
              <ul className="list-none p-0 m-0 flex flex-col gap-2 text-[13.5px] text-ink">
                {[
                  ['Mon', '30-min intake call. We scope one workflow.'],
                  ['Tue', 'Connectors live across your tools.'],
                  ['Wed', 'Playbook drafted, you review the test runs.'],
                  ['Thu', 'Production runs in shadow mode.'],
                  ['Fri', 'Live. The operator handles it from here.'],
                ].map(([d, t]) => (
                  <li key={d} className="flex gap-2.5 items-start">
                    <span
                      className="w-[13px] h-[13px] rounded-full flex-none mt-1"
                      style={{ background: 'var(--accent-2)' }}
                    />
                    <span>
                      <b className="font-medium">{d}</b> — {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
