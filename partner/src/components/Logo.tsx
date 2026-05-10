export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <span className="w-7 h-7 rounded-full bg-accent grid place-items-center text-white font-serif-warm italic text-[14px] font-medium">
        F
      </span>
      <span className="font-serif-warm text-[19px] tracking-[-0.01em]">
        Firmcraft <span className="text-muted text-[14px] font-mono-warm uppercase tracking-[0.14em] ml-1">/admin</span>
      </span>
    </span>
  )
}
