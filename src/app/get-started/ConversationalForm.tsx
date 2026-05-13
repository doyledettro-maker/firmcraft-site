'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers } from '@/lib/survey'

type Step = { sectionIndex: number; questionIndex: number }

const STORAGE_KEY = 'firmcraft.getStarted.answers.v1'
const COMPANY_HINT_KEY = 'firmcraft.getStarted.companyHint.v1'

function flattenSteps(): Step[] {
  const steps: Step[] = []
  SURVEY_SECTIONS.forEach((section, sectionIndex) => {
    section.questions.forEach((_, questionIndex) => {
      steps.push({ sectionIndex, questionIndex })
    })
  })
  return steps
}

const STEPS = flattenSteps()

export function ConversationalForm({
  initial,
  onCancel,
  onComplete,
}: {
  initial: SurveyAnswers
  onCancel: () => void
  onComplete: (answers: SurveyAnswers, companyHint: string) => void
}) {
  const [answers, setAnswers] = useState<SurveyAnswers>(initial)
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [companyHint, setCompanyHint] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Restore from local storage on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        setAnswers((prev) => {
          const next: SurveyAnswers = { ...prev }
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') next[k] = v
          }
          return next
        })
      }
      const hint = window.localStorage.getItem(COMPANY_HINT_KEY)
      if (hint) setCompanyHint(hint)
    } catch {
      // ignore
    }
  }, [])

  // Persist answers as the user advances.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      // ignore
    }
  }, [answers])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(COMPANY_HINT_KEY, companyHint)
    } catch {
      // ignore
    }
  }, [companyHint])

  // Pre-fill draft when stepping back to a previously-answered question.
  useEffect(() => {
    const step = STEPS[stepIndex]
    if (!step) return
    const section = SURVEY_SECTIONS[step.sectionIndex]
    const question = section.questions[step.questionIndex]
    setDraft(answers[answerKey(section.id, question.id)] || '')
  }, [stepIndex, answers])

  // Auto-scroll the transcript so the latest exchange is in view.
  useEffect(() => {
    const node = transcriptRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [stepIndex])

  const step = STEPS[stepIndex]
  const section = SURVEY_SECTIONS[step.sectionIndex]
  const question = section.questions[step.questionIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1
  const total = STEPS.length

  // Build the transcript: all prior questions + their answers, then the current
  // section intro (if this is the first question of the section), then the
  // current question.
  const transcript = useMemo(() => buildTranscript(stepIndex, answers), [stepIndex, answers])

  function commitAnswer(): SurveyAnswers {
    const next = { ...answers, [answerKey(section.id, question.id)]: draft }
    setAnswers(next)
    return next
  }

  function handleSend() {
    const next = commitAnswer()
    if (isLast) {
      // Try to extract a companyHint from section 1, question 1 if not set.
      const hint = companyHint || extractCompanyHint(next[answerKey('company', 'overview')] || '')
      onComplete(next, hint)
      return
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  function handleBack() {
    commitAnswer()
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function handleSkip() {
    if (isLast) {
      const hint = companyHint || extractCompanyHint(answers[answerKey('company', 'overview')] || '')
      onComplete(answers, hint)
      return
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  function handleJump(targetSectionIndex: number) {
    commitAnswer()
    const target = STEPS.findIndex((s) => s.sectionIndex === targetSectionIndex)
    if (target >= 0) setStepIndex(target)
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
      {/* Sidebar: section progress */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="font-mono-warm text-[11px] tracking-[0.16em] uppercase text-muted mb-3">
          Sections — {progressLabel(stepIndex)} of {total}
        </div>
        <ol className="grid gap-1.5 m-0 p-0 list-none">
          {SURVEY_SECTIONS.map((s, i) => {
            const status = sectionStatus(i, stepIndex, answers, s)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleJump(i)}
                  className={[
                    'w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-all',
                    status === 'current'
                      ? 'bg-paper border-ink'
                      : status === 'done'
                      ? 'bg-white border-[var(--line)]'
                      : 'bg-white/40 border-[var(--line)] hover:border-[var(--line-2)]',
                  ].join(' ')}
                >
                  <span
                    aria-hidden
                    className={[
                      'inline-grid place-items-center w-6 h-6 rounded-full font-mono-warm text-[11px] flex-none mt-px',
                      status === 'current'
                        ? 'bg-ink text-paper'
                        : status === 'done'
                        ? 'bg-[var(--accent-2)] text-white'
                        : 'bg-[var(--line)] text-muted',
                    ].join(' ')}
                  >
                    {status === 'done' ? '✓' : String(s.number).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={[
                        'block text-[14px] leading-[1.3]',
                        status === 'current' ? 'text-ink font-medium' : 'text-ink-2',
                      ].join(' ')}
                    >
                      {s.title}
                    </span>
                    {status === 'current' && (
                      <span className="block text-[11.5px] text-muted mt-0.5 font-mono-warm tracking-[0.08em] uppercase">
                        Question {step.questionIndex + 1} of {s.questions.length}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-5 pt-5 border-t border-[var(--line)] flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12.5px] font-mono-warm tracking-[0.12em] uppercase text-muted hover:text-accent transition-colors text-left"
          >
            ← Switch method
          </button>
          <span className="text-[11.5px] text-muted leading-[1.5]">
            We auto-save your answers in this browser as you go.
          </span>
        </div>
      </aside>

      {/* Chat */}
      <div className="bg-white border border-[var(--line)] rounded-[18px] flex flex-col min-h-[560px]">
        {/* Progress */}
        <div className="px-5 sm:px-7 pt-5 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted">
              {section.title}
            </div>
            <div className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted">
              {stepIndex + 1} / {total}
            </div>
          </div>
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'var(--line)' }}
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((stepIndex + 1) / total) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>

        {/* Transcript */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 flex flex-col gap-4 max-h-[440px] sm:max-h-[520px]"
        >
          {transcript.map((entry, i) => (
            <TranscriptEntry key={i} entry={entry} />
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--line)] px-5 sm:px-7 pt-4 pb-5 flex flex-col gap-3 bg-paper/40 rounded-b-[18px]">
          <AutoTextarea
            value={draft}
            onChange={setDraft}
            placeholder={question.placeholder || 'Type your answer — paragraphs welcome.'}
            onSubmit={handleSend}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirst}
                className="text-[12.5px] font-mono-warm tracking-[0.12em] uppercase text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="text-[12.5px] font-mono-warm tracking-[0.12em] uppercase text-muted hover:text-ink transition-colors"
              >
                Skip for now
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              className="btn btn-primary"
            >
              {isLast ? 'Review my answers →' : 'Send & continue →'}
            </button>
          </div>
          <div className="text-[11.5px] text-muted font-mono-warm tracking-[0.08em]">
            <span aria-hidden>⌘ ↵</span>
            <span className="ml-1.5">to send · Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Transcript ─────────────────────────────────────────────────────────────

type TranscriptItem =
  | { kind: 'intro'; text: string; eyebrow: string }
  | { kind: 'question'; text: string; guidance?: string; eyebrow: string }
  | { kind: 'answer'; text: string }
  | { kind: 'welcome' }

function buildTranscript(stepIndex: number, answers: SurveyAnswers): TranscriptItem[] {
  const items: TranscriptItem[] = [{ kind: 'welcome' }]

  let lastSectionEmitted = -1

  for (let i = 0; i <= stepIndex; i++) {
    const step = STEPS[i]
    const section = SURVEY_SECTIONS[step.sectionIndex]
    const question = section.questions[step.questionIndex]

    if (step.sectionIndex !== lastSectionEmitted) {
      items.push({
        kind: 'intro',
        eyebrow: `Section ${section.number} of ${SURVEY_SECTIONS.length} — ${section.title}`,
        text: section.intro,
      })
      lastSectionEmitted = step.sectionIndex
    }

    items.push({
      kind: 'question',
      eyebrow: `Q${step.questionIndex + 1} of ${section.questions.length}`,
      text: question.prompt,
      guidance: question.guidance,
    })

    // If we've moved past this question, render the user's answer.
    if (i < stepIndex) {
      const ans = answers[answerKey(section.id, question.id)] || ''
      if (ans.trim().length > 0) {
        items.push({ kind: 'answer', text: ans })
      } else {
        items.push({ kind: 'answer', text: '(skipped)' })
      }
    }
  }

  return items
}

function TranscriptEntry({ entry }: { entry: TranscriptItem }) {
  if (entry.kind === 'welcome') {
    return (
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="flex-1 bg-paper border border-[var(--line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <p className="text-[14.5px] leading-[1.55] text-ink m-0">
            Hey — I&apos;m going to walk us through ten quick sections so we can scope your
            operator. Take as long as you need on each answer. There are no
            character limits, no required fields, and you can rewrite anything before
            it&apos;s submitted. Let&apos;s start.
          </p>
        </div>
      </div>
    )
  }
  if (entry.kind === 'intro') {
    return (
      <div className="flex items-start gap-3 mt-2">
        <Avatar />
        <div className="flex-1 bg-paper border border-[var(--line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <div className="font-mono-warm text-[10.5px] tracking-[0.16em] uppercase text-accent font-medium mb-1">
            {entry.eyebrow}
          </div>
          <p className="text-[14.5px] leading-[1.55] text-ink-2 m-0 font-serif-warm">
            {entry.text}
          </p>
        </div>
      </div>
    )
  }
  if (entry.kind === 'question') {
    return (
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="flex-1 bg-white border border-[var(--line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <div className="font-mono-warm text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1">
            {entry.eyebrow}
          </div>
          <p className="font-serif-warm font-medium text-[16.5px] leading-[1.4] tracking-[-0.005em] text-ink m-0">
            {entry.text}
          </p>
          {entry.guidance && (
            <p className="text-[13px] text-muted leading-[1.5] m-0 mt-2">{entry.guidance}</p>
          )}
        </div>
      </div>
    )
  }
  // answer
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex-1 max-w-[680px] bg-ink text-paper rounded-2xl rounded-tr-md px-4 py-3">
        <p className="text-[14.5px] leading-[1.55] m-0 whitespace-pre-wrap break-words">
          {entry.text}
        </p>
      </div>
      <UserAvatar />
    </div>
  )
}

function Avatar() {
  return (
    <div
      aria-hidden
      className="w-8 h-8 rounded-full grid place-items-center font-serif-warm text-[15px] flex-none"
      style={{ background: 'var(--accent)', color: '#fff' }}
    >
      F
    </div>
  )
}

function UserAvatar() {
  return (
    <div
      aria-hidden
      className="w-8 h-8 rounded-full grid place-items-center font-mono-warm text-[11px] tracking-[0.04em] flex-none border border-[var(--line-2)]"
      style={{ background: 'var(--paper)', color: 'var(--ink)' }}
    >
      You
    </div>
  )
}

// ─── Auto-growing textarea ──────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onSubmit: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault()
          onSubmit()
        }
      }}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink resize-none transition-colors leading-[1.55]"
      style={{ minHeight: 80, maxHeight: 420 }}
    />
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function progressLabel(stepIndex: number): number {
  return SURVEY_SECTIONS[STEPS[stepIndex].sectionIndex].number
}

function sectionStatus(
  sectionIndex: number,
  stepIndex: number,
  answers: SurveyAnswers,
  section: typeof SURVEY_SECTIONS[number],
): 'done' | 'current' | 'pending' {
  const currentSectionIndex = STEPS[stepIndex].sectionIndex
  if (sectionIndex < currentSectionIndex) return 'done'
  if (sectionIndex === currentSectionIndex) {
    // If current section is the very last one and we're on its last question
    // and it has been answered, count it as done.
    const isLastSection = sectionIndex === SURVEY_SECTIONS.length - 1
    if (isLastSection) {
      const allAnswered = section.questions.every((q) =>
        (answers[answerKey(section.id, q.id)] || '').trim().length > 0,
      )
      return allAnswered && stepIndex === STEPS.length - 1 ? 'current' : 'current'
    }
    return 'current'
  }
  return 'pending'
}

function extractCompanyHint(overviewAnswer: string): string {
  if (!overviewAnswer) return ''
  const trimmed = overviewAnswer.trim()
  if (!trimmed) return ''
  // Take the first sentence-ish chunk, or the part before a dash.
  const firstLine = trimmed.split(/\r?\n/)[0]
  const dash = firstLine.split(/[—–-]/)[0]
  return dash.trim().slice(0, 80)
}

