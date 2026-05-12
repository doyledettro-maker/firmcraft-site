import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Firmcraft — Beyond chat. The six capabilities.',
  description:
    'Six capabilities — only one of which is "chat." Lives in every channel, runs on a schedule, wakes up on events, connects to any tool, remembers across sessions, asks before it acts.',
}

// ─── Capability demos ────────────────────────────────────────────────────

function Demo1Channels() {
  return (
    <div
      className="cap-demo flex items-center justify-center relative"
      style={{ background: 'linear-gradient(135deg,#FBE7CE,#F4E0BC)' }}
    >
      <svg
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.35]"
      >
        <line x1="160" y1="100" x2="50" y2="42" stroke="#2D1F14" strokeWidth="1" />
        <line x1="160" y1="100" x2="270" y2="42" stroke="#2D1F14" strokeWidth="1" />
        <line x1="160" y1="100" x2="36" y2="100" stroke="#2D1F14" strokeWidth="1" />
        <line x1="160" y1="100" x2="284" y2="100" stroke="#2D1F14" strokeWidth="1" />
        <line x1="160" y1="100" x2="64" y2="158" stroke="#2D1F14" strokeWidth="1" />
        <line x1="160" y1="100" x2="256" y2="158" stroke="#2D1F14" strokeWidth="1" />
      </svg>
      <div
        className="relative z-[2] w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-serif-warm italic font-medium text-2xl"
        style={{ boxShadow: '0 8px 18px -8px rgba(45,31,20,.45)' }}
      >
        F
      </div>
      <div className="absolute inset-0">
        {[
          { cls: 'top-6 left-8', label: 'Slack' },
          { cls: 'top-6 right-8', label: 'Teams' },
          { cls: 'top-1/2 left-[18px] -translate-y-1/2', label: 'SMS' },
          { cls: 'top-1/2 right-[18px] -translate-y-1/2', label: 'Email' },
          { cls: 'bottom-6 left-[46px]', label: 'Telegr.' },
          { cls: 'bottom-6 right-[46px]', label: 'WhatsApp' },
        ].map((c) => (
          <div
            key={c.label}
            className={`absolute ${c.cls} w-9 h-9 rounded-[9px] bg-white border border-[var(--line)] font-mono-warm text-[9.5px] font-medium flex items-center justify-center text-ink-2`}
            style={{ boxShadow: '0 6px 12px -6px rgba(45,31,20,.18)' }}
          >
            {c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function Demo2Schedule() {
  const rows: { ts: string; nm: string; tag: string; now?: boolean }[] = [
    { ts: 'Mon 7am', nm: 'Permit watcher', tag: 'weekly' },
    { ts: 'Now', nm: 'Monthly QBO close — Q1 batch', tag: 'running', now: true },
    { ts: 'Fri 4pm', nm: 'Friday recap', tag: 'weekly' },
    { ts: 'Daily 6pm', nm: 'EOD reconciliation', tag: 'daily' },
    { ts: 'Quarterly', nm: 'Client review packs', tag: 'scheduled' },
  ]
  return (
    <div
      className="cap-demo px-[22px] py-[18px] flex flex-col gap-1.5 justify-center"
      style={{ background: 'linear-gradient(180deg,#fff,var(--paper))' }}
    >
      {rows.map((r) => (
        <div
          key={r.nm}
          className={[
            'grid grid-cols-[60px_1fr_auto] gap-2.5 items-center px-2.5 py-1.5 rounded-lg font-mono-warm text-[10.5px] tracking-[0.04em]',
            r.now ? 'bg-ink' : '',
          ].join(' ')}
        >
          <span
            className={[
              r.now ? 'text-[#D5C5B0]' : 'text-accent',
              'font-medium uppercase',
            ].join(' ')}
          >
            {r.ts}
          </span>
          <span
            className={[
              r.now ? 'text-paper' : 'text-ink',
              'font-sans text-[12px] tracking-normal normal-case',
            ].join(' ')}
            style={{ fontFamily: 'var(--font-geist), sans-serif' }}
          >
            {r.nm}
          </span>
          <span
            className={[
              r.now ? 'text-[#D5C5B0]' : 'text-muted',
              'text-[9.5px] tracking-[0.1em] uppercase',
            ].join(' ')}
          >
            {r.tag}
          </span>
        </div>
      ))}
    </div>
  )
}

function Demo3Events() {
  const evts = [
    { src: 'FORM', desc: 'New lead from website', out: 'qualify + book' },
    { src: 'STRIPE', desc: 'Payment failed · cust 4421', out: 'retry + email' },
    { src: 'EMAIL', desc: 'COI request · Wilshire LP', out: 'draft + send' },
    { src: 'CAL', desc: 'Hearing in 7 days · Patel', out: 'prep brief' },
    { src: 'EOB', desc: 'Denial · claim 882041', out: 'draft appeal' },
  ]
  return (
    <div
      className="cap-demo px-5 py-[18px] flex flex-col gap-2 justify-center"
      style={{ background: 'linear-gradient(180deg,#fff,#EFF6F8)' }}
    >
      {evts.map((e) => (
        <div
          key={e.src + e.desc}
          className="grid grid-cols-[auto_1fr_auto_auto] gap-2.5 items-center font-mono-warm text-[11px] text-ink-2"
        >
          <span
            className="px-[7px] py-[3px] rounded-[5px] text-[9.5px] tracking-[0.08em] font-medium text-white"
            style={{ background: 'var(--accent-3)' }}
          >
            {e.src}
          </span>
          <span
            className="text-[12px] text-ink normal-case"
            style={{ fontFamily: 'var(--font-geist), sans-serif' }}
          >
            {e.desc}
          </span>
          <span className="text-accent">→</span>
          <span
            className="px-[7px] py-[3px] rounded-[5px] text-[9.5px] text-ink-2 bg-paper border border-dashed"
            style={{ borderColor: 'var(--line-2)' }}
          >
            {e.out}
          </span>
        </div>
      ))}
    </div>
  )
}

function Demo4Apis() {
  const apis = [
    'QBO', 'Stripe', 'HubSpot', 'DocuSign',
    'Drive', 'Calendly', 'Eaglesoft', 'NetSuite',
    'Zoho', 'Slack', 'Twilio',
  ]
  return (
    <div
      className="cap-demo px-5 py-[18px] grid grid-cols-4 gap-1.5 content-center"
      style={{ background: 'linear-gradient(135deg,#fff,#F2EBDC)' }}
    >
      {apis.map((a) => (
        <div
          key={a}
          className="py-2 px-1 rounded-lg bg-white border border-[var(--line)] font-mono-warm text-[9.5px] text-ink text-center tracking-[0.04em] flex items-center justify-center min-h-[30px]"
        >
          {a}
        </div>
      ))}
      <div
        className="py-2 px-1 rounded-lg bg-ink text-paper font-serif-warm italic text-[11px] flex items-center justify-center min-h-[30px]"
        style={{ borderColor: 'var(--ink)' }}
      >
        + yours
      </div>
    </div>
  )
}

function Demo5Memory() {
  const notes: { lab: string; body: React.ReactNode }[] = [
    { lab: 'Voice', body: <>Maya signs emails <b className="text-ink font-medium">&quot;warmly,&quot;</b> not &quot;best.&quot;</> },
    { lab: 'Client', body: <>Wilshire LP wants <b className="text-ink font-medium">2-hour COI</b> turnarounds.</> },
    { lab: 'Pricing', body: <>Implant pre-auth packets need <b className="text-ink font-medium">3 perio probes</b>.</> },
    { lab: 'Workflow', body: <>Partner reviews appeals <b className="text-ink font-medium">before</b> EL goes out.</> },
  ]
  return (
    <div
      className="cap-demo px-5 py-[18px] flex flex-col gap-[5px] justify-center relative"
      style={{ background: 'linear-gradient(180deg,#fff,#F1EBDD)' }}
    >
      <span
        aria-hidden
        className="absolute right-[18px] top-1/2 -translate-y-1/2 font-serif-warm italic font-medium text-[38px]"
        style={{ color: 'rgba(217,119,87,.18)' }}
      >
        ∞
      </span>
      {notes.map((n) => (
        <div
          key={n.lab}
          className="bg-white border border-[var(--line)] rounded-lg px-[11px] py-2 text-[11.5px] leading-[1.4] text-ink-2"
          style={{ fontFamily: 'var(--font-geist), sans-serif' }}
        >
          <span className="font-mono-warm text-[9.5px] tracking-[0.1em] text-accent uppercase block mb-0.5 font-medium">
            {n.lab}
          </span>
          {n.body}
        </div>
      ))}
    </div>
  )
}

function Demo6Approvals() {
  return (
    <div
      className="cap-demo px-[22px] py-[18px] flex flex-col gap-2.5 justify-center"
      style={{ background: 'linear-gradient(180deg,#fff,#E8EFE0)' }}
    >
      <div className="font-mono-warm text-[10px] tracking-[0.1em] text-muted uppercase">
        PENDING APPROVAL · 1 ACTION
      </div>
      <div className="bg-white border border-[var(--line)] rounded-[10px] px-3 py-2.5 flex gap-2.5 items-start text-[12.5px] leading-[1.4] text-ink">
        <div
          className="w-6 h-6 rounded-full text-white text-[9px] font-semibold flex items-center justify-center flex-none font-mono-warm"
          style={{ background: 'var(--accent)' }}
        >
          FC
        </div>
        <div>
          Drafted appeal for <b className="font-medium">denial #882041</b> — $710 underpaid.
          Ready to submit to Delta Dental portal.
          <br />
          <span className="text-muted text-[11px] font-mono-warm tracking-[0.06em]">
            SENDS · CLAIM_APPEAL.PDF
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 justify-end">
        {['Edit', 'Hold'].map((b) => (
          <button
            key={b}
            type="button"
            className="font-mono-warm text-[10px] px-2.5 py-[5px] rounded-[5px] tracking-[0.06em] uppercase border border-[var(--line)] bg-white text-ink-2"
          >
            {b}
          </button>
        ))}
        <button
          type="button"
          className="font-mono-warm text-[10px] px-2.5 py-[5px] rounded-[5px] tracking-[0.06em] uppercase text-white font-medium"
          style={{ background: 'var(--accent-2)', borderColor: 'var(--accent-2)' }}
        >
          Approve · send
        </button>
      </div>
    </div>
  )
}

const CAPS: {
  no: string
  title: React.ReactNode
  body: string
  bullets: string[]
  demo: React.ReactNode
}[] = [
  {
    no: '01 · Multi-channel',
    title: <>Lives <em>wherever</em> your team already messages.</>,
    body: 'Same operator. Same memory. Same playbooks. Field crews on SMS, partners on Slack, clients on email — one consistent piece of work across every channel.',
    bullets: ['Slack · Teams · Discord · Mattermost · Matrix', 'SMS · Email · WhatsApp · Signal · Telegram · iMessage', 'Voice notes in, voice replies out — on every channel that carries audio'],
    demo: <Demo1Channels />,
  },
  {
    no: '02 · Scheduled work',
    title: <>Runs on its own <em>clock</em>, not yours.</>,
    body: 'Monday morning recaps, Friday billing chases, monthly closes, quarterly reviews — set up once, runs forever. The work that always slips because nobody had time? That.',
    bullets: ['Cron + natural-language scheduling', 'Pause, resume, edit any job', 'Delivery to any of your messaging channels'],
    demo: <Demo2Schedule />,
  },
  {
    no: '03 · Event-driven',
    title: <>Wakes up when <em>something happens.</em></>,
    body: 'Form submitted. Payment failed. Email arrived. Calendar event in 7 days. EOB came back. The operator listens to your tools and acts the moment something needs doing — not later, when you remember.',
    bullets: ['Webhooks from any tool', 'Inbox + form + calendar listeners', 'Reacts in seconds, not days'],
    demo: <Demo3Events />,
  },
  {
    no: '04 · Any tool, any API',
    title: <>Speaks to your <em>weird tool</em>, too.</>,
    body: 'Most products give you a list of "supported integrations." We start there — then wire in the niche carrier portal, the obscure ERP, the in-house thing your last consultant built. If it has an API or a portal, it talks to it.',
    bullets: ['40+ tools out of the box', 'Custom connectors in week 1', 'Browser-driven where no API exists'],
    demo: <Demo4Apis />,
  },
  {
    no: '05 · Memory + learning',
    title: <>Gets <em>sharper</em> every time it runs.</>,
    body: "Knows your clients, your house voice, your pricing rules, last week's edits. Doesn't ask you the same question twice. The 200th claim is materially better than the first — because the operator remembers the 199 before it.",
    bullets: ['Per-firm persistent memory', 'Learns from every correction', 'Voice + style stays consistent'],
    demo: <Demo5Memory />,
  },
  {
    no: '06 · Approvals + audit',
    title: <>Asks <em>before</em> it sends, signs, or pays.</>,
    body: 'You set which actions need a human in the loop — money out, contracts going live, client-facing sends. Everything else just runs. Every action is logged, reversible, exportable for compliance.',
    bullets: ['Per-action approval rules', 'Checkpoints + /rollback — undo any action', 'Searchable audit log, exportable as CSV / JSON', 'SOC 2 in progress · HIPAA-ready posture'],
    demo: <Demo6Approvals />,
  },
]

const VS_ROWS: {
  feat: string
  us: React.ReactNode
  chatgpt: React.ReactNode
  copilot: React.ReactNode
  copilotPartial?: boolean
}[] = [
  {
    feat: '01 · Lives in every channel your team uses',
    us: <><b className="text-accent font-medium">Yes</b> — Slack, Teams, SMS, email, WhatsApp, more</>,
    chatgpt: <>One web app + mobile</>,
    copilot: <>Side panel inside Office</>,
  },
  {
    feat: '02 · Runs scheduled work without being asked',
    us: <><b className="text-accent font-medium">Yes</b> — cron-like, with holiday + conflict handling</>,
    chatgpt: <>You have to start every chat</>,
    copilot: <>You have to start every chat</>,
  },
  {
    feat: '03 · Wakes up on events in your tools',
    us: <><b className="text-accent font-medium">Yes</b> — webhooks, forms, inbox, calendar</>,
    chatgpt: <>Doesn&apos;t listen to anything</>,
    copilot: <>Within Office only</>,
    copilotPartial: true,
  },
  {
    feat: '04 · Connects to your weird tool',
    us: <><b className="text-accent font-medium">Yes</b> — custom connector in week one</>,
    chatgpt: <>You build it yourself</>,
    copilot: <>Microsoft stack only</>,
    copilotPartial: true,
  },
  {
    feat: '05 · Remembers your firm across sessions',
    us: <><b className="text-accent font-medium">Yes</b> — persistent memory, learns from edits</>,
    chatgpt: <>Generic memory feature</>,
    copilot: <>Per-document only</>,
  },
  {
    feat: '06 · Approvals + audit log for sensitive actions',
    us: <><b className="text-accent font-medium">Yes</b> — per-action rules, exportable log</>,
    chatgpt: <>Not designed for this</>,
    copilot: <>Not designed for this</>,
  },
  {
    feat: 'Where it runs',
    us: <><b className="text-accent font-medium">Your environment</b> — your data, your audit trail</>,
    chatgpt: <>Multi-tenant cloud</>,
    copilot: <>Multi-tenant cloud</>,
  },
]

const SCENARIOS: { num: string; title: React.ReactNode; body: string; tag: string }[] = [
  {
    num: '01',
    title: <>Front desk <em>@mentions</em> the operator in Slack</>,
    body: '"Patel claim — porcelain crown, tooth 14, did Friday. Submit?"',
    tag: 'Multi-channel',
  },
  {
    num: '02',
    title: <>Operator <em>remembers</em> Dr. Chen&apos;s coding style</>,
    body: 'Last 200 D2750s with this carrier — narrative phrasing, attached docs — pulled from memory.',
    tag: 'Memory',
  },
  {
    num: '03',
    title: <>Reads chart from <em>Eaglesoft</em>, files via <em>Delta portal</em></>,
    body: 'Two integrations. One a modern API, one a clunky vendor portal we drove with a browser.',
    tag: 'Any-tool',
  },
  {
    num: '04',
    title: <><em>Asks</em> Dr. Chen before submitting</>,
    body: 'Claims over $1,000 require partner approval. Form drafted, attachments staged, awaiting OK.',
    tag: 'Approvals',
  },
  {
    num: '05',
    title: <>Listens for the <em>EOB</em> — could be tomorrow or next week</>,
    body: 'Webhook on the carrier portal. The moment EOB lands, operator wakes up and continues.',
    tag: 'Event-driven',
  },
  {
    num: '06',
    title: <>Friday afternoon: <em>weekly report</em> on every claim</>,
    body: 'Approved · denied · pending · underpaid. Drafts appeals on every denial. Sent at 4pm sharp.',
    tag: 'Scheduled',
  },
]

export default function CapabilitiesPage() {
  return (
    <>
      <SiteHeader current="capabilities" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div
          aria-hidden
          className="absolute -top-[160px] -left-[180px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#F4D9B7,transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[180px] -right-[180px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,#DEEAD2,transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="font-mono-warm text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-accent hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Capabilities
          </div>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-end">
            <div>
              <div className="eyebrow">Beyond chat</div>
              <h1 className="font-serif-warm font-medium text-[clamp(46px,5.6vw,84px)] leading-[1.02] tracking-[-0.024em] mt-4 mb-4 text-balance serif-h">
                Most &quot;AI tools&quot; do{' '}
                <span
                  className="text-ink-2"
                  style={{
                    textDecoration: 'line-through',
                    textDecorationColor: 'rgba(45,31,20,.35)',
                    textDecorationThickness: '2px',
                  }}
                >
                  one
                </span>{' '}
                thing.
                <br />
                <em>Operators do six.</em>
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[540px]">
                A chatbot waits for you to type. An operator works on its own schedule, lives in
                every channel your team uses, wakes up when something happens in your tools,
                remembers what it learned last time, and asks before it does anything risky. Six
                capabilities — only one of which is &quot;chat.&quot;
              </p>
            </div>
            <div>
              <p
                className="font-serif-warm italic text-[24px] leading-[1.4] text-ink-2 max-w-[440px] ml-auto pl-[22px] py-1.5 text-balance"
                style={{ borderLeft: '2px solid var(--accent)' }}
              >
                If a tool can only do one of these, it&apos;s a chatbot.{' '}
                <b className="not-italic font-medium text-ink">If it can do all six, it&apos;s an employee.</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="pt-6 pb-[88px]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-baseline mb-6 font-mono-warm text-[11.5px] tracking-[0.1em] text-muted uppercase border-t border-[var(--line)] pt-[18px]">
            <span>
              <b className="text-ink font-medium">The six capabilities</b>
            </span>
            <span>Each demonstrated below</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPS.map((c) => (
              <article
                key={c.no}
                className="card-lift bg-white border border-[var(--line)] rounded-[20px] overflow-hidden flex flex-col"
              >
                <div className="cap-demo h-[200px] bg-paper border-b border-[var(--line)] relative overflow-hidden flex flex-col">
                  {c.demo}
                </div>
                <div className="p-[22px] pb-6 flex flex-col gap-3 flex-1">
                  <div className="font-mono-warm text-[10.5px] tracking-[0.16em] text-accent uppercase font-medium">
                    {c.no}
                  </div>
                  <h3 className="font-serif-warm font-medium text-[24px] tracking-[-0.012em] leading-[1.18] m-0 text-balance serif-h">
                    {c.title}
                  </h3>
                  <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">{c.body}</p>
                  <ul className="list-none p-0 m-0 mt-auto flex flex-col gap-1.5">
                    {c.bullets.map((b) => (
                      <li
                        key={b}
                        className="font-mono-warm text-[11px] tracking-[0.04em] text-ink uppercase flex gap-2 items-center pt-2 border-t border-dashed border-[var(--line)]"
                      >
                        <span
                          className="w-[5px] h-[5px] rounded-full flex-none"
                          style={{ background: 'var(--accent-2)' }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VS COMPARE */}
      <section className="bg-white border-y border-[var(--line)] py-20">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-end mb-9">
            <div>
              <div className="eyebrow">Why it&apos;s a different category</div>
              <h2 className="font-serif-warm font-medium text-[clamp(38px,4.4vw,60px)] leading-[1.05] tracking-[-0.022em] mt-2 text-balance serif-h">
                What ChatGPT can&apos;t actually do <em>for you.</em>
              </h2>
            </div>
            <p className="text-base text-ink-2 leading-[1.55] max-w-[480px] m-0 text-right justify-self-end">
              A general-purpose chat tool is a brilliant pencil. Your firm doesn&apos;t need a
              sharper pencil. It needs the work to happen while you&apos;re with a customer.
            </p>
          </div>

          <div className="rounded-[18px] overflow-hidden border border-[var(--line)] bg-paper">
            <table className="w-full border-separate border-spacing-0 text-[14.5px]">
              <thead>
                <tr>
                  {['Capability', 'Firmcraft', 'ChatGPT Team', 'Copilot'].map((h) => (
                    <th
                      key={h}
                      className="px-[22px] py-4 text-left font-mono-warm text-[11px] tracking-[0.12em] uppercase text-muted font-medium bg-white border-b border-[var(--line)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VS_ROWS.map((r, i) => (
                  <tr key={r.feat}>
                    <td
                      className="px-[22px] py-4 font-serif-warm font-medium text-base text-ink"
                      style={{
                        borderBottom: i === VS_ROWS.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      {r.feat}
                    </td>
                    <td
                      className="px-[22px] py-4 text-ink font-medium"
                      style={{
                        background: 'rgba(217,119,87,.06)',
                        borderBottom: i === VS_ROWS.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-white text-[10px] mr-2 font-semibold align-middle"
                        style={{ background: 'var(--accent-2)' }}
                      >
                        ✓
                      </span>
                      {r.us}
                    </td>
                    <td
                      className="px-[22px] py-4 text-muted"
                      style={{
                        borderBottom: i === VS_ROWS.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-muted text-[10px] mr-2 font-semibold align-middle"
                        style={{ background: 'rgba(45,31,20,.1)' }}
                      >
                        —
                      </span>
                      {r.chatgpt}
                    </td>
                    <td
                      className="px-[22px] py-4 text-muted"
                      style={{
                        borderBottom: i === VS_ROWS.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-muted text-[10px] mr-2 font-semibold align-middle"
                        style={{ background: 'rgba(45,31,20,.18)' }}
                      >
                        {r.copilotPartial ? '~' : '—'}
                      </span>
                      {r.copilot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* IN PRACTICE */}
      <section
        className="py-[88px]"
        style={{ background: 'linear-gradient(180deg,var(--paper),var(--paper-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div>
              <div className="eyebrow">In practice</div>
              <h2 className="font-serif-warm font-medium text-[clamp(34px,4vw,52px)] leading-[1.05] tracking-[-0.022em] mt-2 mb-4 text-balance serif-h">
                One workflow uses <em>all six</em> at once.
              </h2>
              <p className="text-[17px] text-ink-2 leading-[1.55] m-0 mb-4">
                The capabilities aren&apos;t separate features — they compose. Every interesting
                playbook touches several. Here&apos;s a real one, from a dental practice we work
                with.
              </p>
              <p
                className="font-serif-warm italic text-[21px] text-ink leading-[1.4] pl-[18px] mt-6"
                style={{ borderLeft: '2px solid var(--accent)' }}
              >
                &quot;Insurance claim submission&quot; looks like one thing. Behind it:{' '}
                <b className="not-italic font-medium">all six capabilities firing in sequence.</b>
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {SCENARIOS.map((s) => (
                <div
                  key={s.num}
                  className="bg-white border border-[var(--line)] rounded-[14px] px-5 py-4 grid grid-cols-[auto_1fr] gap-3.5 items-start"
                >
                  <div
                    className="font-serif-warm italic font-medium text-[34px] leading-[0.9] -mt-0.5"
                    style={{ color: 'var(--accent)' }}
                  >
                    {s.num}
                  </div>
                  <div>
                    <h4 className="font-serif-warm font-medium text-[18px] m-0 mb-1 tracking-[-0.005em] serif-h">
                      {s.title}
                    </h4>
                    <p className="text-sm text-ink-2 m-0 mb-2 leading-[1.5]">{s.body}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="font-mono-warm text-[10px] tracking-[0.08em] text-ink-2 bg-paper border border-[var(--line)] px-2 py-[3px] rounded-[5px] uppercase">
                        {s.tag}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFORCE TRAINING — adjacent offering */}
      <section className="py-14 border-t border-[var(--line)] bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 items-start">
            <div>
              <div className="eyebrow">Adjacent</div>
              <h3 className="font-serif-warm font-medium text-[26px] tracking-[-0.012em] mt-2 mb-0 serif-h">
                Workforce training
              </h3>
            </div>
            <p className="text-[15.5px] leading-[1.6] text-ink-2 m-0 max-w-[640px]">
              An operator that runs the work is one half of the equation — the other is a
              team that can operate alongside it. When customers ask for formal AI
              literacy, role-specific upskilling, or change-management to roll the
              operator out cleanly across a larger org, we hand off to our sister program at{' '}
              <a
                href="https://skillcalibrate.com"
                rel="noopener"
                className="text-accent underline underline-offset-[3px] hover:text-ink transition-colors"
              >
                SkillCalibrate
              </a>
              . Same operator-language ethos, longer engagement, focused on people rather
              than playbooks.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[88px] bg-paper border-t border-[var(--line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="eyebrow">Ready to see it on your work?</div>
              <h2 className="font-serif-warm font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance serif-h">
                The 20-minute call <em>is the demo.</em>
              </h2>
              <p className="text-[18px] text-ink-2 leading-[1.55] m-0 mb-6 max-w-[520px]">
                Bring one workflow that&apos;s been bugging you. We&apos;ll map which of the six
                capabilities it needs, scope a playbook, and tell you honestly if it&apos;s
                something you should pay us for or just write a Zapier flow.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="btn btn-primary btn-lg"
                  href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Discovery%20Call"
                >
                  Book a 20-min call →
                </a>
                <Link className="btn btn-ghost btn-lg" href="/playbooks">
                  Browse 40 playbooks
                </Link>
              </div>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-[18px] p-6">
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>
                A short reading list
              </div>
              <ul className="list-none p-0 m-0 mt-3.5 flex flex-col gap-3.5 font-serif-warm text-[18px] leading-[1.45]">
                {[
                  { href: '/playbooks', label: 'The 40 playbooks library' },
                  { href: '/how-it-works', label: 'How a five-day onboarding goes' },
                  { href: '/pricing', label: 'Pricing — flat, all-seats, no math' },
                  { href: '/integrations', label: 'The full integrations wall' },
                ].map((it, i, arr) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="flex justify-between items-center pb-3.5"
                      style={{
                        borderBottom:
                          i === arr.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <span>{it.label}</span>
                      <span className="text-accent italic">→</span>
                    </Link>
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
