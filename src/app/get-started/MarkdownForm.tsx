'use client'

import { useRef, useState } from 'react'
import {
  buildMarkdownTemplate,
  reviewMarkdownImport,
  answersFilenameForScope,
  type ImportReview,
} from '@/lib/survey-markdown'
import {
  SURVEY_SECTIONS,
  answerKey,
  type SurveyAnswers,
  type SurveyScope,
} from '@/lib/survey'
import type { Respondent } from './RespondentGate'

type Stage =
  | { kind: 'idle' }
  | { kind: 'preview'; review: ImportReview }
  | { kind: 'persisting'; review: ImportReview }

export function MarkdownForm({
  token,
  companyName,
  respondent,
  answers,
  onAnswersChange,
  onBack,
  onContinue,
}: {
  token: string
  companyName: string
  respondent: Respondent
  answers: SurveyAnswers
  onAnswersChange: (next: SurveyAnswers) => void
  /** Switch back to the chat flow. */
  onBack: () => void
  /** Called after a successful upload+persist. The caller routes onward. */
  onContinue: (merged: SurveyAnswers, scope: SurveyScope) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pasted, setPasted] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  function handleDownload(scope: SurveyScope) {
    const template = buildMarkdownTemplate({
      scope,
      companyName,
      token,
      respondentEmail: scope === 'individual' ? respondent.email : undefined,
      existingAnswers: answers,
    })
    const blob = new Blob([template], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = answersFilenameForScope(scope, companyName, respondent.email)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function processText(text: string) {
    setError(null)
    try {
      const review = await reviewMarkdownImport(text)
      if (review.stats.answeredQuestions === 0) {
        setError(
          "We couldn't find any answers in that file. Make sure section headings start with '##' and question headings start with '###'.",
        )
        return
      }
      setStage({ kind: 'preview', review })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  async function handleFile(file: File) {
    setBusy(true)
    try {
      const text = await file.text()
      await processText(text)
    } catch {
      setError('Could not read that file.')
    } finally {
      setBusy(false)
    }
  }

  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    const first = list[0]
    if (!first) return
    if (
      !first.name.toLowerCase().endsWith('.md') &&
      first.type !== 'text/markdown' &&
      first.type !== 'text/plain'
    ) {
      setError(
        `That doesn't look like a markdown file (got ${first.type || first.name}). Try a .md template.`,
      )
      return
    }
    void handleFile(first)
  }

  async function persistReview(review: ImportReview) {
    setStage({ kind: 'persisting', review })
    setError(null)
    try {
      for (const section of SURVEY_SECTIONS) {
        if (section.scope !== review.scope) continue
        for (const q of section.questions) {
          const key = answerKey(section.id, q.id)
          const value = review.answers[key]
          if (typeof value !== 'string') continue
          if (!value.trim()) continue
          const res = await fetch('/api/get-started/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              respondentEmail: respondent.email,
              scope: review.scope,
              sectionId: section.id,
              questionId: q.id,
              answer: value,
            }),
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `Could not save ${section.id}.${q.id}`)
          }
        }
      }

      // Merge: take everything we just parsed, but only overwrite keys that are
      // in the file's scope. Out-of-scope keys keep whatever the user had.
      const merged: SurveyAnswers = { ...answers }
      for (const section of SURVEY_SECTIONS) {
        if (section.scope !== review.scope) continue
        for (const q of section.questions) {
          const key = answerKey(section.id, q.id)
          merged[key] = review.answers[key] ?? ''
        }
      }
      onAnswersChange(merged)
      onContinue(merged, review.scope)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save those answers.')
      setStage({ kind: 'preview', review })
    }
  }

  if (stage.kind === 'preview' || stage.kind === 'persisting') {
    return (
      <ImportPreview
        review={stage.review}
        companyName={companyName}
        respondent={respondent}
        persisting={stage.kind === 'persisting'}
        onBack={() => setStage({ kind: 'idle' })}
        onConfirm={() => persistReview(stage.review)}
        error={error}
      />
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
            Step 1
          </span>
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Markdown
          </span>
        </div>
        <h3 className="font-sans font-medium text-[24px] leading-[1.15] tracking-[-0.01em] m-0 ">
          Download the <em>templates.</em>
        </h3>
        <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
          Two scoped files — fill them in your editor of choice (or hand them to ChatGPT / Claude
          for a draft). Both work standalone; you can do company first and individual later, or
          split them across your team.
        </p>

        <TemplateCard
          scope="company"
          companyName={companyName}
          onDownload={() => handleDownload('company')}
        />
        <TemplateCard
          scope="individual"
          respondentEmail={respondent.email}
          onDownload={() => handleDownload('individual')}
        />

        <p className="text-[12.5px] text-muted leading-[1.5] m-0">
          Each template includes instructions for AI agents, so you can hand it to Claude, ChatGPT,
          or any other model and have it draft the answers for you. The YAML front matter tells
          us which scope the file is — don&apos;t edit those lines.
        </p>
      </div>

      <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
            Step 2
          </span>
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Upload
          </span>
        </div>
        <h3 className="font-sans font-medium text-[24px] leading-[1.15] tracking-[-0.01em] m-0 ">
          Drop your filled <em>.md</em> here.
        </h3>
        <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
          We&apos;ll parse it, show you a preview with any issues we caught, and let you confirm
          before anything is written.
        </p>

        <div
          onDragEnter={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setDragActive(false)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files)
            }
          }}
          className={[
            'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
            dragActive
              ? 'border-signal bg-paper'
              : 'border-[var(--color-line-strong)] bg-paper/40 hover:border-ink',
          ].join(' ')}
        >
          <div
            className="font-sans font-semibold text-[34px] leading-[1] mb-3"
            style={{ color: 'var(--color-signal)' }}
            aria-hidden
          >
            ↓
          </div>
          <p className="font-sans font-medium text-[18px] tracking-[-0.005em] m-0 mb-1">
            Drop the file here, <em>or click to browse.</em>
          </p>
          <p className="text-[12.5px] text-muted m-0 mb-4">
            .md files only. Either scope works — we&apos;ll detect which one.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="btn btn-ghost"
          >
            {busy ? 'Reading…' : 'Choose file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files)
                e.target.value = ''
              }
            }}
            className="sr-only"
            aria-label="Upload your filled markdown survey"
          />
        </div>

        <details className="group">
          <summary className="cursor-pointer text-[12.5px] font-mono tracking-[0.1em] uppercase text-muted hover:text-ink transition-colors list-none">
            <span className="mr-1.5">+</span>
            Or paste markdown directly
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={8}
              placeholder="Paste your filled-out markdown here…"
              className="w-full rounded-lg border border-[var(--color-line)] bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white font-mono resize-y min-h-[140px]"
            />
            <button
              type="button"
              onClick={() => void processText(pasted)}
              disabled={!pasted.trim()}
              className="btn btn-ghost self-start disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Parse pasted markdown →
            </button>
          </div>
        </details>

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
      </div>

      <div className="lg:col-span-2 flex items-center justify-between gap-3 flex-wrap pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-signal transition-colors"
        >
          ← Switch to chat
        </button>
        <p className="text-[12px] text-muted m-0 leading-[1.55] max-w-[440px] text-right">
          Headings can be lightly edited and we&apos;ll still find your answers. Empty sections
          and skipped questions are fine.
        </p>
      </div>
    </div>
  )
}

function TemplateCard({
  scope,
  companyName,
  respondentEmail,
  onDownload,
}: {
  scope: SurveyScope
  companyName?: string
  respondentEmail?: string
  onDownload: () => void
}) {
  const isCompany = scope === 'company'
  const sectionCount = SURVEY_SECTIONS.filter((s) => s.scope === scope).length
  const questionCount = SURVEY_SECTIONS.filter((s) => s.scope === scope).reduce(
    (n, s) => n + s.questions.length,
    0,
  )
  const sections = SURVEY_SECTIONS.filter((s) => s.scope === scope)

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: isCompany ? 'rgba(44,107,240,0.05)' : 'rgba(15,23,42,0.03)',
        border: `1px solid ${isCompany ? 'rgba(44,107,240,0.22)' : 'var(--color-line)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.12em] rounded-full px-2 py-0.5"
            style={{
              background: isCompany ? 'rgba(44,107,240,0.15)' : 'rgba(15,23,42,0.08)',
              color: isCompany ? 'var(--color-signal)' : 'var(--color-ink-2)',
            }}
          >
            {isCompany ? 'Shared with team' : 'Just for you'}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {sectionCount} sections · {questionCount} questions
          </span>
        </div>
      </div>
      <div>
        <div className="font-sans font-medium text-[15px] text-ink leading-[1.3]">
          {isCompany
            ? `${companyName || 'Company'}-wide template`
            : `Individual template${respondentEmail ? ` for ${respondentEmail}` : ''}`}
        </div>
        <p className="text-[12.5px] text-muted leading-[1.5] m-0 mt-1">
          {isCompany
            ? 'Company profile, tech stack, AI readiness, integrations, security. Filled once, shared across your team.'
            : 'Use case priorities, team & access, budget, communication, custom needs. Specific to you.'}
        </p>
      </div>
      <ul className="grid gap-1 text-[12px] text-muted m-0 p-0 list-none">
        {sections.map((s) => (
          <li key={s.id}>
            <span className="font-mono text-[10.5px] tracking-[0.08em] mr-2">
              {String(s.number).padStart(2, '0')}
            </span>
            {s.title}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onDownload} className="btn btn-ghost self-start">
        ↓ Download {isCompany ? 'company' : 'individual'} template (.md)
      </button>
    </div>
  )
}

function ImportPreview({
  review,
  companyName,
  respondent,
  persisting,
  onBack,
  onConfirm,
  error,
}: {
  review: ImportReview
  companyName: string
  respondent: Respondent
  persisting: boolean
  onBack: () => void
  onConfirm: () => void
  error: string | null
}) {
  const { stats, issues, scope, detectedFromFrontMatter } = review
  const warnings = issues.filter((i) => i.level === 'warning' || i.level === 'error')
  const infos = issues.filter((i) => i.level === 'info')

  const scopeLabel = scope === 'company' ? 'Company-wide' : 'Just for you'
  const scopeNote =
    scope === 'company'
      ? `These answers will be saved to ${companyName}'s shared profile. Anyone else with the survey link will see them.`
      : `These answers will be saved against ${respondent.email}. Other people from ${companyName} fill out their own copy.`

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-5 max-w-[760px] mx-auto">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal font-medium">
          Preview
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          Confirm to continue
        </span>
      </div>
      <h3 className="font-sans font-medium text-[26px] leading-[1.15] tracking-[-0.01em] m-0 ">
        Here&apos;s what we <em>parsed.</em>
      </h3>

      <div
        className="rounded-xl p-4"
        style={{
          background: scope === 'company' ? 'rgba(44,107,240,0.05)' : 'rgba(15,23,42,0.03)',
          border: `1px solid ${scope === 'company' ? 'rgba(44,107,240,0.22)' : 'var(--color-line)'}`,
        }}
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: scope === 'company' ? 'var(--color-signal)' : 'var(--color-ink-2)' }}>
          Scope · {scopeLabel}
        </div>
        <p className="text-[13.5px] text-ink-2 leading-[1.55] m-0 mt-1">{scopeNote}</p>
        {!detectedFromFrontMatter && (
          <p className="text-[12px] text-muted leading-[1.5] m-0 mt-2">
            Inferred from the file&apos;s contents — no <code>scope:</code> line in the front
            matter. If that&apos;s wrong, edit the front matter to add <code>scope: company</code>{' '}
            or <code>scope: individual</code> and re-upload.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total in scope" value={stats.totalQuestions} />
        <Stat label="Answered" value={stats.answeredQuestions} accent />
        <Stat label="Empty" value={stats.emptyQuestions} muted={stats.emptyQuestions === 0} />
      </div>

      {warnings.length > 0 && (
        <IssueList
          title={`${warnings.length} issue${warnings.length === 1 ? '' : 's'} to look at`}
          issues={warnings}
          tone="warning"
        />
      )}

      {infos.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[12.5px] font-mono tracking-[0.1em] uppercase text-muted hover:text-ink list-none">
            <span className="mr-1.5">+</span>
            {infos.length} unanswered question{infos.length === 1 ? '' : 's'}
          </summary>
          <IssueList title="" issues={infos} tone="info" />
        </details>
      )}

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

      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-[var(--color-line)]">
        <button type="button" onClick={onBack} disabled={persisting} className="btn btn-ghost disabled:opacity-60">
          ← Upload a different file
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={persisting}
          className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {persisting ? 'Saving…' : 'Save & continue →'}
        </button>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  muted,
}: {
  label: string
  value: number
  accent?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={[
        'rounded-xl border p-4 flex flex-col gap-1',
        accent ? 'border-signal/40 bg-paper/60' : 'border-[var(--color-line)] bg-paper/30',
        muted ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted">
        {label}
      </span>
      <span
        className={[
          'font-sans font-medium text-[28px] leading-[1] tracking-[-0.01em]',
          accent ? 'text-signal' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string
  issues: { level: string; message: string; questionKey?: string }[]
  tone: 'warning' | 'info'
}) {
  const styles =
    tone === 'warning'
      ? {
          color: 'var(--color-operator)',
          background: 'rgba(251,124,80,.06)',
          borderColor: 'rgba(251,124,80,.25)',
        }
      : {
          color: 'var(--color-ink-2)',
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
        }
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-2" style={styles}>
      {title && (
        <div className="font-mono text-[11px] tracking-[0.12em] uppercase font-medium">{title}</div>
      )}
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-[13.5px] leading-[1.5]">
        {issues.map((issue, i) => (
          <li key={`${issue.questionKey ?? 'i'}-${i}`}>· {issue.message}</li>
        ))}
      </ul>
    </div>
  )
}
