/** The Firmcraft mark: an F standing over a double rule, as on a ledger total. */
export function FirmcraftMark({ size = 30, color = '#0F3D2B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill={color} aria-hidden="true">
      <rect x="9" y="4" width="5" height="26" />
      <rect x="9" y="4" width="22" height="5" />
      <rect x="9" y="15" width="16" height="5" />
      <rect x="4" y="33" width="32" height="1.6" />
      <rect x="4" y="36.4" width="32" height="1.6" />
    </svg>
  )
}
