'use client'

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ---------- Button ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...rest },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border'
  const sizing =
    size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-5 text-sm'
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-accent text-white border-accent hover:bg-[#2155CC] hover:border-[#2155CC]',
    ghost: 'bg-transparent text-ink border-line-2 hover:border-ink hover:bg-paper-2',
    danger: 'bg-transparent text-danger border-danger/60 hover:bg-danger hover:text-paper hover:border-danger',
    subtle: 'bg-paper-2 text-ink border-transparent hover:border-line-2',
  }
  return <button ref={ref} className={cn(base, sizing, variants[variant], className)} {...rest} />
})

/* ---------- Card ---------- */

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-paper-2 border border-line rounded-2xl', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5 border-b border-line', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-serif-warm text-2xl tracking-[-0.01em] m-0', className)} {...rest}>
      {children}
    </h3>
  )
}

/* ---------- Form fields ---------- */

export function Label({ className, children, ...rest }: HTMLAttributes<HTMLLabelElement> & { htmlFor?: string }) {
  return (
    <label
      className={cn('block text-[13px] font-medium text-ink mb-1.5', className)}
      {...rest}
    >
      {children}
    </label>
  )
}

export function Hint({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('text-[12.5px] text-muted mt-1.5 leading-snug', className)}>{children}</p>
}

const inputBase =
  'block w-full rounded-lg border border-line-2 bg-paper px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-0 transition-colors'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(inputBase, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(inputBase, 'min-h-[110px] resize-y', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(inputBase, 'pr-9 appearance-none bg-no-repeat', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C9BBA4' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 12px center',
          backgroundSize: '12px 8px',
        }}
        {...rest}
      >
        {children}
      </select>
    )
  },
)

/* ---------- Checkbox / Radio (styled around native) ---------- */

export function Checkbox({
  label,
  description,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-line-2 px-3.5 py-3 bg-paper hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-2">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-accent" {...rest} />
      <div className="flex-1">
        <div className="text-[14px] font-medium text-ink leading-tight">{label}</div>
        {description ? <div className="text-[12.5px] text-muted mt-0.5">{description}</div> : null}
      </div>
    </label>
  )
}

export function Radio({
  label,
  description,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-line-2 px-3.5 py-3 bg-paper hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-2">
      <input type="radio" className="mt-1 h-4 w-4 accent-accent" {...rest} />
      <div className="flex-1">
        <div className="text-[14px] font-medium text-ink leading-tight">{label}</div>
        {description ? <div className="text-[12.5px] text-muted mt-0.5">{description}</div> : null}
      </div>
    </label>
  )
}

/* ---------- Pill / Badge ---------- */

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-paper text-ink-2 border-line-2',
    green: 'bg-[#0F2A1E] text-[#6EE7B7] border-[#6EE7B7]/25',
    amber: 'bg-[#2A2410] text-[#FCD34D] border-[#FCD34D]/25',
    red: 'bg-[#2A1520] text-[#FCA5A5] border-[#FCA5A5]/25',
    blue: 'bg-[#0E2148] text-[#93C5FD] border-[#93C5FD]/25',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-warm text-[10.5px] uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Stepper ---------- */

export function Stepper({
  steps,
  current,
  onJump,
}: {
  steps: { label: string }[]
  current: number
  onJump?: (i: number) => void
}) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending'
        const interactive = onJump && i <= current
        return (
          <li key={i}>
            <button
              type="button"
              disabled={!interactive}
              onClick={interactive ? () => onJump?.(i) : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                status === 'active' && 'bg-paper-2',
                interactive ? 'hover:bg-paper-2 cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex-none grid place-items-center w-6 h-6 rounded-full font-mono-warm text-[11px] border',
                  status === 'done' && 'bg-accent-2 border-accent-2 text-paper',
                  status === 'active' && 'bg-accent border-accent text-white',
                  status === 'pending' && 'bg-paper border-line-2 text-muted',
                )}
              >
                {status === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'text-[13.5px] leading-tight',
                  status === 'active' ? 'text-ink font-medium' : 'text-ink-2',
                  status === 'pending' && 'text-muted',
                )}
              >
                {s.label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Section helpers (for wizard pages) ---------- */

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4', className)}>{children}</div>
}

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col', className)}>{children}</div>
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="font-serif-warm text-[34px] md:text-[40px] leading-[1.05] tracking-[-0.02em] mt-2">
        {title}
      </h2>
      {description ? <p className="text-ink-2 text-[15.5px] leading-relaxed mt-3 max-w-[640px]">{description}</p> : null}
    </div>
  )
}
