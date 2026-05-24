import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Settings as SettingsIcon, ExternalLink, Handshake, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, CardBody } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClient, getClientSkills, getInfrastructureStatus } from '@/lib/db'
import { getPartnerForClient } from '@/lib/mock-partners'
import { planMeta } from '@/lib/survey'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id)
  if (!client) notFound()

  const [skills, infrastructure] = await Promise.all([
    getClientSkills(client.id),
    getInfrastructureStatus(client.id),
  ])

  const plan = planMeta[client.planTier]
  const usagePct = Math.round((client.usage.aiCallsThisMonth / client.usage.aiCallsLimit) * 100)
  const seatPct = Math.round((client.usage.activeUsers / client.usage.seats) * 100)
  const survey = client.survey
  const partner = getPartnerForClient(client.id)

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
          <Link href={`/clients/${client.id}/config`}>
            <Button variant="ghost">
              <SlidersHorizontal className="w-4 h-4" />
              Configuration
            </Button>
          </Link>
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
        <Stat
          label="Partner"
          value={partner ? partner.name : 'Direct'}
          sub={partner ? `${Math.round(partner.commissionRate * 100)}% commission` : 'no partner attached'}
          href={partner ? `/partners/${partner.id}` : undefined}
        />
        <Stat label="Created" value={formatDate(client.createdAt)} sub={`tenant id: ${client.id}`} />
      </div>

      {partner ? (
        <div className="mb-8">
          <Link
            href={`/partners/${partner.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-paper-2/50 hover:border-ink hover:bg-paper-2 transition-colors text-[13.5px]"
          >
            <Handshake className="w-4 h-4 text-accent-2" />
            <span className="text-ink-2">
              Sourced by{' '}
              <span className="font-medium text-ink">{partner.name}</span> ·{' '}
              <span className="text-muted">{partner.contactEmail}</span>
            </span>
          </Link>
        </div>
      ) : null}

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
                href="#ai-calls"
              />
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[13px] font-medium text-ink">AI spend this month</span>
                <span className="font-serif-warm text-[22px] tracking-[-0.01em] text-ink tabular-nums">
                  {formatCurrency(client.usage.costThisMonth)}
                </span>
              </div>
              <UsageBar
                label="Seats"
                value={client.usage.activeUsers}
                limit={client.usage.seats}
                pct={seatPct}
                href="#seats"
              />
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
                <MiniStat
                  label="Custom skills"
                  value={formatNumber(client.usage.skillsActive)}
                  href="#skills"
                />
                <MiniStat
                  label="Integrations"
                  value={String(client.usage.integrationsConnected)}
                  href="#integrations"
                />
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

      <div className="grid gap-6 mt-8">
        <Card id="ai-calls" className="scroll-mt-24">
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">AI calls</div>
            <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">Usage this month</h3>
          </div>
          <CardBody>
            <div className="text-[14px] text-ink-2">
              <span className="font-mono-warm text-ink">{formatNumber(client.usage.aiCallsThisMonth)}</span>{' '}
              of {formatNumber(client.usage.aiCallsLimit)} calls used ({usagePct}%) ·{' '}
              source: <span className="font-mono-warm text-ink">usage_events</span>
            </div>
            <div className="text-[12.5px] text-muted mt-2">
              Per-day breakdown and model split coming soon. For now, totals are summed from LiteLLM
              roll-ups for the current calendar month.
            </div>
          </CardBody>
        </Card>

        <Card id="seats" className="scroll-mt-24">
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">Seats</div>
            <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">Active users</h3>
          </div>
          <CardBody>
            <div className="text-[14px] text-ink-2">
              <span className="font-mono-warm text-ink">{client.usage.activeUsers}</span>{' '}
              of {client.usage.seats} seats in use
            </div>
            <div className="text-[12.5px] text-muted mt-2">
              TODO: wire to auth/session data. Today this is a placeholder per plan tier.
            </div>
          </CardBody>
        </Card>

        <Card id="skills" className="scroll-mt-24">
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">Custom skills</div>
            <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
              Skills installed on this tenant
            </h3>
          </div>
          <CardBody className="p-0">
            {skills.length === 0 ? (
              <div className="px-6 py-5 text-muted text-[14px]">No skills installed yet.</div>
            ) : (
              <ul className="divide-y divide-line">
                {skills.map((s) => (
                  <li key={s.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                    <span className="font-mono-warm text-[13.5px] text-ink">{s.skillName}</span>
                    <span
                      className={
                        s.status === 'active'
                          ? 'text-[12px] text-accent-2 font-mono-warm uppercase tracking-[0.12em]'
                          : 'text-[12px] text-muted font-mono-warm uppercase tracking-[0.12em]'
                      }
                    >
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card id="integrations" className="scroll-mt-24">
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">Integrations</div>
            <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
              Connected services
            </h3>
          </div>
          <CardBody className="p-0">
            {infrastructure.length === 0 ? (
              <div className="px-6 py-5 text-muted text-[14px]">No integrations recorded.</div>
            ) : (
              <ul className="divide-y divide-line">
                {infrastructure.map((i) => (
                  <li key={i.id} className="px-6 py-3.5 grid grid-cols-[1fr_auto] gap-4 items-center">
                    <div>
                      <div className="text-[14px] text-ink">{i.serviceName}</div>
                      {i.endpoint ? (
                        <div className="text-[12px] text-muted font-mono-warm mt-0.5 truncate">
                          {i.endpoint}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={
                        i.status === 'up'
                          ? 'text-[12px] text-accent-2 font-mono-warm uppercase tracking-[0.12em]'
                          : i.status === 'down'
                          ? 'text-[12px] text-status-down font-mono-warm uppercase tracking-[0.12em]'
                          : 'text-[12px] text-muted font-mono-warm uppercase tracking-[0.12em]'
                      }
                    >
                      {i.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub: string; href?: string }) {
  const body = (
    <CardBody className="px-5 py-5">
      <div className="font-mono-warm text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="font-serif-warm text-[26px] tracking-[-0.02em] mt-1.5 leading-none truncate">{value}</div>
      <div className="text-[12px] text-muted mt-2 truncate">{sub}</div>
    </CardBody>
  )
  if (href) {
    return (
      <Card className="hover:border-ink transition-colors">
        <Link href={href} className="block">{body}</Link>
      </Card>
    )
  }
  return <Card>{body}</Card>
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

function UsageBar({
  label,
  value,
  limit,
  pct,
  href,
}: {
  label: string
  value: number
  limit: number
  pct: number
  href?: string
}) {
  const tone = pct > 85 ? 'bg-status-down' : pct > 60 ? 'bg-accent' : 'bg-accent-2'
  const body = (
    <>
      <div className="flex justify-between items-baseline">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[12.5px] text-muted tabular-nums">
          {formatNumber(value)} / {formatNumber(limit)} ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2 bg-paper rounded-full overflow-hidden border border-line">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </>
  )
  if (href) {
    return (
      <a href={href} className="block -mx-2 px-2 py-1 rounded-md hover:bg-paper transition-colors">
        {body}
      </a>
    )
  }
  return <div>{body}</div>
}

function MiniStat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <div className="font-mono-warm text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1 leading-none">{value}</div>
    </>
  )
  if (href) {
    return (
      <a href={href} className="block -mx-2 px-2 py-1 rounded-md hover:bg-paper transition-colors">
        {body}
      </a>
    )
  }
  return <div>{body}</div>
}
