import { BrandMark } from './BrandMark'

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] py-10 text-[13px] text-muted">
      <div className="max-w-[1280px] mx-auto px-8 flex justify-between items-center flex-wrap gap-4">
        <span className="flex items-center gap-2.5 font-serif-warm italic font-medium text-[22px] tracking-[-0.01em] text-ink">
          <BrandMark /> Firmcraft
        </span>
        <div className="flex gap-7 font-mono-warm text-[11px] tracking-[0.08em] uppercase">
          <span>© 2026 SkillCalibrate Co.</span>
          <span>SOC 2 In Progress</span>
          <span>
            50+ seats?{' '}
            <a
              href="https://skillcalibrate.com"
              className="underline hover:text-ink transition-colors"
            >
              SkillCalibrate.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
