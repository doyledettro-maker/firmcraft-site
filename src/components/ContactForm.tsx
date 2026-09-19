'use client'

import { useState } from 'react'

type FormState = {
  name: string
  email: string
  company: string
  phone: string
  message: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const initialForm: FormState = {
  name: '',
  email: '',
  company: '',
  phone: '',
  message: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm({
  source = 'contact',
  submitLabel = 'Contact Firmcraft',
}: {
  /** Which page or call to action this form is embedded on. Stored with the lead. */
  source?: string
  submitLabel?: string
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please enter your name.'
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.'
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed.')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-8 sm:p-10 flex flex-col gap-4">
        <div
          className="font-mono font-semibold text-[34px] leading-[0.9]"
          style={{ color: 'var(--color-ok)' }}
        >
          ✓
        </div>
        <h3 className="font-sans font-medium text-[28px] leading-[1.15] tracking-[-0.01em] m-0">
          Thank you. Firmcraft has received it.
        </h3>
        <p className="text-[16.5px] leading-[1.55] text-ink-2 m-0">
          Firmcraft will reply by email. If the matter is time-sensitive, call (217) 303-8319.
        </p>
        <button
          type="button"
          className="btn btn-ghost self-start mt-2"
          onClick={() => {
            setForm(initialForm)
            setStatus('idle')
          }}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-6"
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
            placeholder="Jane Smith"
          />
        </Field>
        <Field label="Work email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
            required
            className={inputClass}
            placeholder="jane@acme.com"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Company" htmlFor="company">
          <input
            id="company"
            name="company"
            type="text"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            autoComplete="organization"
            className={inputClass}
            placeholder="Acme Dental"
          />
        </Field>
        <Field label="Phone" htmlFor="phone" optional>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            autoComplete="tel"
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </Field>
      </div>

      <Field label="What can we help with?" htmlFor="message">
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          rows={5}
          className={`${inputClass} resize-y min-h-[120px]`}
          placeholder="Describe the organization, the systems in place, and the problem Firmcraft should understand."
        />
      </Field>

      {status === 'error' && errorMsg && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-[13.5px]"
          style={{
            color: 'var(--color-operator)',
            background: 'rgba(251,124,80,.08)',
            borderColor: 'rgba(251,124,80,.3)',
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
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>
        <span className="text-[12.5px] text-muted">
          Or email{' '}
          <a
            href="mailto:hello@firmcraft.ai"
            className="text-signal hover:underline underline-offset-[3px]"
          >
            hello@firmcraft.ai
          </a>{' '}
          or call{' '}
          <a
            href="tel:+12173038319"
            className="text-signal hover:underline underline-offset-[3px]"
          >
            (217) 303-8319
          </a>
          .
        </span>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white transition-colors'

function Field({
  label,
  htmlFor,
  required,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted font-medium"
      >
        {label}
        {required && <span className="text-signal"> *</span>}
        {optional && <span className="text-muted/60 normal-case tracking-normal"> (optional)</span>}
      </label>
      {children}
    </div>
  )
}
