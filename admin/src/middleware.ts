import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ---------------------------------------------------------------------------
// Subdomain routing (architecture §1.6)
//
// One Next.js deployment serves three surfaces, distinguished by the request
// host:
//
//   admin.firmcraft.ai      → Firmcraft's INTERNAL back office (this app's
//                             existing pages). Never customer-facing.
//   {slug}.firmcraft.ai     → a single contractor's WHITE-LABELED client app,
//                             scoped to exactly one tenant by the subdomain.
//   app.firmcraft.ai        → generic pre-auth login/landing; after sign-in the
//                             user is sent to their own {slug}.firmcraft.ai.
//
// The subdomain is a ROUTING / white-labeling mechanism, NOT a security
// boundary — Postgres RLS remains the hard boundary (§1.5). Downstream route
// handlers read the resolved tenant from the `x-tenant-slug` / `x-tenant-id`
// request headers set here.
//
// `custom_domain` resolution (a contractor pointing their own domain at their
// dashboard) is a future Pro-tier upsell and intentionally deferred — the
// column exists so the fallback lookup can be added here later without a schema
// change.
// ---------------------------------------------------------------------------

const ROOT_DOMAIN = 'firmcraft.ai'

// Hosts that are NOT tenant subdomains. They keep their own routes/projects and
// must never be shadowed by the wildcard `*.firmcraft.ai` record.
const RESERVED_SUBDOMAINS = new Set([
  'admin', 'app', 'www', 'llm', 'langfuse', 'partners', 'status', '',
])

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-in(.*)',
  '/api/health',
  '/api/health/beacon',
  // Public in middleware, but the route enforces Clerk-session-or-bearer-token
  // itself (so the Hermes client-health skill can read it server-to-server).
  '/api/health/clients',
  '/api/stripe/webhook',
  '/api/outreach/track/(.*)',
  '/api/outreach/unsubscribe/(.*)',
  '/status',
  '/unsubscribe',
])

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
)

type Surface = 'internal-admin' | 'login-app' | 'reserved' | 'tenant-client' | 'local'

/** Classify the request host into one of the deployment surfaces. */
function classifyHost(host: string): { surface: Surface; sub: string } {
  const hostname = (host.split(':')[0] || '').toLowerCase()

  // Bare apex / www → marketing-ish; treat as reserved passthrough.
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return { surface: 'reserved', sub: 'www' }
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, hostname.length - (ROOT_DOMAIN.length + 1)).split('.')[0]
    if (sub === 'admin') return { surface: 'internal-admin', sub }
    if (sub === 'app') return { surface: 'login-app', sub }
    if (RESERVED_SUBDOMAINS.has(sub)) return { surface: 'reserved', sub }
    return { surface: 'tenant-client', sub }
  }

  // localhost, *.vercel.app previews, anything not under firmcraft.ai.
  return { surface: 'local', sub: '' }
}

// In-memory slug→tenantId cache, scoped to a single edge instance. `null` is a
// cached "unknown slug" so we don't re-hit the DB for bogus hosts on every
// request. Short TTL so a freshly-provisioned tenant resolves within a minute.
const tenantCache = new Map<string, { id: string | null; exp: number }>()
const TENANT_TTL_MS = 60_000

/** Resolve a tenant slug to its id via the Supabase REST API (service key, server-only). */
async function resolveTenantId(slug: string): Promise<string | null> {
  const now = Date.now()
  const hit = tenantCache.get(slug)
  if (hit && hit.exp > now) return hit.id

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  try {
    const res = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      },
    )
    if (!res.ok) return hit?.id ?? null // soft-fail to last known value
    const rows = (await res.json()) as Array<{ id: string }>
    const id = rows[0]?.id ?? null
    tenantCache.set(slug, { id, exp: now + TENANT_TTL_MS })
    return id
  } catch {
    return hit?.id ?? null
  }
}

/** Build a NextResponse that forwards the resolved tenant to route handlers. */
function withTenantHeaders(req: NextRequest, slug: string, tenantId: string): NextResponse {
  const headers = new Headers(req.headers)
  headers.set('x-tenant-slug', slug)
  headers.set('x-tenant-id', tenantId)
  return NextResponse.next({ request: { headers } })
}

async function handle(
  req: NextRequest,
  authState: { userId: string | null; tenantClaim: string | null } | null,
): Promise<NextResponse> {
  const host = req.headers.get('host') ?? ''
  const { surface, sub } = classifyHost(host)

  switch (surface) {
    case 'reserved':
    case 'local':
      // Apex/www/llm/langfuse/partners/status and dev hosts: no tenant scoping.
      return NextResponse.next()

    case 'internal-admin':
      // Firmcraft's own panel — existing behavior, gated below by Clerk.
      return NextResponse.next()

    case 'login-app': {
      // Generic login/landing. After auth, bounce the user to their own
      // {slug}.firmcraft.ai if their JWT carries a tenant. (Slug-from-tenant
      // lookup is a Sprint-2 refinement; for now we only avoid trapping an
      // authenticated user on the generic host.)
      return NextResponse.next()
    }

    case 'tenant-client': {
      const tenantId = await resolveTenantId(sub)
      if (!tenantId) {
        // Unknown slug → send to marketing rather than render a broken app.
        return NextResponse.redirect(`https://${ROOT_DOMAIN}`)
      }

      // Subdomain ↔ Clerk-JWT consistency (§9.3): a user authenticated for one
      // tenant must not operate on another tenant's subdomain. Enforced only
      // when a tenant claim is actually present; RLS is the hard backstop.
      if (
        authState?.userId &&
        authState.tenantClaim &&
        authState.tenantClaim !== tenantId
      ) {
        return NextResponse.redirect(`https://app.${ROOT_DOMAIN}`)
      }

      return withTenantHeaders(req, sub, tenantId)
    }
  }
}

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      const { userId, sessionClaims } = await auth()
      const tenantClaim =
        ((sessionClaims as Record<string, unknown> | null)?.tenant_id as string | undefined) ??
        null

      const routed = await handle(req, { userId, tenantClaim })

      // Auth gate: protected routes require a signed-in user (unchanged from the
      // prior middleware). Tenant headers from `routed` are preserved.
      if (!isPublicRoute(req) && !userId) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return routed
    })
  : function noopMiddleware(req: NextRequest) {
      // Clerk not configured (local/dev without keys): still resolve tenant
      // headers so the client app behaves, but skip auth gating.
      return handle(req, null)
    }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
