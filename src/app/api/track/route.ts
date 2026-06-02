import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LEN = {
  path: 512,
  referrer: 1024,
  userAgent: 512,
}

function trim(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v) return null
  return v.length > max ? v.slice(0, max) : v
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}

function hashIp(ip: string): string {
  // Daily-rotated salt so the hash can group same-day visits but cannot be
  // chained across days into a long-lived identity.
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}|${day}|firmcraft-analytics`).digest('hex')
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'supabase-unconfigured' })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 })
  }

  const path = trim(body.path, MAX_LEN.path)
  if (!path) return NextResponse.json({ ok: false, error: 'path-required' }, { status: 400 })

  const referrer = trim(body.referrer, MAX_LEN.referrer)
  const userAgent = trim(req.headers.get('user-agent'), MAX_LEN.userAgent)
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null
  const ip = clientIp(req)
  const ipHash = ip ? hashIp(ip) : null

  try {
    const supabase = getSupabaseAdmin()
    await supabase.from('page_views').insert({
      path,
      referrer,
      user_agent: userAgent,
      ip_hash: ipHash,
      country,
    })
  } catch (err) {
    // Never let analytics failure surface to the visitor.
    console.error('[track] insert failed', err)
  }

  return NextResponse.json({ ok: true })
}
