type BrandMarkProps = {
  size?: number
  className?: string
}

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
      <circle
        cx="32"
        cy="32"
        r="29"
        stroke="#2D1F14"
        strokeWidth="2.5"
        fill="none"
      />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="var(--font-serif), 'Source Serif 4', Georgia, serif"
        fontStyle="italic"
        fontWeight={500}
        fontSize="36"
        fill="#D97757"
        letterSpacing="-1"
      >
        F
      </text>
    </svg>
  )
}
