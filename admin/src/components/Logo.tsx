import { FirmcraftWordmark } from './FirmcraftWordmark'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className ?? ''}`}>
      <FirmcraftWordmark variant="dark" size={19} />
      <span className="text-muted text-[11px] font-mono uppercase tracking-eyebrow">
        /admin
      </span>
    </span>
  )
}
