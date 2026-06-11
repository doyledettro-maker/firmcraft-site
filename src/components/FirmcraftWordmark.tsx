/**
 * Firmcraft wordmark — integrated lockup (mark refresh "1+4").
 *
 * The italic Source Serif 4 F is simultaneously the brand mark and the first
 * letter of "Firmcraft"; the rest of the word is upright Geist 600. No ring,
 * no separate mark. Mirrors the admin app's FirmcraftWordmark.
 *
 * Construction (docs/design_handoff_visual_refresh/mark-refresh.html, .lockup-int):
 * baseline-aligned, F at 1.25× the wordmark size, F letter-spacing −0.04em,
 * F tucked into "irmcraft" with −0.02em margin, wordmark tracking −0.024em.
 */

type WordmarkVariant = 'default' | 'inverse'

export function FirmcraftWordmark({
  variant = 'default',
  size = 21,
  className,
}: {
  /** 'default' for light surfaces, 'inverse' for the console/footer. */
  variant?: WordmarkVariant
  /** Wordmark font size in px; the F renders at 1.25×. */
  size?: number
  className?: string
}) {
  return (
    <span
      className={['fc-lockup', variant === 'inverse' ? 'inverse' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{ fontSize: size }}
      aria-label="Firmcraft"
    >
      <span className="fc-lockup-f" style={{ fontSize: Math.round(size * 1.25) }} aria-hidden="true">
        F
      </span>
      <span aria-hidden="true">irmcraft</span>
    </span>
  )
}
