'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

const captions = [
  'Tree service. Request: "Send the Hendricks contract to the client." Agent: The contract has been sent to Mark Hendricks for signature. I will let you know when it is signed.',
  "Bakery. Request: \"Order flour and butter for Friday's baking.\" Agent: Ordered from your usual supplier: ten bags of flour and twenty-four pounds of butter, arriving Thursday morning.",
  "Real estate. Request: \"Confirm the four o'clock showing at 212 Elm Street.\" Agent: Confirmed with the buyer's agent for four o'clock. Your reminder is set for three.",
  'Landscaping. Request: "Pull up the work order for the next property." Agent: Work order 1048: spring cleanup, hedge trimming, and mulch for the front beds. The gate code is in the notes.',
  "Dental office. Request: \"Submit the claim for this morning's cleaning.\" Agent: The claim has been submitted to the patient's insurer. I will follow up if it has not been acknowledged within two days.",
  'Names, addresses and figures are illustrative.',
]

export function SmallBusinessVideo() {
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
          <source src="/media/smb-720.mp4" media="(max-width: 768px)" type="video/mp4" />
          <source src="/media/smb-1080.webm" type="video/webm" />
          <source src="/media/smb-1080.mp4" type="video/mp4" />
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
