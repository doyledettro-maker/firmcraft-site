// Supabase access layer for the scheduling skills: PostgREST, RPC, and the
// Sprint 2 Edge Functions via the trusted service-credential path (Bearer
// service-role key + x-tenant-id/x-role headers — see functions/_shared/auth.ts).
//
// The Edge Functions are built but not yet deployed, so every edge() call takes
// a `fallback` that implements the same operation directly against PostgREST.
// Deployment is probed once per function per process (OPTIONS preflight) and
// can be forced either way with SCHEDULING_EDGE_MODE=always|never.

import { loadConfig } from "./config.mjs";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class Api {
  constructor(cfg) {
    this.cfg = cfg;
    this.tenant = null;
    this._edgeUp = new Map();
  }

  headers(extra = {}) {
    return {
      apikey: this.cfg.serviceKey,
      authorization: `Bearer ${this.cfg.serviceKey}`,
      "content-type": "application/json",
      ...extra,
    };
  }

  async rest(pathAndQuery, { method = "GET", body, prefer } = {}) {
    const res = await fetch(`${this.cfg.url}/rest/v1/${pathAndQuery}`, {
      method,
      headers: this.headers(prefer ? { prefer } : {}),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && (data.message || data.hint || data.details)) ||
        `${res.status} ${res.statusText}`;
      throw new ApiError(res.status, msg, data);
    }
    return data;
  }

  rpc(fn, args) {
    return this.rest(`rpc/${fn}`, { method: "POST", body: args });
  }

  async fetchTenant() {
    const q = this.cfg.tenantId
      ? `tenants?id=eq.${this.cfg.tenantId}&select=*&limit=1`
      : `tenants?slug=eq.${encodeURIComponent(this.cfg.tenantSlug)}&select=*&limit=1`;
    const rows = await this.rest(q);
    if (!rows || rows.length === 0) {
      throw new Error(`Tenant not found: ${this.cfg.tenantId ?? this.cfg.tenantSlug}`);
    }
    return rows[0];
  }

  async edgeDeployed(name) {
    if (this.cfg.edgeMode === "never") return false;
    if (this.cfg.edgeMode === "always") return true;
    if (this._edgeUp.has(name)) return this._edgeUp.get(name);
    let up = false;
    try {
      // Deployed scheduling functions answer the CORS preflight with 200;
      // an undeployed name returns 404 from the gateway.
      const res = await fetch(`${this.cfg.url}/functions/v1/${name}`, { method: "OPTIONS" });
      up = res.status < 400;
    } catch {
      up = false;
    }
    this._edgeUp.set(name, up);
    return up;
  }

  // POST an Edge Function (service-credential path) and unwrap its {ok, data}
  // envelope; run `fallback` when the function isn't deployed.
  async edge(name, body, fallback) {
    if (await this.edgeDeployed(name)) {
      const res = await fetch(`${this.cfg.url}/functions/v1/${name}`, {
        method: "POST",
        headers: this.headers({
          "x-tenant-id": this.tenant.id,
          "x-role": "dispatcher",
          "x-actor": this.cfg.actor,
        }),
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.ok === false) {
        const msg = payload?.error || payload?.message || `${name} failed (${res.status})`;
        throw new ApiError(res.status, msg, payload?.details);
      }
      return payload?.data ?? payload;
    }
    return fallback();
  }

  // Patch the changed_by / reason on the audit row the status trigger just
  // wrote (the direct-PostgREST analog of transition-job's annotateHistory).
  async annotateHistory(jobId, newStatus, { reason, metadata } = {}) {
    const rows = await this.rest(
      `job_status_history?job_id=eq.${jobId}&new_status=eq.${newStatus}` +
        `&select=id&order=created_at.desc&limit=1`,
    );
    if (!rows || rows.length === 0) return;
    const patch = { changed_by: this.cfg.actor };
    if (reason !== undefined) patch.reason = reason;
    if (metadata && Object.keys(metadata).length > 0) patch.metadata = metadata;
    await this.rest(`job_status_history?id=eq.${rows[0].id}`, {
      method: "PATCH",
      body: patch,
    });
  }
}

// "SRID=4326;POINT(lng lat)" from an address jsonb carrying lat/lng — same
// denormalization create-job does (functions/_shared/geo.ts).
export function ewktFromAddress(address) {
  if (address && typeof address === "object") {
    const lat = Number(address.lat);
    const lng = Number(address.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `SRID=4326;POINT(${lng} ${lat})`;
    }
  }
  return null;
}

export async function createContext() {
  const api = new Api(loadConfig());
  api.tenant = await api.fetchTenant();
  return api;
}
