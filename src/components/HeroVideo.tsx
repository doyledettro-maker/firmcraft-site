'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const HEROES = {
  a: {
    label: 'Candidate A',
    mp4: '/media/hero-a-1080.mp4',
    webm: '/media/hero-a-1080.webm',
    mobile: '/media/hero-a-720.mp4',
    poster: '/media/hero-a-poster.jpg',
  },
  b: {
    label: 'Candidate B',
    mp4: '/media/hero-b-1080.mp4',
    webm: '/media/hero-b-1080.webm',
    mobile: '/media/hero-b-720.mp4',
    poster: '/media/hero-b-poster.jpg',
  },
  c: {
    label: 'Candidate C',
    mp4: '/media/hero-c-1080.mp4',
    webm: '/media/hero-c-1080.webm',
    mobile: '/media/hero-c-720.mp4',
    poster: '/media/hero-c-poster.jpg',
  },
} as const

type HeroKey = keyof typeof HEROES

function getInitialHero(): HeroKey {
  if (typeof window === 'undefined') return 'a'
  const value = new URLSearchParams(window.location.search).get('hero')
  return value === 'b' || value === 'c' ? value : 'a'
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [heroKey, setHeroKey] = useState<HeroKey>('a')
  const [paused, setPaused] = useState(false)
  const [posterOnly, setPosterOnly] = useState(false)

  useEffect(() => {
    setHeroKey(getInitialHero())
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = 'connection' in navigator
      ? Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
      : false
    setPosterOnly(reduceMotion || saveData)
  }, [])

  const hero = useMemo(() => HEROES[heroKey], [heroKey])

  useEffect(() => {
    if (!videoRef.current || posterOnly) return
    videoRef.current.load()
    videoRef.current.play().catch(() => setPaused(true))
    setPaused(false)
  }, [hero, posterOnly])

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
    <div className="hero-media" aria-hidden={posterOnly ? undefined : true}>
      <img className="hero-poster" src={hero.poster} alt="" aria-hidden="true" />
      {!posterOnly && (
        <video
          ref={videoRef}
          className="hero-video"
          poster={hero.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setPosterOnly(true)}
          aria-hidden="true"
        >
          <source src={hero.mobile} media="(max-width: 768px)" type="video/mp4" />
          <source src={hero.webm} type="video/webm" />
          <source src={hero.mp4} type="video/mp4" />
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
          <span>{hero.label}</span>
        </button>
      )}
    </div>
  )
}
