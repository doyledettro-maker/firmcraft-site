export type ServiceStatus = 'up' | 'degraded' | 'down'

export type ServiceCheck = {
  id: string
  name: string
  url: string
  description: string
  status: ServiceStatus
  latencyMs: number | null
  httpStatus: number | null
  error: string | null
  checkedAt: string
}

export type ServiceTarget = {
  id: string
  name: string
  description: string
  url: string
  // If set, response body must contain one of these substrings to be "up"
  expectBody?: string[]
  // Treat any 2xx as up if true, otherwise require status === 200
  acceptAny2xx?: boolean
  timeoutMs?: number
}

export const SERVICE_TARGETS: ServiceTarget[] = [
  {
    id: 'litellm',
    name: 'LiteLLM Proxy',
    description: 'Model routing gateway (llm.firmcraft.ai)',
    url: 'https://llm.firmcraft.ai/health/liveliness',
    acceptAny2xx: true,
    timeoutMs: 8000,
  },
  {
    id: 'langfuse',
    name: 'Langfuse',
    description: 'Observability + tracing (langfuse.firmcraft.ai)',
    url: 'https://langfuse.firmcraft.ai/api/public/health',
    acceptAny2xx: true,
    timeoutMs: 8000,
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    description: 'Firmcraft sales agent (firmcraft.firmcraft.ai)',
    url: 'https://firmcraft.firmcraft.ai/',
    acceptAny2xx: true,
    timeoutMs: 8000,
  },
  {
    id: 'admin',
    name: 'Admin Dashboard',
    description: 'admin.firmcraft.ai (Vercel)',
    url: 'https://admin.firmcraft.ai/',
    acceptAny2xx: true,
    timeoutMs: 8000,
  },
  {
    id: 'marketing',
    name: 'Marketing Site',
    description: 'firmcraft.ai (Vercel)',
    url: 'https://firmcraft.ai/',
    acceptAny2xx: true,
    timeoutMs: 8000,
  },
]

export async function checkService(target: ServiceTarget): Promise<ServiceCheck> {
  const checkedAt = new Date().toISOString()
  const started = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), target.timeoutMs ?? 8000)

  try {
    const res = await fetch(target.url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'user-agent': 'firmcraft-admin-healthcheck/1.0' },
      cache: 'no-store',
    })
    const latencyMs = Date.now() - started
    let bodyOk = true
    if (target.expectBody && target.expectBody.length > 0) {
      const text = await res.text().catch(() => '')
      bodyOk = target.expectBody.some((needle) => text.includes(needle))
    }

    const httpOk = target.acceptAny2xx ? res.status >= 200 && res.status < 300 : res.status === 200
    const status: ServiceStatus = httpOk && bodyOk ? (latencyMs > 3000 ? 'degraded' : 'up') : 'down'

    return {
      id: target.id,
      name: target.name,
      url: target.url,
      description: target.description,
      status,
      latencyMs,
      httpStatus: res.status,
      error: httpOk && bodyOk ? null : `HTTP ${res.status}${bodyOk ? '' : ' (body check failed)'}`,
      checkedAt,
    }
  } catch (err) {
    const latencyMs = Date.now() - started
    const message = err instanceof Error ? err.message : String(err)
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      description: target.description,
      status: 'down',
      latencyMs,
      httpStatus: null,
      error: message,
      checkedAt,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function checkAllServices(): Promise<ServiceCheck[]> {
  return Promise.all(SERVICE_TARGETS.map(checkService))
}

export function overallStatus(checks: ServiceCheck[]): ServiceStatus {
  if (checks.some((c) => c.status === 'down')) return 'down'
  if (checks.some((c) => c.status === 'degraded')) return 'degraded'
  return 'up'
}
