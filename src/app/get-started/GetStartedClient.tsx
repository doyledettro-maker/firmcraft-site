'use client'

import { useState } from 'react'
import { ConversationalForm } from './ConversationalForm'
import { MarkdownForm } from './MarkdownForm'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import type { SurveyAnswers } from '@/lib/survey'
import { emptyAnswers } from '@/lib/survey'

type Mode = 'pick' | 'chat' | 'markdown' | 'review' | 'success'

export function GetStartedClient() {
  const [mode, setMode] = useState<Mode>('pick')
  const [answers, setAnswers] = useState<SurveyAnswers>(() => emptyAnswers())
  const [method, setMethod] = useState<'conversational' | 'markdown'>('conversational')
  const [companyHint, setCompanyHint] = useState('')

  const handleConversationalDone = (next: SurveyAnswers, hint: string) => {
    setAnswers(next)
    setCompanyHint(hint)
    setMethod('conversational')
    setMode('review')
  }

  const handleMarkdownParsed = (next: SurveyAnswers, hint: string) => {
    setAnswers(next)
    setCompanyHint(hint)
    setMethod('markdown')
    setMode('review')
  }

  if (mode === 'pick') {
    return <ModePicker onPick={(m) => setMode(m)} />
  }

  if (mode === 'chat') {
    return (
      <ConversationalForm
        initial={answers}
        onCancel={() => setMode('pick')}
        onComplete={handleConversationalDone}
      />
    )
  }

  if (mode === 'markdown') {
    return (
      <MarkdownForm
        onCancel={() => setMode('pick')}
        onParsed={handleMarkdownParsed}
      />
    )
  }

  if (mode === 'review') {
    return (
      <ReviewAndSubmit
        answers={answers}
        method={method}
        companyHint={companyHint}
        onAnswersChange={setAnswers}
        onCompanyHintChange={setCompanyHint}
        onBack={() => setMode(method === 'conversational' ? 'chat' : 'markdown')}
        onSuccess={() => setMode('success')}
      />
    )
  }

  return <SuccessCard />
}

function ModePicker({ onPick }: { onPick: (m: 'chat' | 'markdown') => void }) {
  return (
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
          A guided chat that asks one question at a time. You write whatever you
          want — short bullet, paragraph, whole story. We&apos;ll show your
          progress on the side and let you review everything before submitting.
        </p>
        <ul className="grid gap-1.5 text-[13.5px] text-muted m-0 p-0 list-none">
          <li>· Best if you want a friendly nudge through each section</li>
          <li>· Auto-saves locally as you go</li>
          <li>· Edit anything before submitting</li>
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
          Send me a template. <em>I&apos;ll fill it out.</em>
        </h2>
        <p className="text-[15px] text-ink-2 leading-[1.55] m-0">
          Download a markdown file with all 10 sections. Fill it out in your
          editor of choice — VS Code, Obsidian, plain Notepad, whatever. Drop it
          back here when you&apos;re done. We&apos;ll parse it and let you review.
        </p>
        <ul className="grid gap-1.5 text-[13.5px] text-muted m-0 p-0 list-none">
          <li>· Best if you want to take your time, share with the team, or work offline</li>
          <li>· Plain markdown — no special tools needed</li>
          <li>· Edit anything we parsed before submitting</li>
        </ul>
        <span className="btn btn-ghost self-start mt-1">Download the template →</span>
      </button>
    </div>
  )
}

function SuccessCard() {
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-8 sm:p-12 flex flex-col gap-5 max-w-[720px] mx-auto">
      <div
        className="font-mono font-semibold text-[44px] leading-[0.9]"
        style={{ color: 'var(--color-ok)' }}
      >
        ✓
      </div>
      <h2 className="font-sans font-medium text-[clamp(28px,3vw,40px)] leading-[1.1] tracking-[-0.015em] m-0 ">
        Thanks. <em>We&apos;ve got it.</em>
      </h2>
      <p className="text-[16.5px] leading-[1.6] text-ink-2 m-0">
        Your survey is in. A Firmcraft engineer will read every word and reach
        out within{' '}
        <strong className="text-ink font-medium">one business day</strong> with
        the few follow-up questions we always have and proposed kickoff times. If
        anything urgent comes up before then, email{' '}
        <a
          href="mailto:hello@firmcraft.ai"
          className="text-signal hover:underline underline-offset-[3px]"
        >
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
