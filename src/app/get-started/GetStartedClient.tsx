'use client'

import { useState } from 'react'
import { ConversationalForm } from './ConversationalForm'
import { MarkdownForm } from './MarkdownForm'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { RespondentGate, type Respondent } from './RespondentGate'
import { type SurveyAnswers, emptyAnswers } from '@/lib/survey'

type Mode = 'gate' | 'pick' | 'chat' | 'markdown' | 'review' | 'success'

export function GetStartedClient({
  token,
  companyName,
  initialCompanyAnswers,
}: {
  token: string
  companyName: string
  initialCompanyAnswers: SurveyAnswers
}) {
  const [mode, setMode] = useState<Mode>('gate')
  const [respondent, setRespondent] = useState<Respondent | null>(null)
  const [answers, setAnswers] = useState<SurveyAnswers>(() => ({
    ...emptyAnswers(),
    ...initialCompanyAnswers,
  }))

  if (mode === 'gate') {
    return (
      <RespondentGate
        token={token}
        companyName={companyName}
        onReady={(r, merged) => {
          setRespondent(r)
          setAnswers((prev) => ({ ...prev, ...merged }))
          setMode('pick')
        }}
      />
    )
  }

  if (!respondent) {
    setMode('gate')
    return null
  }

  if (mode === 'pick') {
    return (
      <ModePicker
        onPick={(m) => setMode(m)}
        companyName={companyName}
        respondent={respondent}
      />
    )
  }

  if (mode === 'chat') {
    return (
      <ConversationalForm
        token={token}
        companyName={companyName}
        respondent={respondent}
        answers={answers}
        onAnswersChange={setAnswers}
        onComplete={() => setMode('review')}
        onSwitchRespondent={() => setMode('gate')}
        onSwitchToMarkdown={() => setMode('markdown')}
      />
    )
  }

  if (mode === 'markdown') {
    return (
      <MarkdownForm
        token={token}
        companyName={companyName}
        respondent={respondent}
        answers={answers}
        onAnswersChange={setAnswers}
        onBack={() => setMode('pick')}
        onContinue={() => setMode('review')}
      />
    )
  }

  if (mode === 'review') {
    return (
      <ReviewAndSubmit
        token={token}
        companyName={companyName}
        respondent={respondent}
        answers={answers}
        onAnswersChange={setAnswers}
        onBack={() => setMode('chat')}
        onSuccess={() => setMode('success')}
      />
    )
  }

  return <SuccessCard companyName={companyName} respondent={respondent} />
}

function ModePicker({
  onPick,
  companyName,
  respondent,
}: {
  onPick: (m: 'chat' | 'markdown') => void
  companyName: string
  respondent: Respondent
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/60 border border-[var(--color-line)] rounded-[14px] px-5 py-4 max-w-[760px]">
        <p className="text-[14px] text-ink-2 leading-[1.55] m-0">
          Hi <strong className="text-ink font-medium">{respondent.name}</strong> — you&apos;re
          filling this out for{' '}
          <strong className="text-ink font-medium">{companyName}</strong>. Pick whichever way
          suits you. You can switch between them anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={() => onPick('chat')}
          className="text-left bg-white border border-[var(--color-line)] rounded-[18px] p-7 sm:p-8 transition-all hover:border-ink hover:shadow-[0_18px_36px_-22px_rgba(15,23,42,.18)] hover:-translate-y-[1px] flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
              Option A
            </span>
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              ~10 min
            </span>
          </div>
          <h2 className="font-sans font-medium text-[clamp(24px,2.4vw,32px)] leading-[1.1] tracking-[-0.015em] m-0 ">
            Walk me through it. <em>Conversation style.</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.55] m-0">
            A guided chat that asks one question at a time. Answers save as you go, and your
            teammates pick up wherever you left off on the shared sections.
          </p>
          <ul className="grid gap-1.5 text-[13.5px] text-muted m-0 p-0 list-none">
            <li>· Best if you want to do this in one sitting in the browser</li>
            <li>· Auto-saves to your account on every answer</li>
            <li>· Pre-filled if anyone from {companyName} already answered</li>
          </ul>
          <span className="btn btn-primary self-start mt-1">Start the conversation →</span>
        </button>

        <button
          type="button"
          onClick={() => onPick('markdown')}
          className="text-left bg-white border border-[var(--color-line)] rounded-[18px] p-7 sm:p-8 transition-all hover:border-ink hover:shadow-[0_18px_36px_-22px_rgba(15,23,42,.18)] hover:-translate-y-[1px] flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
              Option B
            </span>
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              offline OK
            </span>
          </div>
          <h2 className="font-sans font-medium text-[clamp(24px,2.4vw,32px)] leading-[1.1] tracking-[-0.015em] m-0 ">
            Send me templates. <em>I&apos;ll fill them out.</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.55] m-0">
            Download two markdown files — one company-wide, one individual — fill them out in
            VS Code, Obsidian, or hand them to ChatGPT. Upload them back when done.
          </p>
          <ul className="grid gap-1.5 text-[13.5px] text-muted m-0 p-0 list-none">
            <li>· Best if you want to share with the team or work offline</li>
            <li>· Plain markdown — works with any AI tool</li>
            <li>· Upload either or both; switch back to chat any time</li>
          </ul>
          <span className="btn btn-ghost self-start mt-1">Download the templates →</span>
        </button>
      </div>
    </div>
  )
}

function SuccessCard({
  companyName,
  respondent,
}: {
  companyName: string
  respondent: Respondent
}) {
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-8 sm:p-12 flex flex-col gap-5 max-w-[720px] mx-auto">
      <div
        className="font-mono font-semibold text-[44px] leading-[0.9]"
        style={{ color: 'var(--color-ok)' }}
      >
        ✓
      </div>
      <h2 className="font-sans font-medium text-[clamp(28px,3vw,40px)] leading-[1.1] tracking-[-0.015em] m-0 ">
        Thanks, {respondent.name.split(' ')[0]}. <em>We&apos;ve got it.</em>
      </h2>
      <p className="text-[16.5px] leading-[1.6] text-ink-2 m-0">
        Your responses for <strong className="text-ink font-medium">{companyName}</strong> are in.
        A Firmcraft engineer will read every word and reach out within{' '}
        <strong className="text-ink font-medium">one business day</strong>. If anyone else from
        your team still needs to fill this out, just share the same invitation link — their
        individual answers are kept separate, and the company-wide sections you just answered
        will be pre-filled for them.
      </p>
      <p className="text-[14px] leading-[1.55] text-muted m-0">
        Anything urgent? Email{' '}
        <a href="mailto:hello@firmcraft.ai" className="text-signal hover:underline underline-offset-[3px]">
          hello@firmcraft.ai
        </a>{' '}
        or text Doyle directly at (217) 206-5142.
      </p>
      <div className="flex flex-wrap gap-3 mt-2">
        <a href="/" className="btn btn-ghost">
          ← Back to home
        </a>
        <a href="/playbooks" className="btn btn-primary">
          See playbooks →
        </a>
      </div>
    </div>
  )
}
