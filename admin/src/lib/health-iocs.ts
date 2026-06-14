/**
 * Indicators of compromise for client-VPS health beacons.
 *
 * Post-incident artifact: a client VPS ran a cryptominer + credential-exfil for
 * 11 days before detection. These IOCs let the /health evaluator flag a beacon
 * RED the moment a known-bad outbound endpoint, mining-pool host, or mining port
 * shows up in the beacon's `outbound_remotes`.
 *
 * Keep this list conservative — every entry should be high-signal enough that a
 * match warrants an immediate red alert. Mining-pool substrings match against an
 * endpoint's hostname when the beacon resolved one; IPs and ports match the raw
 * outbound tuple.
 */

/** A single outbound endpoint as summarized by the beacon. */
export type OutboundRemote = {
  ip: string
  port: number
  /** Optional resolved hostname, when the beacon could reverse-resolve it. */
  host?: string | null
}

/** Known-bad destination IPs (exact match). */
export const IOC_BAD_IPS: readonly string[] = [
  '43.228.79.77', // exfil/C2 host from the 2026-06 incident
]

/**
 * Mining-pool host substrings. Matched case-insensitively against an endpoint's
 * resolved hostname (if present). Substrings, not exact hosts, so regional pool
 * subdomains (e.g. `gulf.moneroocean.stream`, `pool.supportxmr.com`) all hit.
 */
export const IOC_MINING_HOST_SUBSTRINGS: readonly string[] = [
  'supportxmr',
  'minexmr',
  'nanopool',
  'xmrpool',
  'moneroocean',
  'pool.minexmr',
  'c3pool',
]

/** Ports overwhelmingly associated with mining-pool stratum endpoints. */
export const IOC_MINING_PORTS: readonly number[] = [3333, 4444, 5555, 7777, 14444]

export type IocMatch = {
  kind: 'ip' | 'host' | 'port'
  /** The IOC value that matched (the bad IP, host substring, or port). */
  indicator: string
  /** The offending endpoint, rendered ip:port (with host when known). */
  endpoint: string
}

function endpointLabel(r: OutboundRemote): string {
  return r.host ? `${r.host} (${r.ip}:${r.port})` : `${r.ip}:${r.port}`
}

/**
 * Match a beacon's outbound endpoints against the IOC list.
 * Returns every distinct match (an endpoint can match on more than one axis).
 */
export function matchIocs(remotes: OutboundRemote[] | null | undefined): IocMatch[] {
  if (!Array.isArray(remotes) || remotes.length === 0) return []
  const matches: IocMatch[] = []
  const seen = new Set<string>()

  const add = (m: IocMatch) => {
    const key = `${m.kind}:${m.indicator}:${m.endpoint}`
    if (seen.has(key)) return
    seen.add(key)
    matches.push(m)
  }

  for (const r of remotes) {
    if (!r || typeof r.ip !== 'string') continue
    const port = Number(r.port)
    const host = typeof r.host === 'string' ? r.host.toLowerCase() : ''

    if (IOC_BAD_IPS.includes(r.ip)) {
      add({ kind: 'ip', indicator: r.ip, endpoint: endpointLabel(r) })
    }
    if (host) {
      for (const sub of IOC_MINING_HOST_SUBSTRINGS) {
        if (host.includes(sub)) {
          add({ kind: 'host', indicator: sub, endpoint: endpointLabel(r) })
        }
      }
    }
    if (Number.isFinite(port) && IOC_MINING_PORTS.includes(port)) {
      add({ kind: 'port', indicator: String(port), endpoint: endpointLabel(r) })
    }
  }

  return matches
}

// ---------------------------------------------------------------------------
// Public-listener classification (P0 exposure)
//
// A public listener (something bound to 0.0.0.0 / :: / a non-loopback IP) is
// only a security concern when the *process* behind it is a direct application.
// A reverse proxy or system service binding a public port is expected — the
// proxy enforces auth, and system services (sshd, resolver) are normal.
// ---------------------------------------------------------------------------

/**
 * Process names that are reverse proxies or system services. A public bind owned
 * by one of these is NOT flagged — auth lives at the proxy, and system listeners
 * are routine. Matched case-insensitively against the leading token of the proc
 * name (so "sshd: /usr/sbin/sshd" or "nginx: worker" still match).
 */
export const PROXY_SYSTEM_PROCS: readonly string[] = [
  'caddy',
  'nginx',
  'traefik',
  'haproxy',
  'envoy',
  'sshd',
  'sshd-session',
  'systemd-resolve',
  'systemd-resolved',
  'systemd',
]

/**
 * Per-client known-good public listeners: intentional direct services that
 * should not alert even though the proc isn't a proxy. Keyed by client id (the
 * uuid the beacon deploys with) OR the host's hostname — either matches, so an
 * entry works before a client has a clients-table row.
 *
 * Each allowed entry matches a listener when:
 *   - { port } only      → that port is allowed regardless of proc
 *   - { proc } only      → that proc substring is allowed on any public port
 *   - { port, proc }     → both must match (tightest, preferred)
 *
 * To add an entry: find the client id (clients table) or the host's hostname
 * (beacon `extra.hostname`), then add `{ port, proc }` for the intentional
 * service under that key. Prefer specifying both port and proc.
 *
 * Example below: Mike / rumblebee's print bridge on 0.0.0.0:8765.
 */
export type AllowedListener = { port?: number; proc?: string }
export const CLIENT_PUBLIC_LISTENER_ALLOWLIST: Readonly<
  Record<string, readonly AllowedListener[]>
> = {
  // Mike Carr / rumblebee (Hermes print bridge — intentional direct service on :8765).
  // The beacon reports the proc as the interpreter ("python3"), so match on port.
  // NOTE: intentional AND Bearer-token authenticated (print_bridge.py — only /healthz
  // is unauth). The poller runs on a dynamic T-Mobile mobile IP, so ufw IP-locking is
  // not viable without breaking printing; the token is the access control.
  // See docs/security/2026-06-13-worldmax-compromise.md.
  // Keyed by both hostname and client uuid so either lookup matches.
  'rumblebee-firmcraft': [{ port: 8765 }],
  '6fba1338-6461-420f-898c-3c8d4af7c3e5': [{ port: 8765 }],
}

/** A public listener as classified by the evaluator. */
export type ClassifiedListener = {
  port: number
  bindAddr: string
  proc: string | null
  /** 'flagged' = security concern; 'allowed' = proxy/system/known-good. */
  verdict: 'flagged' | 'allowed'
  /** Why it was allowed (for the informational UI note). */
  allowReason?: 'proxy-or-system' | 'known-good'
}

function procToken(proc: string | null | undefined): string {
  if (!proc) return ''
  // First whitespace/colon-delimited token, reduced to a basename, lowercased.
  const first = proc.trim().split(/[\s:]+/)[0] ?? ''
  const base = first.split('/').pop() ?? first
  return base.toLowerCase()
}

function isProxyOrSystemProc(proc: string | null | undefined): boolean {
  const tok = procToken(proc)
  if (!tok) return false
  return PROXY_SYSTEM_PROCS.some((p) => tok === p || tok.startsWith(p))
}

function matchesAllowEntry(
  listener: { port: number; proc: string | null },
  entry: AllowedListener,
): boolean {
  // An entry with neither field set matches nothing (avoid an accidental allow-all).
  if (entry.port == null && entry.proc == null) return false
  const portOk = entry.port == null || entry.port === listener.port
  const procOk =
    entry.proc == null ||
    (listener.proc != null && listener.proc.toLowerCase().includes(entry.proc.toLowerCase()))
  return portOk && procOk
}

/**
 * Classify a beacon's public listeners into flagged vs allowed.
 * `keys` are the identifiers to look up in the per-client allowlist (client id
 * and/or hostname) — pass whatever is available.
 */
export function classifyPublicListeners(
  listeners: { port: number; bindAddr: string; proc: string | null }[] | null | undefined,
  keys: (string | null | undefined)[] = [],
): ClassifiedListener[] {
  if (!Array.isArray(listeners) || listeners.length === 0) return []

  // Gather all allowlist entries for any of the provided keys.
  const allowEntries: AllowedListener[] = []
  for (const k of keys) {
    if (!k) continue
    const entries = CLIENT_PUBLIC_LISTENER_ALLOWLIST[k]
    if (entries) allowEntries.push(...entries)
  }

  return listeners.map((l): ClassifiedListener => {
    if (isProxyOrSystemProc(l.proc)) {
      return { ...l, verdict: 'allowed', allowReason: 'proxy-or-system' }
    }
    if (allowEntries.some((e) => matchesAllowEntry(l, e))) {
      return { ...l, verdict: 'allowed', allowReason: 'known-good' }
    }
    return { ...l, verdict: 'flagged' }
  })
}

/** Human-readable reason fragment for a set of IOC matches. */
export function describeIocMatches(matches: IocMatch[]): string {
  if (matches.length === 0) return ''
  const parts = matches.map((m) => {
    if (m.kind === 'ip') return `known-bad IP ${m.indicator} (${m.endpoint})`
    if (m.kind === 'host') return `mining pool "${m.indicator}" (${m.endpoint})`
    return `mining port ${m.indicator} (${m.endpoint})`
  })
  return parts.join('; ')
}
