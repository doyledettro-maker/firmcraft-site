'use client'

import { useEffect, useState } from 'react'
import type { SurveyAnswers } from '@/lib/survey'

export type Respondent = {
  email: string
  name: string
  role: string
}

const STORAGE_KEY_PREFIX = 'firmcraft.getStarted.respondent.v2.'

export function RespondentGate({
  token,
  companyName,
  onReady,
}: {
  token: string
  companyName: string
  onReady: (respondent: Respondent, mergedAnswers: SurveyAnswers) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Restore last identity from this browser (if the same person reopened the link).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + token)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<Respondent>
      if (parsed.name) setName(parsed.name)
      if (parsed.role) setRole(parsed.role)
      if (parsed.email) setEmail(parsed.email)
    } catch {
      // ignore
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    if (!name.trim() || !role.trim() || !trimmedEmail) {
      setError('Name, role, and email are all required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/get-started/respondent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: trimmedEmail,
          name: name.trim(),
          role: role.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not register you for this survey.')
      }
      const data = (await res.json()) as {
        ok: true
        companyAnswers: SurveyAnswers
        individualAnswers: SurveyAnswers
      }

      try {
        window.localStorage.setItem(
          STORAGE_KEY_PREFIX + token,
          JSON.stringify({ name: name.trim(), role: role.trim(), email: trimmedEmail }),
        )
      } catch {
        // ignore
      }

      onReady(
        { email: trimmedEmail, name: name.trim(), role: role.trim() },
        { ...data.companyAnswers, ...data.individualAnswers },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-7 sm:p-10 flex flex-col gap-6 max-w-[640px] mx-auto">
      <div>
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium mb-2">
          Before we start
        </div>
        <h2 className="font-sans font-medium text-[clamp(24px,2.6vw,32px)] leading-[1.1] tracking-[-0.015em] m-0 ">
          Who are we talking to?
        </h2>
        <p className="text-[15px] leading-[1.6] text-ink-2 m-0 mt-3">
          You&apos;re filling this out on behalf of{' '}
          <strong className="text-ink font-medium">{companyName}</strong>. A few sections are
          shared across everyone from your team — once anyone answers them, the rest of the team
          will see those answers pre-filled. The other sections are just for you.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field
          label="Your name"
          value={name}
          onChange={setName}
          placeholder="Jane Owner"
          autoFocus
        />
        <Field
          label="Your role"
          value={role}
          onChange={setRole}
          placeholder="President / Head of Operations / …"
        />
        <Field
          label="Your email"
          value={email}
          onChange={setEmail}
          placeholder="jane@acme.com"
          type="email"
          helper="We use this to keep your answers separate from other people on your team and to follow up after submission."
        />

        {error && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-[13.5px]"
            style={{
              color: 'var(--color-operator)',
              background: 'rgba(251,124,80,.08)',
              borderColor: 'rgba(251,124,80,.3)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary self-start mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? 'One sec…' : 'Start the survey →'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  helper,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  helper?: string
  autoFocus?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted font-medium">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="rounded-lg border border-[var(--color-line)] bg-paper px-3 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white transition-colors"
      />
      {helper && <span className="text-[12px] text-muted leading-[1.5] mt-1">{helper}</span>}
    </label>
  )
}
