'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

type Cat =
  | 'accounting'
  | 'medical'
  | 'legal'
  | 'crm'
  | 'comms'
  | 'docs'
  | 'payments'
  | 'calendar'
  | 'marketing'
  | 'esign'
  | 'pm'
  | 'forms'
  | 'support'
  | 'field'

type Badge = 'new' | 'beta' | 'driven'

type Tool = {
  name: string
  desc: string
  search: string
  badge?: Badge
  custom?: boolean
}

const CATEGORIES: { key: Cat; label: string; tools: Tool[] }[] = [
  {
    key: 'accounting',
    label: 'Accounting & bookkeeping',
    tools: [
      { name: 'QuickBooks Online', desc: 'Read · write · close · 1099s', search: 'quickbooks qbo intuit' },
      { name: 'Xero', desc: 'Read · write · reconcile', search: 'xero accounting' },
      { name: 'Sage Intacct', desc: 'Read · write', search: 'sage 100 50 intacct' },
      { name: 'NetSuite', desc: 'Read · write · saved searches', search: 'netsuite oracle' },
      { name: 'FreshBooks', desc: 'Read · write', search: 'freshbooks' },
      { name: 'Wave', desc: 'Read · write', search: 'wave' },
      { name: 'Bill.com', desc: 'AP · AR · approvals', search: 'bill com bill.com' },
      { name: 'Ramp', desc: 'Spend · cards · close', search: 'ramp', badge: 'new' },
      { name: 'Brex', desc: 'Spend · cards · expense', search: 'brex', badge: 'new' },
    ],
  },
  {
    key: 'medical',
    label: 'Medical & dental practice management',
    tools: [
      { name: 'Eaglesoft', desc: 'Charts · scheduling · billing', search: 'eaglesoft patterson dental', badge: 'driven' },
      { name: 'Dentrix', desc: 'Charts · scheduling · claims', search: 'dentrix henry schein', badge: 'driven' },
      { name: 'Open Dental', desc: 'API + read · write', search: 'open dental' },
      { name: 'Curve Dental', desc: 'Cloud-native · read · write', search: 'curve dental' },
      { name: 'athenahealth', desc: 'EHR · billing · scheduling', search: 'athenahealth athena' },
      { name: 'Epic', desc: 'FHIR · read', search: 'epic mychart', badge: 'beta' },
      { name: 'Tebra (Kareo)', desc: 'EHR · billing', search: 'kareo tebra' },
      { name: 'Practice Fusion', desc: 'EHR · read', search: 'practice fusion' },
      { name: 'SimplePractice', desc: 'Notes · billing · scheduling', search: 'simplepractice therapy' },
      { name: 'Weave', desc: 'Comms · payments', search: 'weave' },
    ],
  },
  {
    key: 'legal',
    label: 'Legal practice management',
    tools: [
      { name: 'Clio', desc: 'Matters · billing · docs', search: 'clio law' },
      { name: 'MyCase', desc: 'Matters · billing', search: 'mycase' },
      { name: 'PracticePanther', desc: 'Matters · time · billing', search: 'practice panther' },
      { name: 'Smokeball', desc: 'Matters · auto-time', search: 'smokeball', badge: 'driven' },
      { name: 'Filevine', desc: 'Matters · workflow', search: 'filevine' },
      { name: 'Rocket Matter', desc: 'Matters · billing', search: 'rocket matter' },
      { name: 'CARET Legal', desc: 'Matters · billing', search: 'caret legal', badge: 'new' },
    ],
  },
  {
    key: 'crm',
    label: 'CRM & sales',
    tools: [
      { name: 'HubSpot', desc: 'Contacts · pipelines · marketing', search: 'hubspot' },
      { name: 'Salesforce', desc: 'Full object model', search: 'salesforce sfdc' },
      { name: 'Pipedrive', desc: 'Pipelines · activities', search: 'pipedrive' },
      { name: 'Close', desc: 'Calls · sequences · pipelines', search: 'close.com' },
      { name: 'Zoho CRM', desc: 'Modules · workflows', search: 'zoho crm' },
      { name: 'Attio', desc: 'Contacts · objects · workspace', search: 'attio', badge: 'new' },
      { name: 'Copper', desc: 'Pipelines · contacts', search: 'copper' },
      { name: 'Folk', desc: 'Lightweight CRM', search: 'folk crm' },
      { name: 'Apollo.io', desc: 'Enrichment · sequences', search: 'apollo' },
      { name: 'Gong', desc: 'Call recording · summaries', search: 'gong' },
    ],
  },
  {
    key: 'comms',
    label: 'Communications',
    tools: [
      { name: 'Slack', desc: 'Channels · DMs · slash · approvals', search: 'slack' },
      { name: 'MS Teams', desc: 'Channels · chats · approvals', search: 'microsoft teams' },
      { name: 'Discord', desc: 'Channels · DMs', search: 'discord' },
      { name: 'Telegram', desc: 'Bot API · chats · channels', search: 'telegram' },
      { name: 'WhatsApp Business', desc: 'Customer convos · templates', search: 'whatsapp business' },
      { name: 'Signal', desc: 'Encrypted bridge', search: 'signal', badge: 'beta' },
      { name: 'iMessage', desc: 'macOS bridge · per-firm', search: 'imessage apple' },
      { name: 'Twilio SMS', desc: 'Send · receive · MMS', search: 'twilio sms' },
      { name: 'Gmail · Outlook', desc: 'Read · draft · send · triage', search: 'email gmail outlook' },
      { name: 'Zoom', desc: 'Recording · transcript', search: 'zoom meeting' },
      { name: 'Loom', desc: 'Recording · transcript', search: 'loom' },
    ],
  },
  {
    key: 'docs',
    label: 'Documents & storage',
    tools: [
      { name: 'Google Drive', desc: 'Read · write · search · permissions', search: 'google drive workspace' },
      { name: 'Microsoft 365', desc: 'OneDrive · SharePoint · Graph', search: 'microsoft 365 sharepoint onedrive' },
      { name: 'Dropbox', desc: 'Read · write', search: 'dropbox' },
      { name: 'Box', desc: 'Enterprise content', search: 'box' },
      { name: 'Notion', desc: 'Pages · databases · search', search: 'notion' },
      { name: 'Confluence', desc: 'Spaces · pages', search: 'confluence atlassian' },
      { name: 'SmartVault', desc: 'CPA / legal storage', search: 'smartvault' },
      { name: 'OneDrive', desc: 'Read · write', search: 'onedrive' },
    ],
  },
  {
    key: 'payments',
    label: 'Payments & billing',
    tools: [
      { name: 'Stripe', desc: 'Charges · subs · webhooks · refunds', search: 'stripe' },
      { name: 'Square', desc: 'POS · invoices', search: 'square' },
      { name: 'Plaid', desc: 'Bank linking · balances', search: 'plaid' },
      { name: 'Mercury', desc: 'Bank · cards · close', search: 'mercury banking' },
      { name: 'PayPal', desc: 'Charges · invoices', search: 'paypal' },
      { name: 'Invoiced', desc: 'AR · dunning', search: 'invoiced' },
      { name: 'Chargebee', desc: 'Subs · billing', search: 'chargebee' },
      { name: 'Recurly', desc: 'Subs · billing', search: 'recurly' },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendars & scheduling',
    tools: [
      { name: 'Google Calendar', desc: 'Read · write · holds · invitees', search: 'google calendar' },
      { name: 'Outlook Calendar', desc: 'Read · write · holds', search: 'outlook calendar microsoft' },
      { name: 'Calendly', desc: 'Routing · embeds · webhooks', search: 'calendly' },
      { name: 'Cal.com', desc: 'Open scheduling', search: 'cal.com' },
      { name: 'Acuity', desc: 'Bookings · intake', search: 'acuity squarespace scheduling' },
      { name: 'SavvyCal', desc: 'Routing · embeds', search: 'savvycal' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & email',
    tools: [
      { name: 'Mailchimp', desc: 'Lists · sends · segments', search: 'mailchimp' },
      { name: 'Klaviyo', desc: 'Flows · segments', search: 'klaviyo' },
      { name: 'Beehiiv', desc: 'Newsletter · sends', search: 'beehiiv' },
      { name: 'ActiveCampaign', desc: 'Automations · CRM', search: 'active campaign' },
      { name: 'Brevo', desc: 'Marketing · transactional', search: 'brevo sendinblue' },
      { name: 'Constant Contact', desc: 'SMB email', search: 'constant contact' },
      { name: 'LinkedIn', desc: 'Posts · DMs · drafts', search: 'linkedin', badge: 'driven' },
      { name: 'Google Business', desc: 'Reviews · posts', search: 'google business profile' },
    ],
  },
  {
    key: 'esign',
    label: 'E-signature & documents',
    tools: [
      { name: 'DocuSign', desc: 'Templates · envelopes · webhooks', search: 'docusign' },
      { name: 'Dropbox Sign', desc: 'Templates · webhooks', search: 'dropbox sign hellosign' },
      { name: 'PandaDoc', desc: 'Proposals · signing', search: 'pandadoc' },
      { name: 'Adobe Sign', desc: 'Templates · signing', search: 'adobe sign' },
      { name: 'signNow', desc: 'Templates · signing', search: 'signnow' },
      { name: 'Ironclad', desc: 'CLM · workflows', search: 'ironclad', badge: 'new' },
    ],
  },
  {
    key: 'pm',
    label: 'Tasks & project management',
    tools: [
      { name: 'Linear', desc: 'Issues · cycles · projects', search: 'linear' },
      { name: 'Asana', desc: 'Tasks · projects', search: 'asana' },
      { name: 'ClickUp', desc: 'Tasks · docs · spaces', search: 'clickup' },
      { name: 'Trello', desc: 'Boards · cards', search: 'trello' },
      { name: 'Monday.com', desc: 'Boards · automations', search: 'monday.com' },
      { name: 'Jira', desc: 'Issues · workflows', search: 'jira atlassian' },
      { name: 'Height', desc: 'Tasks · AI workflows', search: 'height app', badge: 'new' },
    ],
  },
  {
    key: 'forms',
    label: 'Forms & intake',
    tools: [
      { name: 'Typeform', desc: 'Submissions · webhooks', search: 'typeform' },
      { name: 'Tally', desc: 'Submissions · webhooks', search: 'tally' },
      { name: 'Jotform', desc: 'Submissions · HIPAA', search: 'jotform' },
      { name: 'Google Forms', desc: 'Submissions · sheets', search: 'google forms' },
      { name: 'Fillout', desc: 'Submissions · routing', search: 'fillout' },
      { name: 'Formstack', desc: 'Submissions · workflows', search: 'formstack' },
    ],
  },
  {
    key: 'support',
    label: 'Customer support',
    tools: [
      { name: 'Zendesk', desc: 'Tickets · macros · routing', search: 'zendesk' },
      { name: 'Intercom', desc: 'Conversations · helpdesk', search: 'intercom' },
      { name: 'Help Scout', desc: 'Conversations · docs', search: 'help scout' },
      { name: 'Front', desc: 'Shared inboxes', search: 'front email' },
      { name: 'Freshdesk', desc: 'Tickets · automations', search: 'freshdesk' },
      { name: 'HubSpot Service', desc: 'Tickets · pipelines', search: 'hubspot service' },
    ],
  },
  {
    key: 'field',
    label: 'Field service & trades',
    tools: [
      { name: 'Jobber', desc: 'Jobs · scheduling · invoicing', search: 'jobber' },
      { name: 'ServiceTitan', desc: 'Jobs · CRM · payroll', search: 'servicetitan' },
      { name: 'Housecall Pro', desc: 'Jobs · invoicing · payments', search: 'housecall pro' },
      { name: 'FieldEdge', desc: 'Jobs · dispatch', search: 'fieldedge' },
      { name: 'ServiceChannel', desc: 'FM · work orders', search: 'servicechannel' },
      { name: 'Buildertrend', desc: 'Construction PM', search: 'buildertrend' },
      { name: 'Quickbase', desc: 'Custom apps · ops', search: 'quickbase' },
      { name: 'Gusto', desc: 'Payroll · HR · onboarding', search: 'gusto payroll' },
      { name: 'ADP / Paychex', desc: 'Payroll · HR · reports', search: 'adp paychex', badge: 'driven' },
      { name: 'Your weird tool', desc: 'Custom connector · week 1', search: 'any custom api browser portal', custom: true },
    ],
  },
]

const CHIPS: { key: 'all' | Cat; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'medical', label: 'Medical & dental PM' },
  { key: 'legal', label: 'Legal PM' },
  { key: 'crm', label: 'CRM & sales' },
  { key: 'comms', label: 'Comms' },
  { key: 'docs', label: 'Docs & storage' },
  { key: 'payments', label: 'Payments' },
  { key: 'calendar', label: 'Calendars' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'esign', label: 'E-sign' },
  { key: 'pm', label: 'Tasks & PM' },
  { key: 'forms', label: 'Forms & intake' },
  { key: 'support', label: 'Customer support' },
  { key: 'field', label: 'Field service' },
]

const TOTAL = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0)

const BADGE_STYLE: Record<Badge, { bg: string; color: string }> = {
  new: { bg: 'rgba(16,185,129,.12)', color: 'var(--color-ok)' },
  beta: { bg: 'rgba(251,124,80,.1)', color: 'var(--color-operator)' },
  driven: { bg: 'rgba(44,107,240,.12)', color: 'var(--color-signal)' },
}

function ToolCard({ t }: { t: Tool }) {
  return (
    <div
      className={[
        'card-lift relative rounded-xl p-3.5 flex flex-col gap-1.5 min-h-[96px] border',
        t.custom
          ? 'bg-ink text-paper border-ink'
          : 'bg-white border-[var(--color-line)]',
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center font-sans font-semibold text-[18px] tracking-[-0.005em] leading-[1.15]',
          t.custom ? 'text-paper' : 'text-ink',
        ].join(' ')}
      >
        <span
          className="inline-block w-2 h-2 rounded-full mr-2 flex-none"
          style={{ background: 'var(--color-signal)' }}
        />
        {t.name}
      </div>
      <p
        className={[
          'm-0 text-[11.5px] leading-[1.4] font-mono',
          t.custom ? 'text-[var(--color-inverse-2)]' : 'text-muted',
        ].join(' ')}
      >
        {t.desc}
      </p>
      {t.badge && (
        <span
          className="absolute top-2.5 right-2.5 font-mono text-[8.5px] tracking-[0.1em] uppercase px-1.5 py-px rounded font-medium"
          style={{
            background: BADGE_STYLE[t.badge].bg,
            color: BADGE_STYLE[t.badge].color,
          }}
        >
          {t.badge}
        </span>
      )}
    </div>
  )
}

export function IntegrationsClient() {
  const [active, setActive] = useState<'all' | Cat>('all')
  const [query, setQuery] = useState('')

  const { visibleTotal, sections } = useMemo(() => {
    const q = query.trim().toLowerCase()
    let visibleTotal = 0
    const sections = CATEGORIES.map((cat) => {
      const catMatch = active === 'all' || active === cat.key
      const tools = cat.tools.filter((t) => {
        if (!catMatch) return false
        if (!q) return true
        const hay = (t.search + ' ' + t.name + ' ' + t.desc).toLowerCase()
        return hay.includes(q)
      })
      visibleTotal += tools.length
      return { ...cat, tools }
    }).filter((s) => s.tools.length > 0)
    return { visibleTotal, sections }
  }, [active, query])

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-8">
        <div
          aria-hidden
          className="absolute -top-[160px] -right-[180px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[180px] -left-[180px] w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Integrations
          </div>
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-14 items-end">
            <div>
              <div className="eyebrow">Vol. 01 · Spring 2026</div>
              <h1 className="font-sans font-medium text-[clamp(46px,5.6vw,80px)] leading-[1.02] tracking-[-0.024em] mt-4 mb-4 text-balance ">
                Every tool you <em>already pay for.</em>
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[540px] m-0">
                A hundred-and-change integrations across the SaaS your firm uses today —
                accounting, practice management, CRM, comms, calendars, payments, marketing,
                e-sign, support. If yours isn&apos;t here, we wire it in during onboarding.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-5 border-t border-[var(--color-line)] pt-6">
                {[
                  { k: 'Catalog', v: <em>112</em>, c: 'Tools we connect to — across API, MCP, and browser automation.' },
                  { k: 'Categories', v: <em>14</em>, c: 'From accounting to field service to legal.' },
                  { k: 'Custom', v: <>Wk <em>1</em></>, c: "Don't see yours? We build it during onboarding." },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                      {s.k}
                    </div>
                    <div className="font-sans text-[42px] font-medium tracking-[-0.02em] leading-none mt-1.5 ">
                      {s.v}
                    </div>
                    <div className="text-[13px] text-ink-2 mt-1.5 leading-[1.4]">{s.c}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div
        className="sticky top-16 z-40 border-y border-[var(--color-line)] py-3.5 mt-12"
        style={{
          background: 'rgba(244,246,250,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-8 flex items-center gap-3.5 flex-wrap justify-between">
          <div className="flex gap-2 flex-wrap">
            {CHIPS.map((chip) => {
              const isActive = active === chip.key
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActive(chip.key)}
                  className={[
                    'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] transition-colors border',
                    isActive
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-white text-ink-2 border-[var(--color-line)] hover:border-[var(--color-ink-2)] hover:text-ink',
                  ].join(' ')}
                >
                  {chip.label}
                  {chip.key === 'all' && (
                    <span
                      className={[
                        'font-mono text-[10.5px] px-1.5 py-px rounded-full',
                        isActive
                          ? 'bg-white/15 text-[var(--color-inverse-2)]'
                          : 'bg-paper text-muted',
                      ].join(' ')}
                    >
                      {TOTAL}
                    </span>
                  )}
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
              placeholder="Search 112 tools…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-sans text-[13.5px] py-2.5 pl-9 pr-3.5 rounded-full border border-[var(--color-line)] bg-white text-ink w-[260px] outline-none transition-all focus:border-ink focus:w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* LIBRARY */}
      <section className="pt-9 pb-6">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-baseline mb-4 font-mono text-[11.5px] tracking-[0.1em] text-muted uppercase">
            <span>
              Showing <b className="text-ink font-medium">{visibleTotal}</b> of{' '}
              <b className="text-ink font-medium">{TOTAL}</b> integrations
            </span>
            <span>
              <span style={{ color: 'var(--color-signal)' }}>●</span> live &nbsp;{' '}
              <span style={{ color: 'var(--color-ok)' }}>●</span> recently added &nbsp;{' '}
              <span style={{ color: 'var(--color-signal)' }}>●</span> browser-driven
            </span>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-16 text-muted font-sans text-[22px]">
              No integrations match. Try a broader filter — or ask us to build it.
            </div>
          ) : (
            sections.map((cat) => (
              <div key={cat.key} className="mb-8">
                <div className="flex items-baseline justify-between mb-3.5 border-b border-[var(--color-line)] pb-2.5">
                  <h3 className="font-sans font-semibold text-2xl tracking-[-0.01em] m-0 text-ink">
                    {cat.label}
                  </h3>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                    {cat.tools.length} tool{cat.tools.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {cat.tools.map((t) => (
                    <ToolCard key={t.name} t={t} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BUILD */}
      <section className="bg-white border-y border-[var(--color-line)] py-16">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="eyebrow">When the list isn&apos;t long enough</div>
              <h2 className="font-sans font-medium text-[clamp(34px,3.8vw,52px)] leading-[1.05] tracking-[-0.022em] mt-2 mb-4 text-balance ">
                If it has an <em>API</em>, a portal, or a webpage — we can drive it.
              </h2>
              <p className="text-[17px] text-ink-2 leading-[1.55] m-0 mb-3.5">
                Most firms hit at least one tool that&apos;s not in this catalog —
                a regional carrier&apos;s claim portal, an in-house ERP your last
                consultant built, a government filing site older than half the team.
                None of it stops us.
              </p>
              <p className="text-[17px] text-ink-2 leading-[1.55] m-0">
                <strong className="text-ink font-medium">
                  Three ways the operator can speak to a tool:
                </strong>{' '}
                a documented API (preferred), an undocumented but reachable HTTP endpoint, or a
                browser session driving the actual UI when there&apos;s no programmatic surface
                at all. Most &quot;weird tool&quot; connectors take 1–3 days.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Mon', 'Intake call', 'You name the tool, the workflow, and the gnarly edge cases.'],
                ['Tue', 'Connector wired', 'API or browser-driven session. Test creds in your sandbox.'],
                ['Wed', 'Dry runs', '10 shadow runs. We compare to your spreadsheet of expected outputs.'],
                ['Thu–Fri', 'Live', 'Operator runs it in production. We watch the first week.'],
              ].map(([d, h, body]) => (
                <div
                  key={d}
                  className="bg-paper border border-[var(--color-line)] rounded-xl p-3.5"
                >
                  <div className="font-mono text-[10.5px] tracking-[0.14em] text-signal uppercase font-medium mb-1">
                    {d}
                  </div>
                  <h5 className="font-sans font-medium text-[15px] tracking-[-0.005em] m-0 mb-1 ">
                    {h}
                  </h5>
                  <p className="text-[12.5px] text-ink-2 leading-[1.4] m-0">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-9">
            <div className="eyebrow">Real custom connectors</div>
            <h2 className="font-sans font-medium text-[clamp(32px,3.6vw,48px)] leading-[1.05] tracking-[-0.02em] mt-2 mb-3 text-balance ">
              The weirdest tools we&apos;ve wired up <em>this quarter.</em>
            </h2>
            <p className="text-[17px] text-ink-2 leading-[1.55] max-w-[640px] mx-auto m-0">
              A representative slice from the actual onboarding queue — names changed, but the
              tool stacks are real.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              {
                who: 'Dental · Eaglesoft + Delta',
                title: 'Drove an Eaglesoft client + a 2003-era carrier portal',
                body: 'Eaglesoft has no public API. We run a sanctioned local agent on the front-desk machine that reads charts. Carrier portal driven via headless browser. Six claim types end-to-end.',
                stack: ['Eaglesoft', 'Delta Dental', 'Drive', 'Slack'],
              },
              {
                who: 'Tree co · Self-built scheduler',
                title: 'An owner-built FileMaker app that runs the whole shop',
                body: '15-year-old FileMaker DB the owner built himself. We exposed it over a small REST shim, then ran the dispatch + Google reviews flywheel against it.',
                stack: ['FileMaker', 'Twilio', 'Google Business'],
              },
              {
                who: 'CPA firm · State filing portals',
                title: 'Eight different state revenue-department portals',
                body: "Each state's portal is its own snowflake. We built a parameterized browser-driver template — adding a new state takes a day, not a sprint.",
                stack: ['State portals', 'QBO', 'SmartVault', 'Drive'],
              },
            ].map((ex) => (
              <div
                key={ex.title}
                className="bg-white border border-[var(--color-line)] rounded-2xl p-[22px] flex flex-col gap-3"
              >
                <div className="font-mono text-[10.5px] tracking-[0.12em] text-signal uppercase font-medium">
                  {ex.who}
                </div>
                <h4 className="font-sans font-semibold text-[18px] tracking-[-0.005em] m-0 leading-[1.3]">
                  {ex.title}
                </h4>
                <p className="m-0 text-[13.5px] leading-[1.5] text-ink-2">{ex.body}</p>
                <div className="flex gap-1.5 flex-wrap pt-2 border-t border-dashed border-[var(--color-line)]">
                  {ex.stack.map((s) => (
                    <span
                      key={s}
                      className="font-mono text-[10px] tracking-[0.04em] text-ink bg-paper border border-[var(--color-line)] px-[7px] py-[3px] rounded-[5px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[88px] bg-paper border-t border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="eyebrow">Don&apos;t see your tool?</div>
              <h2 className="font-sans font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance ">
                Tell us what you use. We&apos;ll <em>tell you the truth.</em>
              </h2>
              <p className="text-[18px] text-ink-2 leading-[1.55] m-0 mb-6 max-w-[520px]">
                If we already integrate, we&apos;ll show you how on the call. If we don&apos;t,
                we&apos;ll either commit to a custom connector in week one — or honestly tell you
                it&apos;s not feasible and you should stay on Zapier. Both happen.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="btn btn-primary btn-lg"
                  href="/contact"
                >
                  Book a 20-min call →
                </a>
                <Link className="btn btn-ghost btn-lg" href="/playbooks">
                  Browse 40 playbooks
                </Link>
              </div>
            </div>
            <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6">
              <div className="eyebrow" style={{ color: 'var(--color-ink-2)' }}>
                A short tour
              </div>
              <ul className="list-none p-0 m-0 mt-3.5 flex flex-col gap-3.5 font-sans text-[18px] leading-[1.45]">
                {[
                  { href: '/capabilities', label: 'The six capabilities' },
                  { href: '/security', label: 'Security & trust' },
                  { href: '/playbooks', label: 'The 40 playbooks library' },
                  { href: '/pricing', label: 'Pricing — flat, all-seats' },
                ].map((it, i, arr) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="flex justify-between items-center pb-3.5"
                      style={{
                        borderBottom:
                          i === arr.length - 1 ? 'none' : '1px solid var(--color-line)',
                      }}
                    >
                      <span>{it.label}</span>
                      <span className="text-signal italic">→</span>
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
