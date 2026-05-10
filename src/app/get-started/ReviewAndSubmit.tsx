'use client'

import { useEffect, useRef, useState } from 'react'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers } from '@/lib/survey'

type Status = 'idle' | 'submitting' | 'error'

export function ReviewAndSubmit({
  answers,
  method,
  companyHint,
  onAnswersChange,
  onCompanyHintChange,
  onBack,
  onSuccess,
}: {
  answers: SurveyAnswers
  method: 'conversational' | 'markdown'
  companyHint: string
  onAnswersChange: (next: SurveyAnswers) => void
  onCompanyHintChange: (hint: string) => void
  onBack: () => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string>('')

  function update(key: string, value: string) {
    onAnswersChange({ ...answers, [key]: value })
  }

  async function submit() {
    setStatus('submitting')
    setError('')
    try {
      const res = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, answers, companyHint }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed.')
      }
      // Clear local cached drafts only after a successful submit.
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('firmcraft.getStarted.answers.v1')
          window.localStorage.removeItem('firmcraft.getStarted.companyHint.v1')
        }
      } catch {
        // ignore
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="font-mono-warm text-[11px] tracking-[0.16em] uppercase text-muted mb-3">
          Review · {answeredCount(answers)} of {totalQ()} answered
        </div>
        <ol className="grid gap-1 m-0 p-0 list-none">
          {SURVEY_SECTIONS.map((s) => {
            const answered = s.questions.filter((q) =>
              (answers[answerKey(s.id, q.id)] || '').trim().length > 0,
            ).length
            return (
              <li key={s.id}>
                <a
                  href={`#section-${s.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] text-ink-2 hover:bg-paper hover:text-ink transition-colors"
                >
                  <span className="font-mono-warm text-[10.5px] tracking-[0.08em] text-muted w-6">
                    {String(s.number).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate">{s.title}</span>
                  <span className="font-mono-warm text-[10.5px] text-muted">
                    {answered}/{s.questions.length}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <div className="mt-5 pt-5 border-t border-[var(--line)] flex flex-col gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-[12.5px] font-mono-warm tracking-[0.12em] uppercase text-muted hover:text-accent transition-colors text-left"
          >
            ← {method === 'conversational' ? 'Back to chat' : 'Re-upload file'}
          </button>
        </div>
      </aside>

      {/* Review body */}
      <div className="flex flex-col gap-5">
        <div className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-3">
          <div className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-accent font-medium">
            Almost done
          </div>
          <h2 className="font-serif-warm font-medium text-[clamp(26px,3vw,38px)] leading-[1.1] tracking-[-0.015em] m-0 serif-h">
            Review &amp; <em>submit.</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.55] m-0">
            Everything below is editable. Tweak anything that doesn&apos;t read
            right, fill in anything you skipped, and hit submit when you&apos;re
            ready.
          </p>
          <label className="flex flex-col gap-1 mt-3 max-w-[420px]">
            <span className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium">
              Company name (for our records)
            </span>
            <input
              type="text"
              value={companyHint}
              onChange={(e) => onCompanyHintChange(e.target.value)}
              placeholder="Acme Co."
              className="rounded-lg border border-[var(--line)] bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white transition-colors"
            />
          </label>
        </div>

        {SURVEY_SECTIONS.map((s) => (
          <section
            key={s.id}
            id={`section-${s.id}`}
            className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-5 scroll-mt-20"
          >
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-accent font-medium mb-1">
                  Section {s.number} of {SURVEY_SECTIONS.length}
                </div>
                <h3 className="font-serif-warm font-medium text-[24px] leading-[1.15] tracking-[-0.01em] m-0">
                  {s.title}
                </h3>
              </div>
              <span className="font-mono-warm text-[11px] tracking-[0.1em] uppercase text-muted">
                {s.questions.filter((q) => (answers[answerKey(s.id, q.id)] || '').trim().length > 0).length}{' '}
                of {s.questions.length} answered
              </span>
            </div>

            <div className="grid gap-5">
              {s.questions.map((q) => {
                const key = answerKey(s.id, q.id)
                return (
                  <div key={q.id} className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`a-${key}`}
                      className="font-serif-warm font-medium text-[15.5px] leading-[1.4] tracking-[-0.005em] text-ink"
                    >
                      {q.prompt}
                    </label>
                    {q.guidance && (
                      <p className="text-[12.5px] text-muted leading-[1.5] m-0">{q.guidance}</p>
                    )}
                    <AutoTextarea
                      id={`a-${key}`}
                      value={answers[key] || ''}
                      placeholder={q.placeholder || 'Your answer — paragraphs welcome.'}
                      onChange={(v) => update(key, v)}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {error && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-[13.5px]"
            style={{
              color: '#B45A3A',
              background: 'rgba(180,90,58,.08)',
              borderColor: 'rgba(180,90,58,.3)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-[var(--line)] rounded-[18px] p-5">
          <button
            type="button"
            onClick={onBack}
            disabled={status === 'submitting'}
            className="btn btn-ghost"
          >
            ← {method === 'conversational' ? 'Back to chat' : 'Re-upload'}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={status === 'submitting'}
            className="btn btn-primary btn-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit survey →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function totalQ(): number {
  return SURVEY_SECTIONS.reduce((n, s) => n + s.questions.length, 0)
}

function answeredCount(answers: SurveyAnswers): number {
  let n = 0
  for (const s of SURVEY_SECTIONS) {
    for (const q of s.questions) {
      if ((answers[answerKey(s.id, q.id)] || '').trim().length > 0) n++
    }
  }
  return n
}

function AutoTextarea({
  id,
  value,
  placeholder,
  onChange,
}: {
  id?: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 84)}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-lg border border-[var(--line)] bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white resize-none transition-colors leading-[1.55]"
      style={{ minHeight: 84 }}
    />
  )
}
