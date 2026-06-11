// Server-only data layer for the dispatch board.
//
// The board is the CLIENT-FACING app served at {slug}.firmcraft.ai. The
// subdomain middleware (admin/src/middleware.ts) resolves the host to a
// tenant and forwards it as the `x-tenant-id` request header. Every function
// here scopes its query to that tenant.
//
// AUTH NOTE: the Clerk-JWT → Supabase-RLS bridge is a later task (Phase 2.1
// Sprint 1 deferred refinement). Until it lands, these reads/writes go through
// the service-role client and we enforce the tenant boundary explicitly in
// every query (the `tenant_id = <resolved>` filters below). RLS remains the
// hard boundary once authenticated browser sessions exist.

import 'server-only'
import { headers } from 'next/headers'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type {
  Address, BoardData, Job, JobDetail, JobPatch, JobStatusHistoryEntry, JobType, LatLng, Technician, TenantInfo,
} from './types'

export type { JobPatch } from './types'

// In local dev (and on the internal admin host) there is no tenant subdomain,
// so fall back to this demo tenant slug — matches supabase/seed-scheduling.sql.
const DEFAULT_SLUG = process.env.DISPATCH_DEFAULT_TENANT_SLUG || 'demo'

type GeoPoint = { type: 'Point'; coordinates: [number, number] } | null

function pointToLatLng(p: GeoPoint): LatLng | null {
  if (!p || !Array.isArray(p.coordinates) || p.coordinates.length < 2) return null
  const [lng, lat] = p.coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return { lat, lng }
}

export interface ResolvedTenant {
  id: string
  slug: string
}

/**
 * Resolve the tenant for the current request: the `x-tenant-id` header set by
 * the subdomain middleware, else the demo tenant by slug. Returns null only if
 * Supabase is unconfigured or no tenant can be found.
 */
export async function resolveTenant(): Promise<ResolvedTenant | null> {
  if (!isSupabaseConfigured()) return null
  const h = headers()
  const headerId = h.get('x-tenant-id')
  const headerSlug = h.get('x-tenant-slug')
  if (headerId) return { id: headerId, slug: headerSlug || '' }

  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('tenants')
    .select('id, slug')
    .eq('slug', DEFAULT_SLUG)
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return { id: data.id, slug: data.slug }
}

export async function getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('tenants')
    .select('id, name, slug, timezone')
    .eq('id', tenantId)
    .maybeSingle()
  return data ?? null
}

export async function getTechnicians(tenantId: string): Promise<Technician[]> {
  const sb = getSupabaseAdmin()
  const [{ data: techs }, { data: locs }] = await Promise.all([
    sb
      .from('technicians')
      .select('id, name, email, phone, color, avatar_url, is_active, home_address')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name'),
    sb
      .from('technician_current_location')
      .select('technician_id, location, status, heading')
      .eq('tenant_id', tenantId),
  ])

  const locByTech = new Map<string, { location: GeoPoint; status: string | null; heading: number | null }>()
  for (const l of locs ?? []) locByTech.set(l.technician_id, l as never)

  return (techs ?? []).map((t): Technician => {
    const home = t.home_address as { lat?: number; lng?: number } | null
    const live = locByTech.get(t.id)
    const livePoint = live ? pointToLatLng(live.location) : null
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      color: t.color,
      avatar_url: t.avatar_url,
      is_active: t.is_active,
      home: home && typeof home.lat === 'number' && typeof home.lng === 'number'
        ? { lat: home.lat, lng: home.lng }
        : null,
      current: livePoint
        ? { ...livePoint, status: live!.status ?? null, heading: live!.heading ?? null }
        : null,
    }
  })
}

export async function getJobTypes(tenantId: string): Promise<JobType[]> {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('job_types')
    .select('id, name, category, color, default_duration, estimated_revenue')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as JobType[]
}

const JOB_SELECT = `
  id, tenant_id, customer_id, job_type_id, technician_id, title, description,
  priority, status, source, scheduled_start, scheduled_end, estimated_duration,
  actual_start, actual_end, estimated_revenue, address, location, tech_notes,
  internal_notes, tags, created_at, updated_at,
  customer:customers ( name, phone ),
  job_type:job_types ( name, category )
`

type RawJoinedJob = Record<string, unknown> & {
  customer?: { name?: string; phone?: string } | null
  job_type?: { name?: string; category?: string } | null
  location?: GeoPoint
}

function shapeJob(r: RawJoinedJob): Job {
  return {
    id: r.id as string,
    tenant_id: r.tenant_id as string,
    customer_id: r.customer_id as string,
    customer_name: r.customer?.name ?? null,
    customer_phone: r.customer?.phone ?? null,
    job_type_id: (r.job_type_id as string) ?? null,
    job_type_name: r.job_type?.name ?? null,
    job_type_category: r.job_type?.category ?? null,
    technician_id: (r.technician_id as string) ?? null,
    title: r.title as string,
    description: (r.description as string) ?? null,
    priority: r.priority as Job['priority'],
    status: r.status as Job['status'],
    source: (r.source as string) ?? null,
    scheduled_start: (r.scheduled_start as string) ?? null,
    scheduled_end: (r.scheduled_end as string) ?? null,
    estimated_duration: (r.estimated_duration as number) ?? null,
    actual_start: (r.actual_start as string) ?? null,
    actual_end: (r.actual_end as string) ?? null,
    estimated_revenue: (r.estimated_revenue as number) ?? null,
    address: (r.address as Job['address']) ?? null,
    location: pointToLatLng(r.location ?? null),
    tech_notes: (r.tech_notes as string) ?? null,
    internal_notes: (r.internal_notes as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }
}

export interface JobQuery {
  /** Inclusive ISO lower bound on scheduled_start (or created jobs, which have none). */
  from?: string
  /** Exclusive ISO upper bound on scheduled_start. */
  to?: string
}

/**
 * Jobs for the board. Returns everything scheduled within [from, to) PLUS all
 * unassigned `created` jobs (which have no scheduled_start and live in the
 * sidebar regardless of the active date window).
 */
export async function getJobs(tenantId: string, q: JobQuery = {}): Promise<Job[]> {
  const sb = getSupabaseAdmin()

  // Scheduled/assigned jobs inside the window.
  let scheduledQ = sb
    .from('jobs')
    .select(JOB_SELECT)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .not('scheduled_start', 'is', null)
  if (q.from) scheduledQ = scheduledQ.gte('scheduled_start', q.from)
  if (q.to) scheduledQ = scheduledQ.lt('scheduled_start', q.to)

  // Unassigned backlog: created jobs with no schedule yet.
  const backlogQ = sb
    .from('jobs')
    .select(JOB_SELECT)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('status', 'created')
    .is('scheduled_start', null)

  const [{ data: scheduled }, { data: backlog }] = await Promise.all([scheduledQ, backlogQ])

  const seen = new Set<string>()
  const out: Job[] = []
  for (const r of [...(scheduled ?? []), ...(backlog ?? [])] as RawJoinedJob[]) {
    const id = r.id as string
    if (seen.has(id)) continue
    seen.add(id)
    out.push(shapeJob(r))
  }
  return out
}

export async function getBoardData(tenantId: string, q: JobQuery = {}): Promise<BoardData | null> {
  const tenant = await getTenantInfo(tenantId)
  if (!tenant) return null
  const [technicians, jobTypes, jobs] = await Promise.all([
    getTechnicians(tenantId),
    getJobTypes(tenantId),
    getJobs(tenantId, q),
  ])
  return { tenant, technicians, jobTypes, jobs }
}

export async function getJobDetail(tenantId: string, jobId: string): Promise<JobDetail | null> {
  const sb = getSupabaseAdmin()
  const { data: jobRow } = await sb
    .from('jobs')
    .select(JOB_SELECT)
    .eq('tenant_id', tenantId)
    .eq('id', jobId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!jobRow) return null
  const job = shapeJob(jobRow as RawJoinedJob)

  const [{ data: history }, { data: customer }] = await Promise.all([
    sb
      .from('job_status_history')
      .select('id, previous_status, new_status, changed_by, reason, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true }),
    sb
      .from('customers')
      .select('id, name, email, phone, address, tags, notes')
      .eq('id', job.customer_id)
      .maybeSingle(),
  ])

  return {
    ...job,
    history: (history ?? []) as JobStatusHistoryEntry[],
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: (customer.address as Address) ?? null,
          tags: (customer.tags as string[]) ?? [],
          notes: customer.notes,
        }
      : null,
  }
}

/**
 * Apply a board edit. Returns the updated, re-shaped job or null if not found
 * in this tenant. The Postgres status-transition trigger enforces valid status
 * moves; an invalid transition surfaces as a thrown error from supabase-js.
 */
export async function updateJob(tenantId: string, jobId: string, patch: JobPatch): Promise<Job> {
  const sb = getSupabaseAdmin()
  const update: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() }

  // Assignment changes ripple into status, mirroring the update-job Edge Function:
  //   • assigning a tech to an unscheduled `created` job promotes it to scheduled
  //   • clearing the tech (— Unassigned —) returns the job to the `created`
  //     backlog and drops its schedule, so it reappears in the sidebar instead
  //     of orphaning at `scheduled`/`dispatched` with no technician (which renders
  //     on neither the calendar nor the sidebar).
  // Only do this when the caller isn't already setting status explicitly.
  if ('technician_id' in patch && patch.status === undefined) {
    const { data: existing } = await sb
      .from('jobs')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('id', jobId)
      .maybeSingle()
    const current = existing?.status as Job['status'] | undefined
    if (patch.technician_id) {
      if (current === 'created') update.status = 'scheduled'
    } else {
      // Unassigning. The lifecycle trigger allows created from scheduled/dispatched;
      // a job already in the field can't be dropped back to the backlog this way.
      if (current === 'scheduled' || current === 'dispatched') {
        update.status = 'created'
        update.scheduled_start = null
        update.scheduled_end = null
      } else if (current && current !== 'created') {
        throw new Error(`Cannot unassign a job that is ${current}. Change its status first.`)
      }
    }
  }

  const { data, error } = await sb
    .from('jobs')
    .update(update)
    .eq('tenant_id', tenantId)
    .eq('id', jobId)
    .select(JOB_SELECT)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Job not found')
  return shapeJob(data as RawJoinedJob)
}
