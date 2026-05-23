'use client'

import { useEffect, useRef, useState } from 'react'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers, type SurveySection } from '@/lib/survey'
import type { Respondent } from './RespondentGate'

type Status = 'idle' | 'submitting' | 'error'

export function ReviewAndSubmit({
  token,
  companyName,
  respondent,
  answers,
  onAnswersChange,
  onBack,
  onSuccess,
}: {
  token: string
  companyName: string
  respondent: Respondent
  answers: SurveyAnswers
  onAnswersChange: (next: SurveyAnswers) => void
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
        body: JSON.stringify({
          token,
          respondentEmail: respondent.email,
          answers,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed.')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  const companySections = SURVEY_SECTIONS.filter((s) => s.scope === 'company')
  const individualSections = SURVEY_SECTIONS.filter((s) => s.scope === 'individual')

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted mb-3">
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
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted w-6">
                    {String(s.number).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate">{s.title}</span>
                  <span className="font-mono text-[10.5px] text-muted">
                    {answered}/{s.questions.length}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <div className="mt-5 pt-5 border-t border-[var(--color-line)] flex flex-col gap-2">
          <div className="text-[12px] text-muted leading-[1.55]">
            Reviewing for{' '}
            <span className="text-ink font-medium">{respondent.name}</span>
            <br />
            <span className="font-mono text-[11px]">{respondent.email}</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-signal transition-colors text-left"
          >
            ← Back to chat
          </button>
        </div>
      </aside>

      <div className="flex flex-col gap-5">
        <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-3">
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
            Almost done
          </div>
          <h2 className="font-sans font-medium text-[clamp(26px,3vw,38px)] leading-[1.1] tracking-[-0.015em] m-0 ">
            Review &amp; <em>submit.</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.55] m-0">
            Everything below is editable. The two coloured banners separate company-wide answers
            (shared with everyone from <strong className="text-ink font-medium">{companyName}</strong>)
            from your individual responses.
          </p>
        </div>

        <ReviewGroup
          title="Company-wide"
          subtitle={`Shared with everyone from ${companyName}. If you edit anything here, your teammates will see the update.`}
          tone="company"
          sections={companySections}
          answers={answers}
          onUpdate={update}
        />

        <ReviewGroup
          title="Just for you"
          subtitle={`Tied to ${respondent.email}. Other people from ${companyName} will fill these out separately.`}
          tone="individual"
          sections={individualSections}
          answers={answers}
          onUpdate={update}
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

        <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-[var(--color-line)] rounded-[18px] p-5">
          <button
            type="button"
            onClick={onBack}
            disabled={status === 'submitting'}
            className="btn btn-ghost"
          >
            ← Back to chat
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

function ReviewGroup({
  title,
  subtitle,
  tone,
  sections,
  answers,
  onUpdate,
}: {
  title: string
  subtitle: string
  tone: 'company' | 'individual'
  sections: SurveySection[]
  answers: SurveyAnswers
  onUpdate: (key: string, value: string) => void
}) {
  const bg =
    tone === 'company' ? 'rgba(44,107,240,0.05)' : 'rgba(15,23,42,0.03)'
  const border =
    tone === 'company' ? 'rgba(44,107,240,0.22)' : 'var(--color-line)'

  return (
    <div
      className="rounded-[20px] p-3 sm:p-4 flex flex-col gap-4"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="px-3 sm:px-4 pt-2 flex flex-col gap-1">
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase font-medium" style={{ color: tone === 'company' ? 'var(--color-signal)' : 'var(--color-ink-2)' }}>
          {title}
        </div>
        <p className="text-[13px] text-muted leading-[1.55] m-0">{subtitle}</p>
      </div>

      {sections.map((s) => (
        <section
          key={s.id}
          id={`section-${s.id}`}
          className="bg-white border border-[var(--color-line)] rounded-[14px] p-6 sm:p-7 flex flex-col gap-5 scroll-mt-20"
        >
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium mb-1">
                Section {s.number} of {SURVEY_SECTIONS.length}
              </div>
              <h3 className="font-sans font-medium text-[22px] leading-[1.15] tracking-[-0.01em] m-0">
                {s.title}
              </h3>
            </div>
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
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
                    className="font-sans font-medium text-[15.5px] leading-[1.4] tracking-[-0.005em] text-ink"
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
                    onChange={(v) => onUpdate(key, v)}
                  />
                </div>
              )
            })}
          </div>
        </section>
      ))}
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
      className="w-full rounded-lg border border-[var(--color-line)] bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white resize-none transition-colors leading-[1.55]"
      style={{ minHeight: 84 }}
    />
  )
}
