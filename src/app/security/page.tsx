import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Security & Sovereignty — Your Data, Your Environment, Your Audit Log',
  description:
    'Per-firm deployment, enterprise-grade encryption, full audit log, partner approvals on sensitive actions. The default posture is paranoid.',
  alternates: { canonical: '/security' },
}

const PRINCIPLES: { n: string; title: React.ReactNode; body: string }[] = [
  {
    n: '01',
    title: <>Your data <em>doesn&apos;t</em> leave your boundary.</>,
    body: 'The operator runs in a deployment dedicated to your firm. Your client records, chats, and documents stay in that boundary. No multi-tenant brain. No training on your data. No shared embeddings.',
  },
  {
    n: '02',
    title: <>Every action is <em>visible</em> and reversible.</>,
    body: "Every read, every write, every send is logged with who triggered it, what it touched, and why. Filterable, exportable, addressable by audit. If it shouldn't have happened, you can see it and undo it.",
  },
  {
    n: '03',
    title: <>The risky stuff <em>asks first.</em></>,
    body: 'Money out, contracts going live, client sends, anything irreversible — partner approval required, by default. You configure which actions need a human and which just run. Nothing slips.',
  },
]

const DEPLOY_ROWS: { lbl: string; val: string; kind?: 'ok' | 'warn' }[] = [
  { lbl: 'Per-firm isolation', val: 'Dedicated', kind: 'ok' },
  { lbl: 'Tenancy model', val: 'single-tenant' },
  { lbl: 'Default region', val: 'US-East-1' },
  { lbl: 'BYO cloud', val: 'AWS · GCP · Azure', kind: 'ok' },
  { lbl: 'On-prem', val: 'Available', kind: 'ok' },
  { lbl: 'Encryption at rest', val: 'AES-256', kind: 'ok' },
  { lbl: 'Encryption in transit', val: 'TLS 1.3', kind: 'ok' },
  { lbl: 'Customer data in training', val: 'Never', kind: 'warn' },
  { lbl: 'Provider redundancy', val: '≥2 LLMs', kind: 'ok' },
  { lbl: 'Sub-processors', val: '3 · listed' },
]

type Cell = { kind: 'y' | 'n' | 'a' }
const RBAC: { action: string; cells: Cell[] }[] = [
  { action: 'Read patient chart', cells: [{ kind: 'y' }, { kind: 'y' }, { kind: 'y' }] },
  { action: 'Submit insurance claim', cells: [{ kind: 'y' }, { kind: 'n' }, { kind: 'y' }] },
  { action: 'Submit appeal > $1k', cells: [{ kind: 'a' }, { kind: 'n' }, { kind: 'y' }] },
  { action: 'Refund a patient', cells: [{ kind: 'n' }, { kind: 'n' }, { kind: 'a' }] },
  { action: 'Run recall campaign', cells: [{ kind: 'a' }, { kind: 'n' }, { kind: 'y' }] },
  { action: 'Edit playbook config', cells: [{ kind: 'n' }, { kind: 'n' }, { kind: 'y' }] },
  { action: 'Export audit log', cells: [{ kind: 'n' }, { kind: 'n' }, { kind: 'y' }] },
]

const LOG: { ts: string; what: React.ReactNode; held?: boolean }[] = [
  { ts: '09:18:02', what: <><b className="font-medium text-ink">Maya R.</b> mentioned operator · <em className="text-signal not-italic">claim_submission</em></> },
  { ts: '09:18:14', what: <>Operator read · <em className="text-signal not-italic">Eaglesoft / chart 4421</em></> },
  { ts: '09:18:31', what: <>Operator wrote · <em className="text-signal not-italic">claim_882041.pdf</em> → /Drive/Claims/</> },
  { ts: '09:18:44', what: <>Operator sent · POST <em className="text-signal not-italic">delta-dental.com/claims</em></> },
  { ts: '11:42:08', what: <>Inbound webhook · EOB received · <em className="text-signal not-italic">$710 paid</em></> },
  { ts: '11:42:12', what: <>Action <em className="not-italic" style={{ color: 'var(--color-operator)' }}>held</em> · pending Dr. Chen approval</>, held: true },
  { ts: '11:48:55', what: <><b className="font-medium text-ink">Dr. Chen</b> approved · patient text drafted</> },
  { ts: '11:48:57', what: <>Operator sent · SMS <em className="text-signal not-italic">+1 ••• ••• 4421</em></> },
  { ts: '14:01:03', what: <>Scheduled run · <em className="text-signal not-italic">recall_reactivation</em> · 38 drafts queued</> },
]

const COMPLIANCE: { stat: string; nm: string; body: string }[] = [
  { stat: 'Readiness', nm: 'SOC 2 Type II', body: 'Building with SOC 2 controls from day one. Formal audit engagement when customer contracts require it.' },
  { stat: 'In progress', nm: 'HIPAA', body: 'BAA-able today. Full attestation follows SOC 2 certification.' },
  { stat: 'Annual', nm: 'Penetration testing', body: 'External pen test every 12 months · NDA required.' },
  { stat: 'Live', nm: 'DPA + sub-processor list', body: 'GDPR-aligned DPA on request. Three sub-processors.' },
  { stat: 'Live', nm: 'Vulnerability disclosure', body: 'security@firmcraft · 90-day fix SLA · public bounty soon.' },
  { stat: 'Certified', nm: 'ISO 27001 Infrastructure', body: 'Hosted on Hetzner infrastructure certified to ISO/IEC 27001:2022 with BSI C5 Type 2 attestation.' },
  { stat: 'Future', nm: 'ISO 27001', body: 'On the roadmap once customer demand warrants formal certification.' },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: "Will my client data be used to train models?",
    a: "No. Your firm's data — chats, documents, charts, audit logs — is never used for model training. Not by us, not by the model providers we route through. This is enforced contractually with our model providers and architecturally by the per-firm deployment.",
  },
  {
    q: "Where is my data physically stored?",
    a: "By default, US-East-1 (Northern Virginia) for managed deployments. We can deploy to US-West, EU regions, or your own AWS / GCP / Azure account. On-prem deployment is available for firms with that requirement; we'll quote the engagement separately.",
  },
  {
    q: "What happens to my data if we churn?",
    a: "You get a full export within 5 business days — every chat, document, audit log entry, and playbook configuration in open formats (CSV, JSON, Markdown, PDF). Your deployment is then destroyed and we hold a 30-day backup for emergency recovery, after which it's also destroyed. We notify you when the final destruction completes.",
  },
  {
    q: "Who at Firmcraft can see my data?",
    a: "Three engineers, named in our DPA. Access is logged, scoped to the specific issue, and time-boxed. Routine support and onboarding don't require access to your data — they work from telemetry and your screen-share.",
  },
  {
    q: "What if a model provider has an outage or breach?",
    a: "The operator routes across 45+ supported LLM providers, with built-in automatic failover and credential pools that distribute load across keys. If Anthropic has an outage, we route to OpenAI, Bedrock, or Gemini without you noticing. In the case of a security incident at a provider, we have contractual notification obligations and our own 24-hour incident SLA — we'd notify you, isolate any affected workflows, and switch routing.",
  },
  {
    q: "Do you offer a BAA?",
    a: "Yes — BAAs are part of standard onboarding for healthcare deployments (dental, medical, behavioral health). Signed before any patient data flows.",
  },
  {
    q: "Can I see your security documentation or pen test?",
    a: "Yes, under NDA. Email security@firmcraft and we'll share our security architecture overview, controls documentation, and pen test summary within one business day.",
  },
  {
    q: "What happens if Firmcraft goes out of business?",
    a: "The operator runs on Hermes Agent, an MIT-licensed open-source platform maintained by Nous Research. Your skills, memory files, integrations, and audit logs are all stored in standard formats on infrastructure you can take with you. You — or another vendor — can pick them up and run a Hermes deployment elsewhere on day one. We don't own the runtime. We operate it for you. No lock-in, by design.",
  },
]

function VRow({
  lbl,
  val,
  kind,
}: {
  lbl: string
  val: string
  kind?: 'ok' | 'warn'
}) {
  let style: React.CSSProperties = {}
  if (kind === 'ok') {
    style = {
      color: 'var(--color-ok)',
      background: 'rgba(16,185,129,.08)',
      borderColor: 'rgba(16,185,129,.3)',
    }
  } else if (kind === 'warn') {
    style = {
      color: 'var(--color-operator)',
      background: 'rgba(251,124,80,.08)',
      borderColor: 'rgba(251,124,80,.3)',
    }
  }
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3.5 py-2.5 border-b border-dashed border-[var(--color-line)] items-center text-sm last:border-b-0">
      <span className="text-ink-2">{lbl}</span>
      <span
        className="font-mono text-[11.5px] text-ink bg-paper px-2 py-[3px] rounded-[5px] tracking-[0.04em] border border-[var(--color-line)]"
        style={style}
      >
        {val}
      </span>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />

        <div className="relative max-w-[1280px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Security &amp; trust
          </div>
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-14 items-end">
            <div>
              <div className="eyebrow">Security &amp; trust</div>
              <h1 className="font-sans font-medium text-[clamp(46px,5.4vw,76px)] leading-[1.04] tracking-[-0.022em] mt-4 mb-4 text-balance ">
                Your data. <em>Your environment.</em>
                <br />
                Your audit log.
              </h1>
              <p className="text-[19px] leading-[1.55] text-ink-2 max-w-[560px] m-0">
                Most &quot;AI for business&quot; tools route your client data through a
                multi-tenant cloud you don&apos;t control, with a &quot;trust us&quot; attached.
                We don&apos;t. Each firm gets a private deployment, every action is logged and
                reversible, and sensitive work waits for partner approval. The default posture is
                paranoid.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-[var(--color-line)] pt-6">
                {[
                  { k: 'Deployment', v: <><em className="text-signal not-italic font-sans italic">Private</em> per firm</> },
                  { k: 'Audit log', v: <><em className="text-signal not-italic font-sans italic">Every</em> action recorded</> },
                  { k: 'Encryption', v: <>At rest &amp; in transit</> },
                  { k: 'Compliance', v: <><em className="text-signal not-italic font-sans italic">SOC 2</em> readiness posture</> },
                ].map((b) => (
                  <div
                    key={b.k}
                    className="bg-white border border-[var(--color-line)] rounded-xl px-4 py-3.5 flex flex-col gap-1"
                  >
                    <span className="font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">
                      {b.k}
                    </span>
                    <span className="font-sans font-semibold text-[18px] text-ink tracking-[-0.005em]">
                      {b.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="py-16 bg-white border-y border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-end mb-8">
            <div>
              <div className="eyebrow">Three trust principles</div>
              <h2 className="font-sans font-medium text-[clamp(34px,3.6vw,48px)] leading-[1.05] tracking-[-0.02em] mt-2 text-balance ">
                How we think about your data — <em>before</em> any feature decision.
              </h2>
            </div>
            <p className="text-base text-ink-2 leading-[1.5] m-0 max-w-[480px] justify-self-end text-right">
              We&apos;ve thrown out features that violated any of these. They&apos;re
              load-bearing, not aspirational.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {PRINCIPLES.map((p) => (
              <div
                key={p.n}
                className="bg-paper border border-[var(--color-line)] rounded-[14px] p-[22px] flex flex-col gap-2 relative"
              >
                <div
                  className="font-mono font-semibold text-[34px] leading-[0.9]"
                  style={{ color: 'var(--color-signal)' }}
                >
                  {p.n}
                </div>
                <h4 className="font-sans font-medium text-[18px] tracking-[-0.01em] m-0 leading-[1.25] ">
                  {p.title}
                </h4>
                <p className="m-0 text-[13.5px] leading-[1.5] text-ink-2">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 01 — Deployment */}
      <section id="deployment" className="py-20 border-b border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal font-medium mb-2">
                01 / Deployment
              </div>
              <h3 className="font-sans font-medium text-[clamp(30px,3.4vw,44px)] leading-[1.05] tracking-[-0.018em] m-0 mb-4 text-balance ">
                Where your data <em>actually</em> lives.
              </h3>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                We deploy a dedicated environment for every firm. Your operator, your memory
                store, your connector credentials, your audit trail — all live in compute that
                belongs to your engagement and nobody else&apos;s.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">What that means in practice:</strong> if
                a vulnerability hit one customer&apos;s deployment, it does not reach yours. If a
                different customer corrupts their memory store, you don&apos;t see it. There is
                no shared brain.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">You choose where it sits.</strong>{' '}
                Default is our managed infrastructure (US-East or US-West). For firms with
                compliance constraints — HIPAA-leaning, regulated finance, public-sector — we
                deploy into your own AWS / GCP / Azure account or your on-prem hardware on the
                same five-day timeline.
              </p>
              <div
                className="font-sans text-[19px] leading-[1.45] text-ink pl-[18px] mt-5"
                style={{ borderLeft: '2px solid var(--color-signal)' }}
              >
                &quot;Multi-tenant SaaS is fine for a notes app. It is not fine for client charts
                and engagement letters.&quot;
              </div>
            </div>
            <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 flex flex-col gap-3.5">
              <h5 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase font-medium m-0">
                Deployment posture
              </h5>
              <div>
                {DEPLOY_ROWS.map((r) => (
                  <VRow key={r.lbl} lbl={r.lbl} val={r.val} kind={r.kind} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02 — Access & roles */}
      <section id="rbac" className="py-20 bg-white border-b border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal font-medium mb-2">
                02 / Access &amp; roles
              </div>
              <h3 className="font-sans font-medium text-[clamp(30px,3.4vw,44px)] leading-[1.05] tracking-[-0.018em] m-0 mb-4 text-balance ">
                Who can see <em>what</em>, and what can run.
              </h3>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                The operator inherits your firm&apos;s hierarchy. Front desk doesn&apos;t see
                partner-only matters. Associates can&apos;t approve their own engagement letters.
                The intern can&apos;t trigger the &quot;send to all clients&quot; playbook.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">Per-channel scope.</strong> Each playbook
                is bound to specific channels and specific roles. A playbook in{' '}
                <code className="font-mono text-[13px] bg-paper px-1.5 py-px rounded">
                  #partners-only
                </code>{' '}
                never reads from{' '}
                <code className="font-mono text-[13px] bg-paper px-1.5 py-px rounded">
                  #general
                </code>{' '}
                and never writes into{' '}
                <code className="font-mono text-[13px] bg-paper px-1.5 py-px rounded">
                  #client-x
                </code>
                .
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">Approval chains.</strong> Sensitive
                actions can require N-of-M approval — e.g. partner OR senior associate for
                engagement letters, two partners for any wire over $25k.
              </p>
              <div
                className="font-sans text-[19px] leading-[1.45] text-ink pl-[18px] mt-5"
                style={{ borderLeft: '2px solid var(--color-signal)' }}
              >
                &quot;I want my front desk to file the claim. I do not want my front desk to
                refund anyone.&quot;
              </div>
            </div>
            <div className="bg-paper border border-[var(--color-line)] rounded-[18px] p-6">
              <h5 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase font-medium m-0 mb-3.5">
                Example: a 14-person dental practice
              </h5>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['Action', 'Front desk', 'Hygienist', 'Doctor'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase font-medium border-b border-[var(--color-line)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RBAC.map((r, i) => (
                    <tr key={r.action}>
                      <td
                        className="px-3 py-2.5 font-sans text-sm text-ink"
                        style={{
                          borderBottom: i === RBAC.length - 1 ? 'none' : '1px solid var(--color-line)',
                        }}
                      >
                        {r.action}
                      </td>
                      {r.cells.map((c, j) => {
                        let cls = ''
                        let content: React.ReactNode = '—'
                        if (c.kind === 'y') {
                          cls = 'font-medium'
                          content = '●'
                        } else if (c.kind === 'a') {
                          cls = 'font-sans italic'
                          content = 'approve'
                        } else {
                          cls = 'text-muted'
                        }
                        const color =
                          c.kind === 'y'
                            ? 'var(--color-ok)'
                            : c.kind === 'a'
                            ? 'var(--color-signal)'
                            : undefined
                        return (
                          <td
                            key={j}
                            className={`px-3 py-2.5 text-[13px] ${cls}`}
                            style={{
                              color,
                              borderBottom:
                                i === RBAC.length - 1 ? 'none' : '1px solid var(--color-line)',
                            }}
                          >
                            {content}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — Audit */}
      <section id="audit" className="py-20 border-b border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal font-medium mb-2">
                03 / Audit log
              </div>
              <h3 className="font-sans font-medium text-[clamp(30px,3.4vw,44px)] leading-[1.05] tracking-[-0.018em] m-0 mb-4 text-balance ">
                Every action <em>recorded.</em>
              </h3>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                Read, write, send, fail, retry, approve, reject. Each entry carries who triggered
                it, what it touched, why it ran, and the resulting artifacts. Searchable in the
                dashboard. Exportable as CSV or JSON for your auditor.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">Reversible by default.</strong> The
                operator auto-snapshots its working state before every file change. Any individual
                action can be undone with{' '}
                <code className="font-mono text-[13px] bg-paper px-1.5 py-px rounded">
                  /rollback
                </code>
                . The full-text session index is the searchable layer underneath the dashboard.
                None of this is bolted on — it&apos;s how the runtime works by default.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0">
                <strong className="text-ink font-medium">Compliant retention.</strong> Logs
                retained for the period your industry requires — 7 years for tax practices, 10
                for legal, indefinite if you tell us so. Stored in your environment, not ours.
              </p>
            </div>
            <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 flex flex-col gap-3.5">
              <h5 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase font-medium m-0">
                Audit log · last 24 hours · #front-desk
              </h5>
              <div className="font-mono text-[11.5px] leading-[1.65] text-ink-2">
                {LOG.map((l, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[80px_1fr] gap-3.5 py-1.5 items-start"
                    style={{
                      borderBottom: i === LOG.length - 1 ? 'none' : '1px dashed var(--color-line)',
                    }}
                  >
                    <span className="text-muted text-[10.5px] tracking-[0.06em]">{l.ts}</span>
                    <span className="text-ink">{l.what}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 — Compliance */}
      <section id="compliance" className="py-20 bg-white border-b border-[var(--color-line)]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal font-medium mb-2">
                04 / Compliance posture
              </div>
              <h3 className="font-sans font-medium text-[clamp(30px,3.4vw,44px)] leading-[1.05] tracking-[-0.018em] m-0 mb-4 text-balance ">
                What we have, what&apos;s <em>in flight.</em>
              </h3>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                We&apos;re a pre-Series-A company. We will not claim certifications we don&apos;t
                hold. Here&apos;s where everything actually stands, with target dates we&apos;ll
                keep updated.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">HIPAA posture.</strong> The architecture
                is HIPAA-ready: per-firm boundaries, encryption, audit logs, BAA-able
                sub-processors. BAAs are signed at onboarding for any healthcare engagement —
                dental, medical, behavioral health. Full HIPAA
                attestation will follow SOC 2 Type II certification.
              </p>
              <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0 mb-3.5">
                <strong className="text-ink font-medium">What we&apos;ll never claim.</strong>{' '}
                We are not &quot;ISO 27001 certified,&quot; &quot;FedRAMP authorized,&quot; or
                &quot;SOC 2 Type II certified.&quot; We build with these controls in mind and
                will pursue formal certification when our customer base requires it.
              </p>
              <div
                className="font-sans text-[19px] leading-[1.45] text-ink pl-[18px] mt-5"
                style={{ borderLeft: '2px solid var(--color-signal)' }}
              >
                &quot;I&apos;d rather miss a deal than fake a certification.&quot;
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMPLIANCE.map((c) => (
                <div
                  key={c.nm}
                  className="bg-paper border border-[var(--color-line)] rounded-xl p-4 flex flex-col gap-1.5"
                >
                  <span className="font-mono text-[9.5px] tracking-[0.14em] text-signal uppercase font-medium">
                    {c.stat}
                  </span>
                  <span className="font-sans font-medium text-base tracking-[-0.005em]">
                    {c.nm}
                  </span>
                  <p className="text-[12.5px] text-muted leading-[1.4] m-0">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[88px]">
        <div className="max-w-[1280px] mx-auto px-8">
          <h2 className="font-sans font-medium text-[clamp(34px,3.8vw,52px)] leading-[1.05] tracking-[-0.02em] m-0 mb-9 text-balance text-center ">
            Questions partners ask <em>before</em> they sign.
          </h2>
          <div className="max-w-[840px] mx-auto flex flex-col gap-0">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="border-b border-[var(--color-line)] py-5 first:border-t group"
              >
                <summary
                  className="flex justify-between items-center font-sans font-medium text-[21px] leading-[1.3] tracking-[-0.005em] text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden "
                >
                  {item.q}
                  <span
                    className="font-mono text-[20px] text-signal ml-4 flex-none leading-none"
                    aria-hidden
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div className="mt-3.5 text-base leading-[1.6] text-ink-2 max-w-[720px]">
                  <p className="m-0">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-[88px] border-t border-[var(--color-line)]"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="eyebrow">For your CISO / compliance lead</div>
              <h2 className="font-sans font-medium text-[clamp(36px,4vw,56px)] leading-[1.04] tracking-[-0.022em] mt-2 mb-4 text-balance ">
                We&apos;ll send the <em>full security packet</em> by close of business.
              </h2>
              <p className="text-[18px] text-ink-2 leading-[1.55] m-0 mb-6 max-w-[520px]">
                Architecture diagram, sub-processor list, DPA, BAA template, security architecture overview,
                pen-test summary, incident-response runbook. One email.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="btn btn-primary btn-lg"
                  href="/contact"
                >
                  Request the security packet →
                </a>
                <a
                  className="btn btn-ghost btn-lg"
                  href="/contact"
                >
                  Or book a call
                </a>
              </div>
            </div>
            <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6">
              <div className="eyebrow" style={{ color: 'var(--color-ink-2)' }}>
                Direct lines
              </div>
              <h4 className="font-sans font-semibold text-[21px] m-0 mt-1.5 mb-1.5 tracking-[-0.005em]">
                Reach the right person.
              </h4>
              <ul className="list-none p-0 m-0 mt-3.5 flex flex-col gap-2 text-sm text-ink-2 leading-[1.5]">
                {[
                  ['Security', 'hello@firmcraft.ai · 24-hr response'],
                  ['Disclosure', 'hello@firmcraft.ai · 90-day fix SLA'],
                  ['DPA / BAA', 'hello@firmcraft.ai'],
                  ['Incident', 'hello@firmcraft.ai · pages on-call'],
                ].map(([k, v], i, arr) => (
                  <li
                    key={k}
                    className="flex gap-2.5 items-start pb-2 last:border-b-0"
                    style={{
                      borderBottom: i === arr.length - 1 ? 'none' : '1px dashed var(--color-line)',
                    }}
                  >
                    <b className="text-ink font-medium min-w-[80px] inline-block font-mono text-[11px] tracking-[0.1em] uppercase">
                      {k}
                    </b>
                    <span>{v}</span>
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
