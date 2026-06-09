// Shared types for the dispatch board (Phase 2.2).
//
// These mirror the scheduling schema (admin/supabase/migrations/2026060*) but
// are trimmed to the columns the board actually renders. The board reads/writes
// through the `/api/dispatch/*` routes, never the DB directly, so these types
// are the contract between those routes and the client components.

export type JobStatus =
  | 'created'
  | 'scheduled'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'cancelled'
  | 'on_hold'

export type JobPriority = 'emergency' | 'urgent' | 'standard' | 'flexible'

export interface LatLng {
  lat: number
  lng: number
}

export interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
  lat?: number
  lng?: number
}

export interface Technician {
  id: string
  name: string
  email: string | null
  phone: string | null
  color: string | null
  avatar_url: string | null
  is_active: boolean
  home: LatLng | null
  /** Live location from technician_current_location, if the tech is reporting. */
  current: (LatLng & { status: string | null; heading: number | null }) | null
}

export interface JobType {
  id: string
  name: string
  category: string | null
  color: string | null
  default_duration: number
  estimated_revenue: number | null
}

export interface Job {
  id: string
  tenant_id: string
  customer_id: string
  customer_name: string | null
  customer_phone: string | null
  job_type_id: string | null
  job_type_name: string | null
  job_type_category: string | null
  technician_id: string | null
  title: string
  description: string | null
  priority: JobPriority
  status: JobStatus
  source: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  estimated_duration: number | null
  actual_start: string | null
  actual_end: string | null
  estimated_revenue: number | null
  address: Address | null
  location: LatLng | null
  tech_notes: string | null
  internal_notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface JobStatusHistoryEntry {
  id: string
  previous_status: JobStatus | null
  new_status: JobStatus
  changed_by: string | null
  reason: string | null
  created_at: string
}

export interface JobDetail extends Job {
  history: JobStatusHistoryEntry[]
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: Address | null
    tags: string[]
    notes: string | null
  } | null
}

export interface TenantInfo {
  id: string
  name: string
  slug: string
  timezone: string
}

export interface BoardData {
  tenant: TenantInfo
  technicians: Technician[]
  jobTypes: JobType[]
  jobs: Job[]
}

/** Fields the board is allowed to patch on a job (drag/drop, resize, assign, status). */
export interface JobPatch {
  technician_id?: string | null
  scheduled_start?: string | null
  scheduled_end?: string | null
  status?: JobStatus
  priority?: JobPriority
  title?: string
  internal_notes?: string
}
