/**
 * Seed the production Firmcraft admin database.
 *
 * Run:   npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Idempotent: if a row already exists for a given stripe_customer_id we update
 * it instead of inserting a duplicate.
 */
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env.local') })
loadEnv({ path: resolve(process.cwd(), '.env') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const rumbleBee = {
  name: 'Rumble Bee Tree Service',
  industry: 'Tree services',
  status: 'active' as const,
  plan_tier: 'spark' as const,
  contact_name: 'Mike Carr',
  contact_email: 'rumblebeetreespfld@gmail.com',
  monthly_price: 40.0,
  stripe_customer_id: 'cus_UXxEGRjkb4TBWf',
  vps_ip: '178.105.123.101',
  hermes_port: 9119,
}

async function main() {
  const { data: existing, error: existingErr } = await db
    .from('clients')
    .select('id')
    .eq('stripe_customer_id', rumbleBee.stripe_customer_id)
    .maybeSingle()

  if (existingErr) {
    console.error('Lookup failed:', existingErr.message)
    process.exit(1)
  }

  if (existing) {
    const { error } = await db
      .from('clients')
      .update(rumbleBee)
      .eq('id', existing.id)
    if (error) {
      console.error('Update failed:', error.message)
      process.exit(1)
    }
    console.log(`Updated existing client ${existing.id} (Rumble Bee).`)
    return
  }

  const { data, error } = await db
    .from('clients')
    .insert(rumbleBee)
    .select('id')
    .single()

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }
  console.log(`Inserted Rumble Bee Tree Service as client ${data.id}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
