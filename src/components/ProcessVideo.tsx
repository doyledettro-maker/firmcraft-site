'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const captions = [
  'In most processes, the work itself takes a small share of the elapsed time. Most of the time is spent waiting between steps.',
  "Discovery. Interviews and the organization's own system records establish how the work actually proceeds, including the exceptions.",
  'Process redesign. Each step is removed, handled by conventional software, assigned to an AI agent, or kept with a person.',
  'Process redesign. Current performance is measured before anything is built, so that results can be compared against it.',
  'Implementation. The redesigned process is built inside the systems the organization already uses.',
  'Training and evaluation, and ongoing support. People are trained on their own work, and results are reported against the starting measurement.',
]

export function ProcessVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [ended, setEnded] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [paused, setPaused] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    if (mediaQuery.matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting && !hasPlayed && !ended) {
          video.play().then(() => {
            setHasPlayed(true)
            setPaused(false)
          }).catch(() => {
            setPaused(true)
          })
          return
        }
        if (!entry.isIntersecting && !video.paused) {
          video.pause()
          setPaused(true)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [ended, hasPlayed])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => {
        setHasPlayed(true)
        setEnded(false)
        setPaused(false)
      }).catch(() => {
        setPaused(true)
      })
      return
    }

    video.pause()
    setPaused(true)
  }

  function replay() {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().then(() => {
      setHasPlayed(true)
      setEnded(false)
      setPaused(false)
    }).catch(() => {
      setPaused(true)
    })
  }

  return (
    <div className="process-video-block">
      <div className="process-video-frame">
        <video
          ref={videoRef}
          aria-label="Video: how Firmcraft approaches a process"
          className="process-video"
          muted
          playsInline
          preload="none"
          poster="/media/process-poster.jpg"
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
          onEnded={() => {
            setEnded(true)
            setPaused(true)
          }}
        >
          <source src="/media/process-720.mp4?v=2" media="(max-width: 768px)" type="video/mp4" />
          <source src="/media/process-1080.webm?v=2" type="video/webm" />
          <source src="/media/process-1080.mp4?v=2" type="video/mp4" />
        </video>

        <div className="process-video-controls">
          {ended ? (
            <button type="button" onClick={replay} aria-label="Replay process video">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Replay</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={paused ? 'Play process video' : 'Pause process video'}
            >
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              <span>{paused || reducedMotion ? 'Play' : 'Pause'}</span>
            </button>
          )}
        </div>
      </div>

      <details className="process-video-transcript">
        <summary>Text version of this video</summary>
        <ol>
          {captions.map((caption) => (
            <li key={caption}>{caption}</li>
          ))}
        </ol>
      </details>
    </div>
  )
}
