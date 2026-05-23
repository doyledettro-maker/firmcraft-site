/**
 * Create a survey invitation token for a company.
 *
 * Usage:
 *   npx tsx scripts/create-survey-token.ts "Acme Industrial" [--days 60] [--note "Discovery call 5/22"]
 *
 * Prints the share URL (firmcraft.ai/get-started?t=ust-…) on success.
 * Idempotent: re-running with the same company name creates a NEW token; tokens
 * are not deduped by company so you can hand out fresh links per engagement.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env.local') })
loadEnv({ path: resolve(process.cwd(), '.env') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseUrl = process.env.SURVEY_BASE_URL || 'https://firmcraft.ai'

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const args = process.argv.slice(2)
const positional: string[] = []
const flags: Record<string, string> = {}

for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a.startsWith('--')) {
    const key = a.slice(2)
    const value = args[i + 1]
    if (!value || value.startsWith('--')) {
      console.error(`Flag --${key} requires a value.`)
      process.exit(1)
    }
    flags[key] = value
    i++
  } else {
    positional.push(a)
  }
}

const companyName = positional[0]
if (!companyName) {
  console.error('Usage: tsx scripts/create-survey-token.ts "Company name" [--days N] [--note "..."]')
  process.exit(1)
}

const daysValid = flags.days ? parseInt(flags.days, 10) : 90
if (!Number.isFinite(daysValid) || daysValid <= 0) {
  console.error('--days must be a positive integer.')
  process.exit(1)
}

const token = `ust-${randomBytes(6).toString('base64url')}`
const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString()

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { error } = await db.from('survey_tokens').insert({
    token,
    company_name: companyName,
    notes: flags.note ?? null,
    expires_at: expiresAt,
  })
  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }
  const shareUrl = `${baseUrl.replace(/\/$/, '')}/get-started?t=${token}`
  console.log()
  console.log(`  Company:    ${companyName}`)
  console.log(`  Token:      ${token}`)
  console.log(`  Expires:    ${expiresAt} (${daysValid} days)`)
  if (flags.note) console.log(`  Note:       ${flags.note}`)
  console.log()
  console.log(`  Share URL:  ${shareUrl}`)
  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
