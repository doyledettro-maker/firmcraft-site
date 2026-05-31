import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type TrackingEventType = 'open' | 'click' | 'bounce' | 'reply' | 'unsubscribe'

export type TrackingEvent = {
  id: string
  prospectId: string
  eventType: TrackingEventType
  timestamp: string
  metadata: Record<string, unknown>
}

type TrackingEventRow = {
  id: string
  prospect_id: string
  event_type: TrackingEventType
  timestamp: string
  metadata: Record<string, unknown> | null
}

function rowToEvent(row: TrackingEventRow): TrackingEvent {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    eventType: row.event_type,
    timestamp: row.timestamp,
    metadata: row.metadata ?? {},
  }
}

export async function logTrackingEvent(
  prospectId: string,
  eventType: TrackingEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const db = getSupabaseAdmin()
  const { error } = await db.from('tracking_events').insert({
    prospect_id: prospectId,
    event_type: eventType,
    metadata,
  })
  if (error) throw new Error(`logTrackingEvent failed: ${error.message}`)
}

export async function getEventsForProspect(prospectId: string): Promise<TrackingEvent[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('tracking_events')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('timestamp', { ascending: false })
  if (error) throw new Error(`getEventsForProspect failed: ${error.message}`)
  return (data ?? []).map((r) => rowToEvent(r as TrackingEventRow))
}
