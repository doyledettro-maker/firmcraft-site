/**
 * Firmcraft wordmark — integrated lockup.
 *
 * The blue F is simultaneously the brand mark and the first letter of
 * "Firmcraft". Doyle's current direction is for the F to use the same upright
 * Geist wordmark face as the rest of the name, not the older italic serif F.
 * No ring, no separate mark, no clearspace arithmetic.
 *
 * Construction (from docs/design_handoff_visual_refresh/mark-refresh.html):
 * baseline-aligned, F at 1.06× the wordmark size, F tucked into "irmcraft"
 * with tight margin, wordmark tracking −0.024em.
 */

type WordmarkVariant = 'default' | 'dark' | 'signal' | 'operator' | 'mark-only'

const VARIANT_COLORS: Record<
  Exclude<WordmarkVariant, 'mark-only'>,
  { f: string; word: string }
> = {
  // Light surfaces: signal F, ink wordmark.
  default: { f: 'text-signal', word: 'text-ink' },
  // Console surfaces: signal blue reads correctly on both surface families.
  dark: { f: 'text-signal', word: 'text-inverse' },
  // Full-color plates: everything goes white.
  signal: { f: 'text-white', word: 'text-white' },
  operator: { f: 'text-white', word: 'text-white' },
}

export function FirmcraftWordmark({
  variant = 'default',
  size = 20,
  className,
}: {
  variant?: WordmarkVariant
  /** Wordmark font size in px; the F renders at 1.06×. */
  size?: number
  className?: string
}) {
  const markOnly = variant === 'mark-only'
  const { f, word } = VARIANT_COLORS[markOnly ? 'default' : variant]

  return (
    <span
      className={[
        'inline-flex items-baseline leading-none font-sans font-semibold tracking-tighter',
        word,
        className ?? '',
      ].join(' ')}
      style={{ fontSize: size }}
      aria-label="Firmcraft"
    >
      <span
        className={`font-sans not-italic font-semibold leading-none ${f}`}
        style={{
          fontSize: Math.round(size * 1.06),
          letterSpacing: '-0.024em',
          marginRight: markOnly ? 0 : '-0.035em',
        }}
        aria-hidden="true"
      >
        F
      </span>
      {!markOnly && <span aria-hidden="true">irmcraft</span>}
    </span>
  )
}
