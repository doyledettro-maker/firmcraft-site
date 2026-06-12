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
  // Employee-code sign-in for the Firmcraft Work mobile app — pre-auth by
  // definition; the route does its own throttling and only mints short-lived
  // Clerk sign-in tokens (see the route file for the threat model).
  '/api/mobile/code-login',
  '/api/outreach/track/(.*)',
  '/api/outreach/unsubscribe/(.*)',
  '/status',
  '/unsubscribe',
])

// Sign-in routes that must stay reachable on a tenant subdomain so an
// unauthenticated visitor can authenticate in place (Clerk <SignIn> uses
// routing="path" path="/login"). These render before the tenant auth gate and
// the white-label board fence — otherwise /login would be bounced to /dispatch,
// which redirects back to /login (loop). Kept narrow on purpose.
function isTenantAuthRoute(path: string): boolean {
  return (
    path === '/login' ||
    path.startsWith('/login/') ||
    path === '/sign-in' ||
    path.startsWith('/sign-in/')
  )
}

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

interface TenantRecord {
  id: string
  /** The Clerk organization this tenant maps to 1:1 (tenants.clerk_org_id). */
  clerkOrgId: string
}

// In-memory slug→tenant cache, scoped to a single edge instance. `null` is a
// cached "unknown slug" so we don't re-hit the DB for bogus hosts on every
// request. Short TTL so a freshly-provisioned tenant resolves within a minute.
const tenantCache = new Map<string, { record: TenantRecord | null; exp: number }>()
const TENANT_TTL_MS = 60_000

/** Resolve a tenant slug to its id + Clerk org via the Supabase REST API (service key, server-only). */
async function lookupTenant(slug: string): Promise<TenantRecord | null> {
  const now = Date.now()
  const hit = tenantCache.get(slug)
  if (hit && hit.exp > now) return hit.record

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  try {
    const res = await fetch(
      `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=id,clerk_org_id&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      },
    )
    if (!res.ok) return hit?.record ?? null // soft-fail to last known value
    const rows = (await res.json()) as Array<{ id: string; clerk_org_id: string }>
    const row = rows[0]
    const record: TenantRecord | null = row ? { id: row.id, clerkOrgId: row.clerk_org_id } : null
    tenantCache.set(slug, { record, exp: now + TENANT_TTL_MS })
    return record
  } catch {
    return hit?.record ?? null
  }
}

// The tenant headers are TRUSTED downstream (resolveTenant() in the dispatch
// data layer reads them against the service-role client), so client-supplied
// copies must never survive the middleware. Strip them from EVERY request,
// on every surface, before any routing decision; only withTenantHeaders()
// below may set them.
const TENANT_HEADERS = ['x-tenant-id', 'x-tenant-slug']

function sanitizedHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers)
  for (const h of TENANT_HEADERS) headers.delete(h)
  return headers
}

/** Forward the request with inbound tenant headers stripped and none set. */
function passthrough(req: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: sanitizedHeaders(req) } })
}

/**
 * Build a NextResponse that forwards the resolved tenant to route handlers.
 * When `rewritePath` is given, the request is internally rewritten to that path
 * (URL bar unchanged) — used to render the dispatch board at the tenant root.
 */
function withTenantHeaders(
  req: NextRequest,
  slug: string,
  tenantId: string,
  rewritePath?: string,
): NextResponse {
  const headers = sanitizedHeaders(req)
  headers.set('x-tenant-slug', slug)
  headers.set('x-tenant-id', tenantId)
  if (rewritePath) {
    const url = req.nextUrl.clone()
    url.pathname = rewritePath
    return NextResponse.rewrite(url, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

async function handle(
  req: NextRequest,
  authState: { userId: string | null; orgId: string | null } | null,
): Promise<NextResponse> {
  const host = req.headers.get('host') ?? ''
  const { surface, sub } = classifyHost(host)

  switch (surface) {
    case 'reserved':
    case 'local':
      // Apex/www/llm/langfuse/partners/status and dev hosts: no tenant scoping.
      return passthrough(req)

    case 'internal-admin':
      // Firmcraft's own panel — existing behavior, gated below by Clerk.
      return passthrough(req)

    case 'login-app': {
      // Generic login/landing. After auth, bounce the user to their own
      // {slug}.firmcraft.ai if their JWT carries a tenant. (Slug-from-tenant
      // lookup is a Sprint-2 refinement; for now we only avoid trapping an
      // authenticated user on the generic host.)
      return passthrough(req)
    }

    case 'tenant-client': {
      const tenant = await lookupTenant(sub)
      if (!tenant) {
        // Unknown slug → send to marketing rather than render a broken app.
        return NextResponse.redirect(`https://${ROOT_DOMAIN}`)
      }

      const path = req.nextUrl.pathname

      // Next internals / static files not already excluded by the matcher: pass
      // through untouched so assets resolve (no tenant data, no gate needed).
      if (path.startsWith('/_next') || /\.[a-zA-Z0-9]+$/.test(path)) {
        return withTenantHeaders(req, sub, tenant.id)
      }

      // Sign-in renders in place on the white-label host (see isTenantAuthRoute).
      // Must precede the auth gate and the board fence.
      if (isTenantAuthRoute(path)) {
        return withTenantHeaders(req, sub, tenant.id)
      }

      // AUTH GATE (CRIT-1) — the dispatch board and its API are tenant-private.
      // Require a signed-in Clerk user whose ACTIVE organization maps 1:1 to
      // this subdomain's tenant (tenants.clerk_org_id ↔ Clerk orgId). RLS is the
      // hard backstop; this is the front-door gate so an unauthenticated (or
      // wrong-tenant) visitor never reaches another contractor's jobs. Skipped
      // only when Clerk isn't configured (local/dev without keys), where the
      // wrapper runs as a no-op anyway.
      if (clerkConfigured) {
        if (!authState?.userId) {
          // Unauthenticated → Clerk sign-in on THIS host, returning to the
          // originally requested board URL after auth (redirect_url is honored
          // by <SignIn> over the provider's signInFallbackRedirectUrl).
          const signIn = req.nextUrl.clone()
          const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`
          signIn.pathname = '/login'
          signIn.search = ''
          signIn.searchParams.set('redirect_url', returnTo)
          return NextResponse.redirect(signIn)
        }
        // Subdomain ↔ Clerk-org consistency (§9.3): signed in, but the active
        // org isn't this tenant's (a user from another contractor, or with no
        // org selected). Bounce to the generic host to pick the right org rather
        // than leak this tenant's board.
        if (authState.orgId !== tenant.clerkOrgId) {
          return NextResponse.redirect(`https://app.${ROOT_DOMAIN}`)
        }
      }

      // Authenticated and bound to this tenant below.
      //
      // White-label fencing (§1.6): a tenant subdomain exposes ONLY the dispatch
      // board and its API. Every internal-admin page (/clients, /leads,
      // /outreach, /partners, /playbook, /analytics, /settings, /roadmap,
      // /status, /support, /health, …) must never render on a customer host.
      // An allowlist — rather than a denylist of today's admin routes — fences
      // future admin pages too, with no further changes here.

      // Tenant root → render the board in place (clean white-label URL).
      if (path === '/') {
        return withTenantHeaders(req, sub, tenant.id, '/dispatch')
      }

      // The board route and its data API forward normally with tenant headers.
      if (path === '/dispatch' || path.startsWith('/dispatch/') || path.startsWith('/api/')) {
        return withTenantHeaders(req, sub, tenant.id)
      }

      // Anything else is an internal-admin surface — bounce to the board rather
      // than leak it. (This redirect carries a Location header, so the wrapper's
      // admin auth gate below intentionally does not override it.)
      const boardUrl = req.nextUrl.clone()
      boardUrl.pathname = '/dispatch'
      boardUrl.search = ''
      return NextResponse.redirect(boardUrl)
    }
  }
}

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      const { userId, orgId } = await auth()

      const routed = await handle(req, { userId, orgId: orgId ?? null })

      // If handle() already decided to redirect (white-label fencing, unknown
      // slug, cross-tenant mismatch), honor it — the admin auth gate must not
      // override a routing redirect with a /login bounce.
      if (routed.headers.get('location')) return routed

      // Admin auth gate: Firmcraft's own surfaces require a signed-in user.
      // Tenant subdomains run their OWN auth gate (Clerk-org ↔ tenant) inside
      // handle() and have already returned by here if they needed to redirect;
      // re-applying the admin /login bounce would send a wrong-tenant user to
      // the internal sign-in instead of handle()'s tenant-scoped flow.
      const { surface } = classifyHost(req.headers.get('host') ?? '')
      if (surface !== 'tenant-client' && !isPublicRoute(req) && !userId) {
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
