type BrandMarkProps = {
  size?: number
  className?: string
}

// Operator console plate: dark slate ring, signal-blue F glyph.
// F is geometric sans (Geist), not the italic serif of the wordmark —
// the mark is the engineered companion to the typographic wordmark.
export function BrandMark({ size = 22, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="14"
        stroke="#0F172A"
        strokeWidth="2.5"
        fill="none"
      />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans), Geist, system-ui, sans-serif"
        fontStyle="normal"
        fontWeight={700}
        fontSize="36"
        fill="#2C6BF0"
        letterSpacing="-1.5"
      >
        F
      </text>
    </svg>
  )
}
