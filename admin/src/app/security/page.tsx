import { AppShell } from '@/components/AppShell'
import { Card, Badge } from '@/components/ui'
import { getSecurityIncidents } from '@/lib/db'
import type { SecurityIncident, IncidentSeverity, IncidentStatus } from '@/lib/db'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Security · Firmcraft Admin' }
export const dynamic = 'force-dynamic'

type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'teal'

const SEVERITY_TONE: Record<IncidentSeverity, Tone> = {
  low: 'neutral',
  medium: 'amber',
  high: 'red',
  critical: 'red',
}

const STATUS_TONE: Record<IncidentStatus, Tone> = {
  open: 'red',
  investigating: 'amber',
  contained: 'amber',
  resolved: 'green',
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      <p className="text-ink-2 text-[14px] leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  )
}

function IocList({ iocs }: { iocs: Record<string, unknown> }) {
  const entries = Object.entries(iocs)
  if (entries.length === 0) return null
  return (
    <div>
      <div className="eyebrow mb-2">Indicators of compromise</div>
      <dl className="grid gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[180px_1fr] gap-3 items-start">
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted pt-0.5">
              {key.replace(/_/g, ' ')}
            </dt>
            <dd className="font-mono text-[12.5px] text-ink-2 break-all">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function IncidentCard({ incident }: { incident: SecurityIncident }) {
  return (
    <Card className="px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone={SEVERITY_TONE[incident.severity]}>{incident.severity}</Badge>
            <Badge tone={STATUS_TONE[incident.status]}>● {incident.status}</Badge>
          </div>
          <h2 className="font-sans font-semibold text-[20px] tracking-[-0.01em] leading-snug">
            {incident.title}
          </h2>
          {incident.affectedHost ? (
            <p className="font-mono text-[12.5px] text-muted mt-1">{incident.affectedHost}</p>
          ) : null}
        </div>
        <div className="text-right font-mono text-[11.5px] text-muted leading-relaxed">
          <div>occurred {formatDate(incident.occurredAt)}</div>
          {incident.resolvedAt ? <div>resolved {formatDate(incident.resolvedAt)}</div> : null}
        </div>
      </div>

      <div className="grid gap-5">
        <Section label="Summary">{incident.summary}</Section>
        {incident.rootCause ? <Section label="Root cause">{incident.rootCause}</Section> : null}
        {incident.remediation ? <Section label="Remediation">{incident.remediation}</Section> : null}
        <IocList iocs={incident.iocs} />
        {incident.docPath ? (
          <p className="font-mono text-[11.5px] text-muted">
            Full writeup: <span className="text-ink-2">{incident.docPath}</span>
          </p>
        ) : null}
      </div>
    </Card>
  )
}

export default async function SecurityPage() {
  const incidents = await getSecurityIncidents()

  return (
    <AppShell>
      <div className="mb-7">
        <div className="eyebrow">Security</div>
        <h1 className="font-sans font-semibold text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Security <em className="text-signal not-italic">incidents</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[640px]">
          Recorded security events affecting Firmcraft-managed infrastructure — what happened, the
          root cause, what we did about it, and the indicators of compromise. The long-form writeup
          for each lives in the repo under <span className="font-mono text-[13px]">docs/security/</span>.
        </p>
      </div>

      {incidents.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-ink-2">No security incidents recorded.</p>
          <p className="text-muted text-[13px] mt-1">
            If this looks wrong, confirm Supabase is configured and the{' '}
            <span className="font-mono">security_incidents</span> migration has been applied.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
