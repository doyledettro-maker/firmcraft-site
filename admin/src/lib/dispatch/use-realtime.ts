'use client'

import { useEffect, useRef } from 'react'

// useDispatchRealtime — subscribe to live board changes.
//
// Primary transport is the SSE endpoint /api/dispatch/stream, which relays
// genuine Supabase Realtime events (jobs + technician_current_location) from the
// server. On any change ping we call onChange() (debounced), and the board
// refetches. If SSE fails to connect or drops, we fall back to polling so the
// "changes appear within ~2 seconds" guarantee holds regardless.
//
// onChange is kept in a ref so the subscription does not tear down when the
// caller passes a fresh closure each render.
export function useDispatchRealtime(
  onChange: () => void,
  opts?: { pollMs?: number; debounceMs?: number; onStatus?: (live: boolean) => void },
) {
  const pollMs = opts?.pollMs ?? 4000
  const debounceMs = opts?.debounceMs ?? 250
  const cb = useRef(onChange)
  cb.current = onChange
  const statusCb = useRef(opts?.onStatus)
  statusCb.current = opts?.onStatus

  useEffect(() => {
    let disposed = false
    let debounce: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let es: EventSource | null = null

    const fire = () => {
      if (disposed) return
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => cb.current(), debounceMs)
    }

    const startPolling = () => {
      if (pollTimer || disposed) return
      pollTimer = setInterval(() => cb.current(), pollMs)
    }
    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    try {
      es = new EventSource('/api/dispatch/stream')
      es.addEventListener('change', fire)
      es.addEventListener('ready', () => {
        stopPolling()
        statusCb.current?.(true)
      })
      es.onerror = () => {
        // SSE connection problem — lean on polling until it recovers.
        statusCb.current?.(false)
        startPolling()
      }
    } catch {
      statusCb.current?.(false)
      startPolling()
    }

    return () => {
      disposed = true
      if (debounce) clearTimeout(debounce)
      stopPolling()
      es?.close()
    }
  }, [pollMs, debounceMs])
}
