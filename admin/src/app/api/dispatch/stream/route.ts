import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { resolveTenant } from '@/lib/dispatch/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dispatch/stream  → Server-Sent Events realtime feed.
//
// WHY SERVER-PROXIED: the dispatch board wants genuine Supabase Realtime, but
// the browser can't subscribe directly yet — the Clerk-JWT → Supabase-RLS
// bridge isn't built, so an anon browser client receives nothing under the
// tenant-isolation policies. So the SERVER holds the Supabase Realtime
// subscription (service-role, which bypasses RLS), filters changes to this
// request's tenant, and relays a lightweight "something changed" ping over SSE.
// The browser reacts by refetching /api/dispatch/board (which returns clean
// GeoJSON — realtime payloads carry PostGIS geometry as WKB, not coordinates).
//
// When the JWT bridge lands, the client can switch to a direct browser
// subscription with no change to the board components.
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return new Response('Supabase not configured', { status: 503 })
  }
  const tenant = await resolveTenant()
  if (!tenant) return new Response('No tenant resolved', { status: 404 })

  const sb = getSupabaseAdmin()
  const encoder = new TextEncoder()
  const channelName = `dispatch:${tenant.id}:${crypto.randomUUID()}`

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          /* controller already closed */
        }
      }

      send('ready', { tenant: tenant.id, at: new Date().toISOString() })

      const channel = sb
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs', filter: `tenant_id=eq.${tenant.id}` },
          (payload) => {
            const row = (payload.new ?? payload.old) as { id?: string } | null
            send('change', { table: 'jobs', op: payload.eventType, id: row?.id ?? null })
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'technician_current_location',
            filter: `tenant_id=eq.${tenant.id}`,
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as { technician_id?: string } | null
            send('change', { table: 'technician_current_location', op: payload.eventType, id: row?.technician_id ?? null })
          },
        )
        .subscribe()

      // Heartbeat keeps proxies from closing an idle connection.
      const heartbeat = setInterval(() => send('ping', { at: Date.now() }), 25_000)

      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        sb.removeChannel(channel)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
