'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const HERO = {
  mp4: '/media/hero-1080.mp4',
  webm: '/media/hero-1080.webm',
  mobile: '/media/hero-720.mp4',
} as const

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = useState(false)
  const [posterOnly, setPosterOnly] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactViewport = window.matchMedia('(max-width: 768px)').matches
    const saveData = 'connection' in navigator
      ? Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
      : false
    setPosterOnly(reduceMotion || saveData || compactViewport)
  }, [])

  useEffect(() => {
    if (!videoRef.current || posterOnly) return
    videoRef.current.load()
    videoRef.current.play().catch(() => setPaused(true))
    setPaused(false)
  }, [posterOnly])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setPaused(false)).catch(() => setPaused(true))
    } else {
      video.pause()
      setPaused(true)
    }
  }

  return (
    <div className="hero-media">
      {!posterOnly && (
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setPosterOnly(true)}
          aria-hidden="true"
        >
          <source src={HERO.mobile} media="(max-width: 768px)" type="video/mp4" />
          <source src={HERO.webm} type="video/webm" />
          <source src={HERO.mp4} type="video/mp4" />
        </video>
      )}

      {!posterOnly && (
        <button
          type="button"
          className="hero-control"
          onClick={togglePlayback}
          aria-label={paused ? 'Play background video' : 'Pause background video'}
        >
          {paused ? <Play aria-hidden="true" size={15} /> : <Pause aria-hidden="true" size={15} />}
        </button>
      )}
    </div>
  )
}
