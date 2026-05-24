import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Brain, Cpu, Zap, MessageSquare, Globe, Wrench, Plug, Sparkles, Clock, ShieldCheck, Users, Server } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClient } from '@/lib/db'
import { getClientConfig } from '@/lib/db/config'

export const dynamic = 'force-dynamic'

export default async function ClientConfigPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id)
  if (!client) notFound()

  const config = await getClientConfig(params.id)

  return (
    <AppShell>
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> {client.name}
      </Link>

      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <div className="eyebrow">Instance configuration</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            {client.name} <em className="text-accent italic">/ config</em>
          </h1>
          <p className="text-ink-2 mt-2 text-[14px]">
            Hermes instance settings{config.vpsIp ? ` · ${config.vpsIp}` : ''}{config.hermesPort ? `:${config.hermesPort}` : ''}
          </p>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="grid gap-6 max-w-[960px]">

        {/* 1. Memory */}
        <ConfigSection
          icon={<Brain className="w-4 h-4" />}
          title="Memory"
          description="Instance-wide and per-user memory limits."
        >
          <ConfigRow label="MEMORY.md limit" value={`${config.memory?.memoryCharLimit ?? 8000} chars`} />
          <ConfigRow label="USER.md limit" value={`${config.memory?.userCharLimit ?? 4000} chars`} />
          <ConfigRow label="Active users (USER.md count)" value={config.memory?.activeUserCount != null ? String(config.memory.activeUserCount) : '—'} muted={config.memory?.activeUserCount == null} />
          <ConfigRow label="Memory providers" value={config.memory?.externalProviders?.join(', ') || 'None'} muted={!config.memory?.externalProviders?.length} />
        </ConfigSection>

        {/* 2. LLM / Provider Routing */}
        <ConfigSection
          icon={<Cpu className="w-4 h-4" />}
          title="LLM / Provider routing"
          description="Model selection, fallback chain, and credential pools."
        >
          <ConfigRow label="Primary model" value={config.llm?.primaryModel ?? '—'} />
          <ConfigRow label="Fallback providers" value={config.llm?.fallbackProviders?.join(' → ') || 'None configured'} muted={!config.llm?.fallbackProviders?.length} />
          <ConfigRow label="Provider whitelist" value={config.llm?.providerWhitelist?.join(', ') || 'All providers'} />
          <ConfigRow label="Provider blacklist" value={config.llm?.providerBlacklist?.join(', ') || 'None'} muted={!config.llm?.providerBlacklist?.length} />
          <ConfigRow label="Credential pools" value={config.llm?.credentialPoolCount != null ? `${config.llm.credentialPoolCount} keys` : '—'} />
          <ConfigRow label="LiteLLM key" value={config.llm?.litellmKeyId ?? '—'} mono />
        </ConfigSection>

        {/* 3. Compression / Cost */}
        <ConfigSection
          icon={<Zap className="w-4 h-4" />}
          title="Compression / Cost"
          description="Context compression and prompt caching settings."
        >
          <ConfigRow label="Compression threshold" value={config.compression?.threshold != null ? String(config.compression.threshold) : '0.50'} sub={config.compression?.threshold != null && config.compression.threshold < 0.85 ? 'Consider raising to 0.85 for cost savings' : undefined} />
          <ConfigRow label="Compression provider" value={config.compression?.provider ?? 'auto (inherits primary)'} />
          <ConfigRow label="Compression model" value={config.compression?.model ?? 'auto (inherits primary)'} />
          <ConfigRow label="Prompt cache TTL" value={config.compression?.cacheTtl ?? '5m'} />
        </ConfigSection>

        {/* 4. Channels */}
        <ConfigSection
          icon={<MessageSquare className="w-4 h-4" />}
          title="Channels"
          description="Messaging platforms connected to this instance."
        >
          {config.channels?.length ? (
            <div className="grid gap-2">
              {config.channels.map((ch) => (
                <div key={ch.platform} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                  <div className="flex items-center gap-2">
                    <ChannelDot enabled={ch.enabled} />
                    <span className="text-[14px] text-ink">{ch.platform}</span>
                  </div>
                  <span className="text-[12px] text-muted font-mono-warm">{ch.enabled ? 'connected' : 'disabled'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">No channels configured yet.</p>
          )}
        </ConfigSection>

        {/* 5. Browser Tools */}
        <ConfigSection
          icon={<Globe className="w-4 h-4" />}
          title="Browser tools"
          description="Headless browser for web automation where no API exists."
        >
          <ConfigRow label="Status" value={config.browser?.enabled ? 'Enabled' : 'Disabled'} badge={config.browser?.enabled ? 'up' : 'down'} />
          <ConfigRow label="Backend" value={config.browser?.backend ?? '—'} />
          <ConfigRow label="Chromium path" value={config.browser?.chromiumPath ?? '—'} mono muted={!config.browser?.chromiumPath} />
        </ConfigSection>

        {/* 6. Tools / Toolsets */}
        <ConfigSection
          icon={<Wrench className="w-4 h-4" />}
          title="Tools / Toolsets"
          description="40+ built-in tools across 20+ toolsets."
        >
          {config.toolsets?.length ? (
            <div className="flex flex-wrap gap-2">
              {config.toolsets.map((t) => (
                <span key={t.name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] border ${t.enabled ? 'border-accent-2/40 bg-accent-2/5 text-ink' : 'border-line bg-paper text-muted line-through'}`}>
                  {t.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Using default toolset (hermes-cli).</p>
          )}
        </ConfigSection>

        {/* 7. MCP Integrations */}
        <ConfigSection
          icon={<Plug className="w-4 h-4" />}
          title="MCP integrations"
          description="Connected MCP servers for external tool access."
        >
          {config.mcpServers?.length ? (
            <div className="grid gap-2">
              {config.mcpServers.map((s) => (
                <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                  <div>
                    <span className="text-[14px] text-ink">{s.name}</span>
                    {s.transport && <span className="text-[11.5px] text-muted ml-2">({s.transport})</span>}
                  </div>
                  <ChannelDot enabled={s.connected} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">No MCP servers connected.</p>
          )}
        </ConfigSection>

        {/* 8. Skills */}
        <ConfigSection
          icon={<Sparkles className="w-4 h-4" />}
          title="Custom skills"
          description="Skills active on this instance."
        >
          <ConfigRow label="Active skills" value={config.skills?.activeCount != null ? String(config.skills.activeCount) : '0'} />
          {config.skills?.list?.length ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {config.skills.list.map((s) => (
                <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-md text-[12.5px] border border-accent/30 bg-accent/5 text-ink">
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </ConfigSection>

        {/* 9. Scheduling */}
        <ConfigSection
          icon={<Clock className="w-4 h-4" />}
          title="Scheduling"
          description="Cron jobs and scheduled tasks."
        >
          <ConfigRow label="Active jobs" value={config.scheduling?.activeJobs != null ? String(config.scheduling.activeJobs) : '—'} />
          <ConfigRow label="Paused jobs" value={config.scheduling?.pausedJobs != null ? String(config.scheduling.pausedJobs) : '—'} />
        </ConfigSection>

        {/* 10. Approvals */}
        <ConfigSection
          icon={<ShieldCheck className="w-4 h-4" />}
          title="Approvals"
          description="Per-action approval rules and workflows."
        >
          <ConfigRow label="Approval rules" value={config.approvals?.ruleCount != null ? `${config.approvals.ruleCount} rules` : 'Default (dangerous actions only)'} />
          <ConfigRow label="Require approval for" value={config.approvals?.requireApprovalFor?.join(', ') || 'File changes, external sends, purchases'} />
        </ConfigSection>

        {/* 11. Subagents */}
        <ConfigSection
          icon={<Users className="w-4 h-4" />}
          title="Subagents"
          description="Concurrent child agent delegation."
        >
          <ConfigRow label="Max concurrent" value={String(config.subagents?.maxConcurrent ?? 3)} />
          <ConfigRow label="Toolset restrictions" value={config.subagents?.toolsetRestrictions?.join(', ') || 'Inherits parent toolset'} />
        </ConfigSection>

        {/* 12. Infrastructure */}
        <ConfigSection
          icon={<Server className="w-4 h-4" />}
          title="Infrastructure"
          description="VPS, container, and service health."
        >
          <ConfigRow label="VPS IP" value={config.vpsIp ?? '—'} mono />
          <ConfigRow label="Hermes port" value={config.hermesPort != null ? String(config.hermesPort) : '—'} mono />
          <ConfigRow label="Container" value={config.infrastructure?.containerStatus ?? '—'} badge={config.infrastructure?.containerStatus === 'running' ? 'up' : config.infrastructure?.containerStatus === 'stopped' ? 'down' : undefined} />
          <ConfigRow label="Hermes version" value={config.infrastructure?.hermesVersion ?? '—'} />
          <ConfigRow label="Last health check" value={config.infrastructure?.lastHealthCheck ?? '—'} />
        </ConfigSection>

        <p className="text-[12px] text-muted text-center py-4">
          Configuration is read-only. Changes are applied via SSH to the Hermes instance.
        </p>
      </div>
    </AppShell>
  )
}

/* ── Sub-components ── */

function ConfigSection({ icon, title, description, children }: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="px-6 py-5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-accent-2">{icon}</span>
          <h3 className="font-serif-warm text-[22px] tracking-[-0.01em]">{title}</h3>
        </div>
        <p className="text-[13px] text-muted mt-1">{description}</p>
      </div>
      <CardBody>{children}</CardBody>
    </Card>
  )
}

function ConfigRow({ label, value, sub, mono, muted, badge }: {
  label: string
  value: string
  sub?: string
  mono?: boolean
  muted?: boolean
  badge?: 'up' | 'down'
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-line/50 last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <div className="text-right">
        <span className={`text-[14px] ${mono ? 'font-mono-warm text-[12.5px]' : ''} ${muted ? 'text-muted' : 'text-ink'}`}>
          {badge && <StatusDot status={badge} />}
          {value}
        </span>
        {sub && <div className="text-[11.5px] text-accent mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ChannelDot({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${enabled ? 'bg-status-up' : 'bg-line'}`} />
  )
}

function StatusDot({ status }: { status: 'up' | 'down' }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${status === 'up' ? 'bg-status-up' : 'bg-status-down'}`} />
  )
}
