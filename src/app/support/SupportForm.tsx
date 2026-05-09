'use client'

import { useState } from 'react'

type Urgency = 'general' | 'not_working' | 'urgent'

const URGENCY_OPTIONS: {
  value: Urgency
  label: string
  description: string
  timeframe: string
}[] = [
  {
    value: 'general',
    label: 'General question',
    description: 'No rush — info, ideas, or how-to.',
    timeframe: '24 hours',
  },
  {
    value: 'not_working',
    label: "Something's not working",
    description: 'A workflow or integration is broken.',
    timeframe: '4 hours',
  },
  {
    value: 'urgent',
    label: 'Urgent — business impact',
    description: "Operator is down, money or clients at stake.",
    timeframe: '1 hour',
  },
]

type FormState = {
  name: string
  company: string
  description: string
  urgency: Urgency
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const initialForm: FormState = {
  name: '',
  company: '',
  description: '',
  urgency: 'general',
}

export function SupportForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [successInfo, setSuccessInfo] = useState<{ timeframe: string } | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please enter your name.'
    if (!form.company.trim()) return 'Please enter your company.'
    if (form.description.trim().length < 10)
      return 'Please describe the issue (at least 10 characters).'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const v = validate()
    if (v) {
      setErrorMsg(v)
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed.')
      }
      const opt = URGENCY_OPTIONS.find((o) => o.value === form.urgency)!
      setSuccessInfo({ timeframe: opt.timeframe })
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  if (status === 'success' && successInfo) {
    return (
      <div className="bg-white border border-[var(--line)] rounded-[18px] p-8 sm:p-10 flex flex-col gap-4">
        <div
          className="font-serif-warm italic font-medium text-[34px] leading-[0.9]"
          style={{ color: 'var(--accent-2)' }}
        >
          ✓
        </div>
        <h3 className="font-serif-warm font-medium text-[28px] leading-[1.15] tracking-[-0.01em] m-0 serif-h">
          We&apos;ve got it.
        </h3>
        <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0">
          You&apos;ll hear from us within{' '}
          <strong className="text-ink font-medium">{successInfo.timeframe}</strong>. If your
          situation changes — or this becomes urgent — reply to our email or text Doyle directly at
          (217) 206-5142.
        </p>
        <button
          type="button"
          className="btn btn-ghost self-start mt-2"
          onClick={() => {
            setForm(initialForm)
            setStatus('idle')
            setSuccessInfo(null)
          }}
        >
          Send another →
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-6"
    >
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Name" htmlFor="name" required>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
            required
            className={inputClass}
            placeholder="Jane Partner"
          />
        </Field>
        <Field label="Company" htmlFor="company" required>
          <input
            id="company"
            name="company"
            type="text"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            autoComplete="organization"
            required
            className={inputClass}
            placeholder="Acme Dental"
          />
        </Field>
      </div>

      <Field label="What's going on?" htmlFor="description" required>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          required
          rows={5}
          className={`${inputClass} resize-y min-h-[120px]`}
          placeholder="Tell us what you're seeing, what you expected, and any error messages."
        />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium mb-1">
          Urgency
        </legend>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {URGENCY_OPTIONS.map((opt) => {
            const selected = form.urgency === opt.value
            return (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-xl border p-4 flex flex-col gap-1 transition-all',
                  selected
                    ? 'border-ink bg-paper'
                    : 'border-[var(--line)] bg-white hover:border-[var(--line-2)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={opt.value}
                  checked={selected}
                  onChange={() => update('urgency', opt.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={[
                      'inline-block w-3.5 h-3.5 rounded-full border-2 flex-none',
                      selected ? 'border-ink' : 'border-[var(--line-2)]',
                    ].join(' ')}
                    style={{
                      background: selected ? 'var(--ink)' : 'transparent',
                      boxShadow: selected ? 'inset 0 0 0 2px #fff' : undefined,
                    }}
                  />
                  <span className="font-serif-warm font-medium text-[15.5px] tracking-[-0.005em] text-ink">
                    {opt.label}
                  </span>
                </span>
                <span className="text-[12.5px] text-muted leading-[1.4] pl-6">
                  {opt.description}
                </span>
                <span
                  className="font-mono-warm text-[10.5px] tracking-[0.12em] uppercase pl-6 mt-1"
                  style={{ color: selected ? 'var(--accent)' : 'var(--muted)' }}
                >
                  Reply within {opt.timeframe}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {status === 'error' && errorMsg && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-[13.5px]"
          style={{
            color: '#B45A3A',
            background: 'rgba(180,90,58,.08)',
            borderColor: 'rgba(180,90,58,.3)',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn btn-primary btn-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending…' : 'Send to Firmcraft →'}
        </button>
        <span className="text-[12.5px] text-muted">
          Or email{' '}
          <a
            href="mailto:hello@firmcraft.ai"
            className="text-accent hover:underline underline-offset-[3px]"
          >
            hello@firmcraft.ai
          </a>
          .
        </span>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-[var(--line)] bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white transition-colors'

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium"
      >
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
    </div>
  )
}
