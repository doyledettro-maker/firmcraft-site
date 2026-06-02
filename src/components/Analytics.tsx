'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true
  if (window.location.hostname === 'localhost') return true
  if (window.location.hostname.endsWith('.local')) return true
  // Honour the DNT signal even though most browsers no longer ship it.
  if (navigator.doNotTrack === '1') return true
  return false
}

function send(path: string) {
  const body = JSON.stringify({
    path,
    referrer: document.referrer || null,
  })
  // sendBeacon is fire-and-forget and survives page unload.
  if (navigator.sendBeacon) {
    const ok = navigator.sendBeacon(
      '/api/track',
      new Blob([body], { type: 'application/json' }),
    )
    if (ok) return
  }
  fetch('/api/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function Analytics() {
  const pathname = usePathname()
  const search = useSearchParams()
  const lastRef = useRef<string | null>(null)

  useEffect(() => {
    if (shouldSkip()) return
    const qs = search?.toString()
    const full = qs ? `${pathname}?${qs}` : pathname
    if (lastRef.current === full) return
    lastRef.current = full
    send(full)
  }, [pathname, search])

  return null
}
