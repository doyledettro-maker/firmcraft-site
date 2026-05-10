import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Settings as SettingsIcon, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, CardBody } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClient, mockClients } from '@/lib/mock-clients'
import { planMeta } from '@/lib/survey'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

export function generateStaticParams() {
  return mockClients.map((c) => ({ id: c.id }))
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = getClient(params.id)
  if (!client) notFound()

  const plan = planMeta[client.planTier]
  const usagePct = Math.round((client.usage.aiCallsThisMonth / client.usage.aiCallsLimit) * 100)
  const seatPct = Math.round((client.usage.activeUsers / client.usage.seats) * 100)
  const survey = client.survey

  return (
    <AppShell>
      {/* Breadcrumbs */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> All clients
      </Link>

      <div className="flex items-start justify-between gap-6 mb-7 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif-warm text-[40px] leading-[1.05] tracking-[-0.02em]">
              {client.name}
            </h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="text-ink-2 mt-2">
            {client.industry} · {client.contactName} ·{' '}
            <a className="hover:text-ink underline-offset-2 hover:underline" href={`mailto:${client.contactEmail}`}>
              {client.contactEmail}
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${client.id}/settings`}>
            <Button variant="ghost">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Button>Open tenant <ExternalLink className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Plan" value={plan.name} sub={plan.price} />
        <Stat label="MRR" value={formatCurrency(client.monthlyRevenue)} sub="recurring" />
        <Stat label="Created" value={formatDate(client.createdAt)} sub={`tenant id: ${client.id}`} />
        <Stat label="Integrations" value={String(client.usage.integrationsConnected)} sub="connected systems" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Survey responses */}
        <div className="grid gap-6">
          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Survey responses</div>
              <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">Onboarding answers</h3>
            </div>
            <CardBody className="p-0">
              <Section title="Company profile">
                <Row label="Company">{survey.companyName ?? client.name}</Row>
                <Row label="Industry">{survey.industry ?? client.industry}</Row>
                <Row label="Size">{survey.companySize ?? '—'}</Row>
                <Row label="Website">{survey.website ?? '—'}</Row>
                <Row label="Primary contact">
                  {(survey.primaryContactName ?? client.contactName)}
                  {survey.primaryContactRole ? ` · ${survey.primaryContactRole}` : ''}
                </Row>
              </Section>
              <Section title="Tech stack">
                <Row label="CRM">{survey.crm ?? '—'}</Row>
                <Row label="Project management">{survey.projectManagement ?? '—'}</Row>
                <Row label="Communication">{listOrDash(survey.communicationTools)}</Row>
                <Row label="Cloud">{survey.cloudProvider ?? '—'}</Row>
                <Row label="Existing AI tools">{listOrDash(survey.existingAITools)}</Row>
              </Section>
              <Section title="AI readiness">
                <Row label="Technical maturity">{scaleLabel(survey.technicalMaturity)}</Row>
                <Row label="Data infrastructure">{survey.dataInfrastructure ?? '—'}</Row>
                <Row label="Team familiarity">{scaleLabel(survey.teamAIFamiliarity)}</Row>
              </Section>
              <Section title="Use case priorities">
                {survey.useCasePriorities && survey.useCasePriorities.length ? (
                  <ol className="grid gap-1.5 text-[14px]">
                    {survey.useCasePriorities.map((p, i) => (
                      <li key={p} className="flex gap-3">
                        <span className="font-mono-warm text-[11.5px] text-accent w-5">{String(i + 1).padStart(2, '0')}</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Section>
              <Section title="Integrations">
                <Row label="Systems to connect">{listOrDash(survey.systemsToConnect)}</Row>
                <Row label="API availability">{survey.apiAvailability ?? '—'}</Row>
                <Row label="SSO">{survey.ssoProvider ?? '—'}</Row>
                <Row label="Data sources">{listOrDash(survey.dataSources)}</Row>
              </Section>
              <Section title="Security & compliance">
                <Row label="Regulations">{listOrDash(survey.industryRegulations)}</Row>
                <Row label="Data residency">{survey.dataResidency ?? '—'}</Row>
                <Row label="Audit logs required">{survey.auditNeeds ? 'Yes' : 'No'}</Row>
                <Row label="Frameworks">{listOrDash(survey.existingFrameworks)}</Row>
              </Section>
              <Section title="Team & access">
                <Row label="Users">{survey.numberOfUsers || '—'}</Row>
                <Row label="Departments">{listOrDash(survey.departments)}</Row>
                <Row label="Training preference">{survey.trainingPreference ?? '—'}</Row>
              </Section>
              <Section title="Budget & timeline">
                <Row label="Plan">{survey.planTier ? planMeta[survey.planTier].name : '—'}</Row>
                <Row label="Timeline">{survey.implementationTimeline ?? '—'}</Row>
                <Row label="Success metrics">{survey.successMetrics || '—'}</Row>
              </Section>
              <Section title="Communication preferences">
                <Row label="Primary contact method">{survey.primaryContactMethod ?? '—'}</Row>
                <Row label="Update frequency">{survey.updateFrequency ?? '—'}</Row>
              </Section>
              <Section title="Custom requirements" last>
                <Row label="Special needs">{survey.specialNeeds || '—'}</Row>
                <Row label="Priority features">{survey.priorityFeatures || '—'}</Row>
                <Row label="Deal-breakers">{survey.dealBreakers || '—'}</Row>
              </Section>
            </CardBody>
          </Card>
        </div>

        {/* Side panel: usage */}
        <div className="grid gap-6 content-start">
          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Usage this month</div>
              <h3 className="font-serif-warm text-[20px] mt-1 tracking-[-0.01em]">Live tenant stats</h3>
            </div>
            <CardBody className="grid gap-5">
              <UsageBar
                label="AI calls"
                value={client.usage.aiCallsThisMonth}
                limit={client.usage.aiCallsLimit}
                pct={usagePct}
              />
              <UsageBar
                label="Seats"
                value={client.usage.activeUsers}
                limit={client.usage.seats}
                pct={seatPct}
              />
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
                <MiniStat label="Playbooks run" value={formatNumber(client.usage.playbooksRun)} />
                <MiniStat label="Integrations" value={String(client.usage.integrationsConnected)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-5 border-b border-line">
              <div className="eyebrow">Quick actions</div>
            </div>
            <CardBody className="grid gap-2">
              <Button variant="ghost" className="justify-start">Send weekly digest</Button>
              <Button variant="ghost" className="justify-start">Reset onboarding tasks</Button>
              <Button variant="ghost" className="justify-start">Export survey (JSON)</Button>
              <Button variant="danger" className="justify-start">Suspend tenant</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardBody className="px-5 py-5">
        <div className="font-mono-warm text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="font-serif-warm text-[26px] tracking-[-0.02em] mt-1.5 leading-none">{value}</div>
        <div className="text-[12px] text-muted mt-2 truncate">{sub}</div>
      </CardBody>
    </Card>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={`px-6 py-5 ${last ? '' : 'border-b border-line'}`}>
      <div className="eyebrow mb-3">{title}</div>
      <div className="grid gap-2.5">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 text-[14px]">
      <div className="text-muted text-[13px]">{label}</div>
      <div className="text-ink">{children}</div>
    </div>
  )
}

function listOrDash(arr?: string[]) {
  if (!arr || arr.length === 0) return <span className="text-muted">—</span>
  return arr.join(', ')
}

function scaleLabel(n?: number) {
  if (n === undefined) return '—'
  return `${n} / 5`
}

function UsageBar({ label, value, limit, pct }: { label: string; value: number; limit: number; pct: number }) {
  const tone = pct > 85 ? 'bg-[#A23B1F]' : pct > 60 ? 'bg-accent' : 'bg-accent-2'
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[12.5px] text-muted tabular-nums">
          {formatNumber(value)} / {formatNumber(limit)} ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2 bg-paper-2 rounded-full overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1 leading-none">{value}</div>
    </div>
  )
}
