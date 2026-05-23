'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers, type SurveySection } from '@/lib/survey'
import type { Respondent } from './RespondentGate'

type Step = { sectionIndex: number; questionIndex: number }

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
  token,
  companyName,
  respondent,
  answers,
  onAnswersChange,
  onComplete,
  onSwitchRespondent,
  onSwitchToMarkdown,
}: {
  token: string
  companyName: string
  respondent: Respondent
  answers: SurveyAnswers
  onAnswersChange: (next: SurveyAnswers) => void
  onComplete: () => void
  onSwitchRespondent: () => void
  onSwitchToMarkdown: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Pre-fill draft from saved answer when switching steps.
  useEffect(() => {
    const step = STEPS[stepIndex]
    if (!step) return
    const section = SURVEY_SECTIONS[step.sectionIndex]
    const question = section.questions[step.questionIndex]
    setDraft(answers[answerKey(section.id, question.id)] || '')
    setSaveError('')
  }, [stepIndex, answers])

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

  const transcript = useMemo(
    () => buildTranscript(stepIndex, answers, companyName),
    [stepIndex, answers, companyName],
  )

  async function persistAnswer(value: string) {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/get-started/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          respondentEmail: respondent.email,
          scope: section.scope,
          sectionId: section.id,
          questionId: question.id,
          answer: value,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not save that answer.')
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.')
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    const next = { ...answers, [answerKey(section.id, question.id)]: draft }
    onAnswersChange(next)
    try {
      await persistAnswer(draft)
    } catch {
      // Keep the user on this step so they can retry.
      return
    }
    if (isLast) {
      onComplete()
      return
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  async function handleSkip() {
    // Skipping persists the current draft as-is (could be empty or partial).
    const next = { ...answers, [answerKey(section.id, question.id)]: draft }
    onAnswersChange(next)
    try {
      await persistAnswer(draft)
    } catch {
      return
    }
    if (isLast) {
      onComplete()
      return
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  function handleBack() {
    onAnswersChange({ ...answers, [answerKey(section.id, question.id)]: draft })
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function handleJump(targetSectionIndex: number) {
    onAnswersChange({ ...answers, [answerKey(section.id, question.id)]: draft })
    const target = STEPS.findIndex((s) => s.sectionIndex === targetSectionIndex)
    if (target >= 0) setStepIndex(target)
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted mb-3">
          Sections — {section.number} of {SURVEY_SECTIONS.length}
        </div>
        <ol className="grid gap-1.5 m-0 p-0 list-none">
          {SURVEY_SECTIONS.map((s, i) => {
            const status = sectionStatus(i, stepIndex)
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
                      ? 'bg-white border-[var(--color-line)]'
                      : 'bg-white/40 border-[var(--color-line)] hover:border-[var(--color-line-strong)]',
                  ].join(' ')}
                >
                  <span
                    aria-hidden
                    className={[
                      'inline-grid place-items-center w-6 h-6 rounded-full font-mono text-[11px] flex-none mt-px',
                      status === 'current'
                        ? 'bg-ink text-paper'
                        : status === 'done'
                        ? 'bg-[var(--color-ok)] text-white'
                        : 'bg-[var(--color-line)] text-muted',
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
                    <ScopeChip scope={s.scope} small />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-5 pt-5 border-t border-[var(--color-line)] flex flex-col gap-2">
          <div className="text-[12px] text-muted leading-[1.55]">
            Signed in as{' '}
            <span className="text-ink font-medium">{respondent.name}</span>
            <br />
            <span className="font-mono text-[11px]">{respondent.email}</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToMarkdown}
            className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-signal transition-colors text-left"
          >
            📄 Use markdown templates instead
          </button>
          <button
            type="button"
            onClick={onSwitchRespondent}
            className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-signal transition-colors text-left"
          >
            ← Not you?
          </button>
          <span className="text-[11.5px] text-muted leading-[1.5] mt-2">
            Your answers save as you go. Refresh the page anytime — your progress sticks.
          </span>
        </div>
      </aside>

      {/* Chat */}
      <div className="bg-white border border-[var(--color-line)] rounded-[18px] flex flex-col min-h-[560px]">
        <div className="px-5 sm:px-7 pt-5 pb-3 border-b border-[var(--color-line)]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
                {section.title}
              </div>
              <ScopeChip scope={section.scope} />
            </div>
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              {stepIndex + 1} / {total}
            </div>
          </div>
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'var(--color-line)' }}
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((stepIndex + 1) / total) * 100}%`,
                background: 'var(--color-signal)',
              }}
            />
          </div>
        </div>

        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 flex flex-col gap-4 max-h-[440px] sm:max-h-[520px]"
        >
          {transcript.map((entry, i) => (
            <TranscriptEntry key={i} entry={entry} />
          ))}
        </div>

        <div className="border-t border-[var(--color-line)] px-5 sm:px-7 pt-4 pb-5 flex flex-col gap-3 bg-paper/40 rounded-b-[18px]">
          {section.scope === 'company' && draft.trim().length > 0 && (
            <div className="text-[12px] text-muted leading-[1.55] -mb-1">
              <strong className="text-ink font-medium">Heads up:</strong> this is a company-wide
              question. Anyone else from {companyName} who opens this link will see what you save
              here.
            </div>
          )}
          <AutoTextarea
            value={draft}
            onChange={setDraft}
            placeholder={question.placeholder || 'Type your answer — paragraphs welcome.'}
            onSubmit={handleSend}
          />
          {saveError && (
            <div
              role="alert"
              className="rounded-lg border px-3 py-2 text-[12.5px]"
              style={{
                color: 'var(--color-operator)',
                background: 'rgba(251,124,80,.08)',
                borderColor: 'rgba(251,124,80,.3)',
              }}
            >
              {saveError}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirst || saving}
                className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Skip for now
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={saving}
              className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : isLast ? 'Review my answers →' : 'Send & continue →'}
            </button>
          </div>
          <div className="text-[11.5px] text-muted font-mono tracking-[0.08em]">
            <span aria-hidden>⌘ ↵</span>
            <span className="ml-1.5">to send · Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scope chip ─────────────────────────────────────────────────────────────

function ScopeChip({ scope, small }: { scope: SurveySection['scope']; small?: boolean }) {
  const label = scope === 'company' ? 'Shared with team' : 'Just for you'
  const bg = scope === 'company' ? 'rgba(44,107,240,0.10)' : 'rgba(15,23,42,0.06)'
  const fg = scope === 'company' ? 'var(--color-signal)' : 'var(--color-ink-2)'
  return (
    <span
      className={[
        'inline-block font-mono uppercase tracking-[0.12em] rounded-full',
        small ? 'text-[9.5px] px-1.5 py-0.5 mt-1' : 'text-[10px] px-2 py-0.5',
      ].join(' ')}
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  )
}

// ─── Transcript ─────────────────────────────────────────────────────────────

type TranscriptItem =
  | { kind: 'intro'; text: string; eyebrow: string; scope: SurveySection['scope'] }
  | { kind: 'question'; text: string; guidance?: string; eyebrow: string }
  | { kind: 'answer'; text: string }
  | { kind: 'welcome'; companyName: string }
  | { kind: 'note'; text: string }

function buildTranscript(
  stepIndex: number,
  answers: SurveyAnswers,
  companyName: string,
): TranscriptItem[] {
  const items: TranscriptItem[] = [{ kind: 'welcome', companyName }]

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
        scope: section.scope,
      })

      // If we're entering a company section that already has answers, note it.
      if (section.scope === 'company') {
        const filledCount = section.questions.filter(
          (q) => (answers[answerKey(section.id, q.id)] || '').trim().length > 0,
        ).length
        if (filledCount > 0 && i === stepIndex) {
          items.push({
            kind: 'note',
            text: `Heads up — ${filledCount} of these ${section.questions.length} answers were already filled in by someone else from your team. Review and edit if anything needs updating.`,
          })
        }
      }

      lastSectionEmitted = step.sectionIndex
    }

    items.push({
      kind: 'question',
      eyebrow: `Q${step.questionIndex + 1} of ${section.questions.length}`,
      text: question.prompt,
      guidance: question.guidance,
    })

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
        <div className="flex-1 bg-paper border border-[var(--color-line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <p className="text-[14.5px] leading-[1.55] text-ink m-0">
            Welcome. I&apos;m going to walk us through ten quick sections to scope your operator
            for <strong className="font-medium">{entry.companyName}</strong>. Take as long as you
            need on each answer. Sections marked <em>Shared with team</em> are filled once and
            shared across everyone from your company; the rest are just for you.
          </p>
        </div>
      </div>
    )
  }
  if (entry.kind === 'intro') {
    return (
      <div className="flex items-start gap-3 mt-2">
        <Avatar />
        <div className="flex-1 bg-paper border border-[var(--color-line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-signal font-medium">
              {entry.eyebrow}
            </div>
            <ScopeChip scope={entry.scope} small />
          </div>
          <p className="text-[14.5px] leading-[1.55] text-ink-2 m-0 italic font-sans">
            {entry.text}
          </p>
        </div>
      </div>
    )
  }
  if (entry.kind === 'note') {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8" aria-hidden />
        <div
          className="flex-1 rounded-xl px-4 py-2.5 text-[13px] leading-[1.5] max-w-[680px]"
          style={{
            color: 'var(--color-ink-2)',
            background: 'rgba(44,107,240,0.06)',
            border: '1px solid rgba(44,107,240,0.18)',
          }}
        >
          {entry.text}
        </div>
      </div>
    )
  }
  if (entry.kind === 'question') {
    return (
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="flex-1 bg-white border border-[var(--color-line)] rounded-2xl rounded-tl-md px-4 py-3 max-w-[680px]">
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1">
            {entry.eyebrow}
          </div>
          <p className="font-sans font-medium text-[16.5px] leading-[1.4] tracking-[-0.005em] text-ink m-0">
            {entry.text}
          </p>
          {entry.guidance && (
            <p className="text-[13px] text-muted leading-[1.5] m-0 mt-2">{entry.guidance}</p>
          )}
        </div>
      </div>
    )
  }
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
      className="w-8 h-8 rounded-full grid place-items-center font-sans text-[15px] flex-none"
      style={{ background: 'var(--color-signal)', color: '#fff' }}
    >
      F
    </div>
  )
}

function UserAvatar() {
  return (
    <div
      aria-hidden
      className="w-8 h-8 rounded-full grid place-items-center font-mono text-[11px] tracking-[0.04em] flex-none border border-[var(--color-line-strong)]"
      style={{ background: 'var(--color-surface)', color: 'var(--color-ink)' }}
    >
      You
    </div>
  )
}

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
      className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink resize-none transition-colors leading-[1.55]"
      style={{ minHeight: 80, maxHeight: 420 }}
    />
  )
}

function sectionStatus(
  sectionIndex: number,
  stepIndex: number,
): 'done' | 'current' | 'pending' {
  const currentSectionIndex = STEPS[stepIndex].sectionIndex
  if (sectionIndex < currentSectionIndex) return 'done'
  if (sectionIndex === currentSectionIndex) return 'current'
  return 'pending'
}
