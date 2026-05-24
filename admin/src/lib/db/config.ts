import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/* ── Types ── */

export type ChannelConfig = {
  platform: string
  enabled: boolean
}

export type ToolsetConfig = {
  name: string
  enabled: boolean
}

export type McpServerConfig = {
  name: string
  transport?: string
  connected: boolean
}

export type ClientConfig = {
  clientId: string
  vpsIp: string | null
  hermesPort: number | null

  memory: {
    memoryCharLimit: number
    userCharLimit: number
    activeUserCount: number | null
    externalProviders: string[]
  }

  llm: {
    primaryModel: string | null
    fallbackProviders: string[]
    providerWhitelist: string[]
    providerBlacklist: string[]
    credentialPoolCount: number | null
    litellmKeyId: string | null
  }

  compression: {
    threshold: number | null
    provider: string | null
    model: string | null
    cacheTtl: string | null
  }

  channels: ChannelConfig[]

  browser: {
    enabled: boolean
    backend: string | null
    chromiumPath: string | null
  }

  toolsets: ToolsetConfig[]

  mcpServers: McpServerConfig[]

  skills: {
    activeCount: number | null
    list: string[]
  }

  scheduling: {
    activeJobs: number | null
    pausedJobs: number | null
  }

  approvals: {
    ruleCount: number | null
    requireApprovalFor: string[]
  }

  subagents: {
    maxConcurrent: number
    toolsetRestrictions: string[]
  }

  infrastructure: {
    containerStatus: string | null
    hermesVersion: string | null
    lastHealthCheck: string | null
  }
}

/* ── Row type (Supabase) ── */

type ConfigRow = {
  id: string
  client_id: string
  config: Record<string, unknown>
  updated_at: string
}

/* ── Default config ── */

function defaultConfig(clientId: string): ClientConfig {
  return {
    clientId,
    vpsIp: null,
    hermesPort: null,
    memory: { memoryCharLimit: 8000, userCharLimit: 4000, activeUserCount: null, externalProviders: [] },
    llm: { primaryModel: null, fallbackProviders: [], providerWhitelist: [], providerBlacklist: [], credentialPoolCount: null, litellmKeyId: null },
    compression: { threshold: null, provider: null, model: null, cacheTtl: null },
    channels: [],
    browser: { enabled: false, backend: null, chromiumPath: null },
    toolsets: [],
    mcpServers: [],
    skills: { activeCount: null, list: [] },
    scheduling: { activeJobs: null, pausedJobs: null },
    approvals: { ruleCount: null, requireApprovalFor: [] },
    subagents: { maxConcurrent: 3, toolsetRestrictions: [] },
    infrastructure: { containerStatus: null, hermesVersion: null, lastHealthCheck: null },
  }
}

/* ── Merge stored JSON into typed config, pulling vps_ip/hermes_port from clients table ── */

function rowToConfig(row: ConfigRow, vpsIp: string | null, hermesPort: number | null): ClientConfig {
  const c = row.config as Record<string, unknown>
  const base = defaultConfig(row.client_id)
  base.vpsIp = vpsIp
  base.hermesPort = hermesPort

  // Merge each section from stored JSONB
  if (c.memory && typeof c.memory === 'object') Object.assign(base.memory, c.memory)
  if (c.llm && typeof c.llm === 'object') Object.assign(base.llm, c.llm)
  if (c.compression && typeof c.compression === 'object') Object.assign(base.compression, c.compression)
  if (Array.isArray(c.channels)) base.channels = c.channels as ChannelConfig[]
  if (c.browser && typeof c.browser === 'object') Object.assign(base.browser, c.browser)
  if (Array.isArray(c.toolsets)) base.toolsets = c.toolsets as ToolsetConfig[]
  if (Array.isArray(c.mcpServers)) base.mcpServers = c.mcpServers as McpServerConfig[]
  if (c.skills && typeof c.skills === 'object') Object.assign(base.skills, c.skills)
  if (c.scheduling && typeof c.scheduling === 'object') Object.assign(base.scheduling, c.scheduling)
  if (c.approvals && typeof c.approvals === 'object') Object.assign(base.approvals, c.approvals)
  if (c.subagents && typeof c.subagents === 'object') Object.assign(base.subagents, c.subagents)
  if (c.infrastructure && typeof c.infrastructure === 'object') Object.assign(base.infrastructure, c.infrastructure)

  return base
}

/* ── Public API ── */

export async function getClientConfig(clientId: string): Promise<ClientConfig> {
  if (!isSupabaseConfigured()) return defaultConfig(clientId)

  const db = getSupabaseAdmin()

  // Fetch config + client info in parallel
  const [configResult, clientResult] = await Promise.all([
    db.from('client_config').select('*').eq('client_id', clientId).maybeSingle(),
    db.from('clients').select('vps_ip, hermes_port, litellm_key_id').eq('id', clientId).maybeSingle(),
  ])

  if (configResult.error) {
    // Table may not exist yet — return defaults
    console.warn(`getClientConfig(${clientId}): ${configResult.error.message}`)
    return defaultConfig(clientId)
  }

  const vpsIp = clientResult.data?.vps_ip ?? null
  const hermesPort = clientResult.data?.hermes_port ?? null
  const litellmKeyId = clientResult.data?.litellm_key_id ?? null

  if (!configResult.data) {
    const base = defaultConfig(clientId)
    base.vpsIp = vpsIp
    base.hermesPort = hermesPort
    base.llm.litellmKeyId = litellmKeyId
    return base
  }

  const config = rowToConfig(configResult.data as ConfigRow, vpsIp, hermesPort)
  config.llm.litellmKeyId = litellmKeyId
  return config
}

export async function upsertClientConfig(
  clientId: string,
  config: Record<string, unknown>,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('upsertClientConfig requires Supabase to be configured.')
  }

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('client_config')
    .upsert(
      { client_id: clientId, config, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    )

  if (error) throw new Error(`upsertClientConfig(${clientId}) failed: ${error.message}`)
}
