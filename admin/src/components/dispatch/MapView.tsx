'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { statusColor } from '@/lib/dispatch/status'
import type { Job, Technician } from '@/lib/dispatch/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const HOUSTON: [number, number] = [-95.37, 29.76]

interface Props {
  jobs: Job[]
  technicians: Technician[]
  selectedJobId: string | null
  onSelectJob: (jobId: string) => void
}

export function MapView({ jobs, technicians, selectedJobId, onSelectJob }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Latest data/handlers via refs so the marker renderer (called from map
  // events) never reads a stale closure — important under React StrictMode's
  // double-mount and across realtime updates.
  const dataRef = useRef({ jobs, technicians, selectedJobId })
  dataRef.current = { jobs, technicians, selectedJobId }
  const onSelectRef = useRef(onSelectJob)
  onSelectRef.current = onSelectJob
  const didFit = useRef(false)

  function renderMarkers() {
    const map = mapRef.current
    if (!map) return
    // Markers are HTML overlays positioned by lng/lat — they can be added before
    // the style finishes loading, so there's no need to gate on isStyleLoaded().

    const { jobs, technicians, selectedJobId } = dataRef.current
    for (const m of markersRef.current) m.remove()
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()
    let any = false

    for (const t of technicians) {
      const color = t.color ?? '#2C6BF0'
      if (t.home) {
        const el = document.createElement('div')
        el.className = 'dispatch-tech-home'
        el.style.cssText = `width:12px;height:12px;border-radius:3px;background:transparent;border:2px solid ${color};box-shadow:0 0 0 2px rgba(11,18,32,0.8);`
        el.title = `${t.name} (home)`
        markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([t.home.lng, t.home.lat]).addTo(map))
        bounds.extend([t.home.lng, t.home.lat])
        any = true
      }
      if (t.current) {
        const el = document.createElement('div')
        el.className = 'dispatch-tech-live'
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 4px ${color}55;`
        el.title = `${t.name} — ${t.current.status ?? 'active'}`
        markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([t.current.lng, t.current.lat]).addTo(map))
        bounds.extend([t.current.lng, t.current.lat])
        any = true
      }
    }

    for (const j of jobs) {
      if (!j.location) continue
      const selected = j.id === selectedJobId
      const el = document.createElement('div')
      el.className = 'dispatch-job-pin'
      const size = selected ? 22 : 16
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${statusColor(j.status)};border:2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.6)'};cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.5);${selected ? 'z-index:10;' : ''}`
      el.title = `${j.title}${j.customer_name ? ' — ' + j.customer_name : ''}`
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(j.id)
      })
      markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([j.location.lng, j.location.lat]).addTo(map))
      bounds.extend([j.location.lng, j.location.lat])
      any = true
    }

    // Fit once on first populated render; later updates keep the user's viewport.
    if (any && !didFit.current && !bounds.isEmpty()) {
      didFit.current = true
      map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 })
    }
  }

  // Create the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: HOUSTON,
      zoom: 9.5,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map
    map.on('load', () => {
      // The split-pane width may have changed since construction.
      map.resize()
      renderMarkers()
    })
    return () => {
      map.remove()
      mapRef.current = null
      didFit.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render markers when data or selection changes.
  useEffect(() => {
    renderMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, technicians, selectedJobId])

  if (!TOKEN) {
    return (
      <div className="h-full grid place-items-center bg-paper-2 text-center p-6">
        <div>
          <div className="text-ink font-medium mb-1">Map unavailable</div>
          <p className="text-muted text-[13px] max-w-[260px]">
            Set <code className="font-mono text-accent-3">NEXT_PUBLIC_MAPBOX_TOKEN</code> to show job
            locations and live technician positions.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="h-full w-full" />
}
