// Tri-path authentication for the scheduling Edge Functions.
//
// Every scheduling endpoint resolves the caller to an { tenantId, role, techId }
// context. There are THREE ways a caller can authenticate, and each endpoint
// declares which it accepts:
//
//   1. "jwt"     — a Clerk session JWT in `Authorization: Bearer <jwt>`. Verified
//                  against Clerk's JWKS. Claims carry tenant_id / app_role / tech_id /
//                  sub (set by the Clerk → Supabase JWT template, architecture §9.3).
//                  This is the end-user path (dispatcher/admin/tech in the browser
//                  or mobile app).
//
//   2. "service" — a trusted backend (the Phase 1 AI phone agent / Hermes, and the
//                  integration tests). Presents the Supabase SERVICE-ROLE key as the
//                  bearer token AND declares the acting tenant/role/tech via
//                  `x-tenant-id` / `x-role` / `x-tech-id` headers. Because holding the
//                  service-role key already implies full trust, these headers are
//                  taken at face value. This is the "service credential" path the
//                  build plan (§6.2) contrasts with the public widget key.
//
//   3. "widget"  — a public, embeddable booking widget (Phase 3). Presents a
//                  tenant-scoped key in `x-firmcraft-widget-key`. The key maps to one
//                  tenant and a set of scopes, and is rate-limited. No user identity,
//                  no role — role is reported as 'widget'. Forward-compatibility for
//                  online booking is built in here from the start (build plan §6.2).
//
// Tenant isolation always derives from this resolved tenantId, never from the
// subdomain or any client-supplied value on the JWT/widget paths.

import { createRemoteJWKSet, jwtVerify } from "npm:jose";
import type { SupabaseClient } from "npm:@supabase/supabase-js";
import { HttpError } from "./response.ts";
import { getServiceRoleKey } from "./supabase.ts";
import { rateLimit } from "./ratelimit.ts";

export type AuthType = "jwt" | "service" | "widget";

export interface AuthContext {
  authType: AuthType;
  tenantId: string;
  // 'admin' | 'dispatcher' | 'technician' for jwt/service; 'widget' for widget keys.
  role: string;
  techId: string | null;
  // clerk user id (jwt), the x-actor header or 'service' (service), or 'widget:<id>'.
  subject: string;
  // widget-key scopes; empty for jwt/service (which are unscoped/trusted).
  scopes: string[];
}

export interface AuthOptions {
  allow: AuthType[]; // which auth paths this endpoint accepts
  requireRole?: string[]; // jwt/service: caller role must be one of these
  widgetScope?: string; // widget: key must include this scope
}

// ---------------------------------------------------------------------------
// Clerk JWT verification
// ---------------------------------------------------------------------------

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksForIssuer(issuer: string): ReturnType<typeof createRemoteJWKSet> {
  let set = jwksCache.get(issuer);
  if (!set) {
    set = createRemoteJWKSet(new URL(`${issuer.replace(/\/$/, "")}/.well-known/jwks.json`));
    jwksCache.set(issuer, set);
  }
  return set;
}

// Guards against an attacker pointing `iss` at a JWKS they control. The token
// signature is verified against the ISSUER'S OWN JWKS, so accepting any issuer
// not operated by us would let anyone with a Clerk account mint valid tokens
// with arbitrary tenant_id/role claims. CLERK_ISSUER is therefore REQUIRED:
// with it unset, every JWT is rejected (fail closed) — there is no fallback.
function assertTrustedIssuer(issuer: string): void {
  const pinned = Deno.env.get("CLERK_ISSUER");
  if (!pinned) {
    throw new HttpError(
      500,
      "JWT auth is not configured: set the CLERK_ISSUER function secret",
    );
  }
  if (issuer !== pinned.replace(/\/$/, "")) {
    throw new HttpError(401, "Untrusted token issuer");
  }
}

async function verifyClerkJwt(token: string): Promise<AuthContext> {
  // Peek at the issuer without trusting it, then verify the signature against
  // that issuer's JWKS (after the allowlist check).
  let issuer: string;
  try {
    const payloadB64 = token.split(".")[1];
    const claims = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    issuer = claims.iss;
  } catch {
    throw new HttpError(401, "Malformed JWT");
  }
  if (!issuer) throw new HttpError(401, "JWT missing issuer");
  assertTrustedIssuer(issuer);

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, jwksForIssuer(issuer), { issuer });
    payload = verified.payload as Record<string, unknown>;
  } catch (_err) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const tenantId = (payload.tenant_id ?? payload.tenantId) as string | undefined;
  if (!tenantId) {
    throw new HttpError(403, "Token has no tenant_id claim; user is not bound to a tenant");
  }
  const role = (payload.app_role as string | undefined) ?? "technician";
  const techId = (payload.tech_id ?? payload.techId ?? null) as string | null;
  const subject = (payload.sub as string | undefined) ?? "unknown";

  return { authType: "jwt", tenantId, role, techId, subject, scopes: [] };
}

// ---------------------------------------------------------------------------
// Service-credential (trusted backend) verification
// ---------------------------------------------------------------------------

function verifyServiceCredential(req: Request, bearer: string): AuthContext {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey || bearer !== serviceKey) {
    throw new HttpError(401, "Invalid service credential");
  }
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new HttpError(400, "Service credential requires an x-tenant-id header");
  }
  const role = req.headers.get("x-role") ?? "dispatcher";
  const techId = req.headers.get("x-tech-id");
  const subject = req.headers.get("x-actor") ?? "service";
  return {
    authType: "service",
    tenantId,
    role,
    techId: techId && techId.length > 0 ? techId : null,
    subject,
    scopes: [],
  };
}

// ---------------------------------------------------------------------------
// Widget-key verification (public, tenant-scoped, rate-limited)
// ---------------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyWidgetKey(
  presentedKey: string,
  db: SupabaseClient,
): Promise<AuthContext> {
  const keyHash = await sha256Hex(presentedKey);
  const { data, error } = await db
    .from("widget_keys")
    .select("id, tenant_id, scopes, rate_limit_per_minute, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error) throw new HttpError(500, `Widget key lookup failed: ${error.message}`);
  if (!data || !data.is_active) throw new HttpError(401, "Invalid or inactive widget key");

  // Per-key, per-minute rate limit (best-effort, per isolate).
  const limit = (data.rate_limit_per_minute as number) ?? 60;
  const { allowed, retryAfterMs } = rateLimit(`widget:${data.id}`, limit, 60_000);
  if (!allowed) {
    throw new HttpError(429, "Rate limit exceeded for this widget key", {
      retry_after_ms: retryAfterMs,
    });
  }

  // Fire-and-forget last_used_at touch (don't block the request on it).
  db.from("widget_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)
    .then(() => {}, () => {});

  return {
    authType: "widget",
    tenantId: data.tenant_id as string,
    role: "widget",
    techId: null,
    subject: `widget:${data.id}`,
    scopes: (data.scopes as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function authenticate(
  req: Request,
  db: SupabaseClient,
  opts: AuthOptions,
): Promise<AuthContext> {
  const widgetKey = req.headers.get("x-firmcraft-widget-key");
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  let ctx: AuthContext;

  if (widgetKey) {
    if (!opts.allow.includes("widget")) {
      throw new HttpError(403, "Widget-key auth is not permitted on this endpoint");
    }
    ctx = await verifyWidgetKey(widgetKey, db);
  } else if (bearer) {
    const serviceKey = getServiceRoleKey();
    if (serviceKey && bearer === serviceKey) {
      if (!opts.allow.includes("service")) {
        throw new HttpError(403, "Service-credential auth is not permitted on this endpoint");
      }
      ctx = verifyServiceCredential(req, bearer);
    } else {
      if (!opts.allow.includes("jwt")) {
        throw new HttpError(403, "JWT auth is not permitted on this endpoint");
      }
      ctx = await verifyClerkJwt(bearer);
    }
  } else {
    throw new HttpError(401, "Missing credentials: provide a Bearer token or x-firmcraft-widget-key");
  }

  // Role / scope gating.
  if (ctx.authType === "widget") {
    if (opts.widgetScope && !ctx.scopes.includes(opts.widgetScope)) {
      throw new HttpError(403, `Widget key is missing required scope: ${opts.widgetScope}`);
    }
  } else if (opts.requireRole && opts.requireRole.length > 0) {
    if (!opts.requireRole.includes(ctx.role)) {
      throw new HttpError(403, `Requires role: ${opts.requireRole.join(" or ")}`);
    }
  }

  return ctx;
}
