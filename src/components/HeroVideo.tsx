'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const HERO = {
  mp4: '/media/hero-1080.mp4',
  webm: '/media/hero-1080.webm',
  mobile: '/media/hero-720.mp4',
} as const

function getPreferredHeroMp4() {
  if (typeof window === 'undefined') return HERO.mp4
  return window.matchMedia('(max-width: 768px)').matches ? HERO.mobile : HERO.mp4
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = useState(false)
  const [posterOnly, setPosterOnly] = useState(false)
  const [mp4Source, setMp4Source] = useState<string>(HERO.mp4)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = 'connection' in navigator
      ? Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
      : false
    setPosterOnly(reduceMotion || saveData)
    setMp4Source(getPreferredHeroMp4())

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateSource = () => setMp4Source(getPreferredHeroMp4())
    mediaQuery.addEventListener('change', updateSource)
    return () => mediaQuery.removeEventListener('change', updateSource)
  }, [])

  useEffect(() => {
    if (!videoRef.current || posterOnly) return
    videoRef.current.load()
    videoRef.current.play().catch(() => setPaused(true))
    setPaused(false)
  }, [mp4Source, posterOnly])

  function handleFinalSourceError() {
    const video = videoRef.current
    if (!video) return
    if (
      video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
      video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
    ) {
      setPosterOnly(true)
    }
  }

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
          aria-hidden="true"
        >
          <source src={mp4Source} type="video/mp4" />
          <source src={HERO.webm} type="video/webm" onError={handleFinalSourceError} />
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
