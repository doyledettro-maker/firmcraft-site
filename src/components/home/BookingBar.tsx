'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Phone-only booking bar (shown under 700px by CSS). It slides away while any
 * other booking button ([data-cta]) is on screen, so two never show at once.
 */
export function BookingBar() {
  const [hidden, setHidden] = useState(false)
  const seen = useRef(new Set<Element>())

  useEffect(() => {
    const targets = document.querySelectorAll('[data-cta]')
    if (!targets.length || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) seen.current.add(e.target)
        else seen.current.delete(e.target)
      })
      setHidden(seen.current.size > 0)
    })
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  return (
    <div className={`fl-mbar${hidden ? ' fl-hide' : ''}`} role="complementary" aria-label="Book a call">
      <a className="fl-btn fl-primary" href="/diagnostic" tabIndex={hidden ? -1 : undefined}>
        Book a 30-minute call
      </a>
    </div>
  )
}
