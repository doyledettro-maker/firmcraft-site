'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

const captions = [
  "Auto service. Request: \"Order brake pads for the car in bay three.\" Agent: The parts department has the order. The pads will be at bay three by two o'clock, and the customer has been told the car will be ready at five.",
  "Bakery. Request: \"Order flour and butter for Friday's baking.\" Agent: Ordered from your usual supplier: ten bags of flour and twenty-four pounds of butter, arriving Thursday morning.",
  "Real estate. Request: \"Confirm the four o'clock showing at 212 Elm Street.\" Agent: Confirmed with the buyer's agent for four o'clock. Your reminder is set for three.",
  'Landscaping. Request: "Pull up the work order for the next property." Agent: Work order 1048: spring cleanup, hedge trimming, and mulch for the front beds. The gate code is in the notes.',
  "Dental office. Request: \"Submit the claim for this morning's cleaning.\" Agent: The claim has been submitted to the patient's insurer. I will follow up if it has not been acknowledged within two days.",
  'Names, addresses and figures are illustrative.',
]

const SMB_VIDEO = {
  mp4: '/media/smb-1080.mp4?v=2',
  webm: '/media/smb-1080.webm?v=2',
  mobile: '/media/smb-720.mp4?v=2',
} as const

function getPreferredSmbMp4() {
  if (typeof window === 'undefined') return SMB_VIDEO.mp4
  return window.matchMedia('(max-width: 768px)').matches ? SMB_VIDEO.mobile : SMB_VIDEO.mp4
}

export function SmallBusinessVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [ended, setEnded] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [paused, setPaused] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mp4Source, setMp4Source] = useState<string>(SMB_VIDEO.mp4)

  useEffect(() => {
    setMp4Source(getPreferredSmbMp4())
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateSource = () => setMp4Source(getPreferredSmbMp4())
    mediaQuery.addEventListener('change', updateSource)
    return () => mediaQuery.removeEventListener('change', updateSource)
  }, [])

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

  function handleFinalSourceError() {
    const video = videoRef.current
    if (!video) return
    if (
      video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
      video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
    ) {
      setPaused(true)
    }
  }

  return (
    <div className="process-video-block smb-video-block">
      <div
        className="process-video-frame"
        style={{ '--video-poster': "url('/media/smb-poster.jpg')" } as CSSProperties}
      >
        <video
          ref={videoRef}
          aria-label="Video: examples of a managed AI agent handling routine tasks for small businesses"
          className="process-video"
          muted
          playsInline
          preload="none"
          poster="/media/smb-poster.jpg"
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
          onEnded={() => {
            setEnded(true)
            setPaused(true)
          }}
        >
          <source src={mp4Source} type="video/mp4" />
          <source src={SMB_VIDEO.webm} type="video/webm" onError={handleFinalSourceError} />
        </video>

        <div className="process-video-controls">
          {ended ? (
            <button type="button" onClick={replay} aria-label="Replay small business video">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Replay</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={paused ? 'Play small business video' : 'Pause small business video'}
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
