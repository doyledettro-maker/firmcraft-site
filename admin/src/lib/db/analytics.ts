import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type DailyVisits = {
  day: string
  views: number
  uniques: number
}

export type PathCount = {
  path: string
  views: number
}

export type ReferrerCount = {
  referrer: string
  views: number
}

export type AnalyticsSummary = {
  configured: boolean
  totalViews: number
  totalUniques: number
  windowDays: number
  daily: DailyVisits[]
  topPaths: PathCount[]
  topReferrers: ReferrerCount[]
}

type PageViewRow = {
  path: string | null
  referrer: string | null
  ip_hash: string | null
  created_at: string
}

const PAGE_SIZE = 1000

function emptySummary(windowDays: number): AnalyticsSummary {
  return {
    configured: false,
    totalViews: 0,
    totalUniques: 0,
    windowDays,
    daily: [],
    topPaths: [],
    topReferrers: [],
  }
}

function normalizeReferrer(raw: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    if (!host) return null
    if (host === 'firmcraft.ai' || host === 'www.firmcraft.ai') return null
    return host
  } catch {
    return null
  }
}

export async function getAnalyticsSummary(windowDays = 30): Promise<AnalyticsSummary> {
  if (!isSupabaseConfigured()) return emptySummary(windowDays)

  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  // Paginate so a busy window doesn't get capped at the default 1k Supabase limit.
  const rows: PageViewRow[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('page_views')
      .select('path, referrer, ip_hash, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('[analytics] query failed', error)
      break
    }
    if (!data || data.length === 0) break
    rows.push(...(data as PageViewRow[]))
    if (data.length < PAGE_SIZE) break
  }

  const dayMap = new Map<string, { views: number; uniques: Set<string> }>()
  const pathMap = new Map<string, number>()
  const refMap = new Map<string, number>()
  const allUniques = new Set<string>()

  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    const bucket = dayMap.get(day) ?? { views: 0, uniques: new Set<string>() }
    bucket.views += 1
    if (row.ip_hash) bucket.uniques.add(row.ip_hash)
    dayMap.set(day, bucket)

    if (row.ip_hash) allUniques.add(row.ip_hash)

    const path = row.path?.split('?')[0] ?? '/'
    pathMap.set(path, (pathMap.get(path) ?? 0) + 1)

    const ref = normalizeReferrer(row.referrer)
    if (ref) refMap.set(ref, (refMap.get(ref) ?? 0) + 1)
  }

  // Fill every day in the window, even zeros — makes the chart shape honest.
  const daily: DailyVisits[] = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const day = d.toISOString().slice(0, 10)
    const bucket = dayMap.get(day)
    daily.push({
      day,
      views: bucket?.views ?? 0,
      uniques: bucket?.uniques.size ?? 0,
    })
  }

  const topPaths = Array.from(pathMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  const topReferrers = Array.from(refMap.entries())
    .map(([referrer, views]) => ({ referrer, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  return {
    configured: true,
    totalViews: rows.length,
    totalUniques: allUniques.size,
    windowDays,
    daily,
    topPaths,
    topReferrers,
  }
}
