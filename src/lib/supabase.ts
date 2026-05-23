import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey)
}

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}
