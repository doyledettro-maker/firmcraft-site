'use client'

import { useRef, useState } from 'react'
import {
  buildMarkdownTemplate,
  reviewMarkdownImport,
  answersFilename,
  type ImportReview,
} from '@/lib/survey-markdown'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers } from '@/lib/survey'

type ParseError = {
  message: string
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'preview'; review: ImportReview; hint: string }

export function MarkdownForm({
  onCancel,
  onParsed,
}: {
  onCancel: () => void
  onParsed: (answers: SurveyAnswers, companyHint: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<ParseError | null>(null)
  const [busy, setBusy] = useState(false)
  const [pasted, setPasted] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  function handleDownload() {
    const template = buildMarkdownTemplate()
    const blob = new Blob([template], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = answersFilename()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function processText(text: string, hint?: string) {
    setError(null)
    try {
      const review = await reviewMarkdownImport(text)
      if (review.stats.answeredQuestions === 0) {
        setError({
          message:
            "We couldn't find any answers in that file. Make sure section headings start with '##' and question headings start with '###'.",
        })
        return
      }
      const companyOverview = review.answers[answerKey('company', 'overview')] || ''
      const inferred = hint || extractHint(companyOverview)
      setStage({ kind: 'preview', review, hint: inferred })
    } catch (err) {
      setError({
        message:
          err instanceof Error ? err.message : 'Could not read that file.',
      })
    }
  }

  async function handleFile(file: File) {
    setBusy(true)
    try {
      const text = await file.text()
      await processText(text, file.name.replace(/\.md$/i, '').replace(/[-_]/g, ' '))
    } catch {
      setError({ message: 'Could not read that file.' })
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
      setError({
        message: `That doesn't look like a markdown file (got ${first.type || first.name}). Try the .md template.`,
      })
      return
    }
    void handleFile(first)
  }

  if (stage.kind === 'preview') {
    return (
      <ImportPreview
        review={stage.review}
        hint={stage.hint}
        onBack={() => setStage({ kind: 'idle' })}
        onConfirm={() => onParsed(stage.review.answers, stage.hint)}
      />
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      {/* Step 1: download */}
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
          Download the <em>template.</em>
        </h3>
        <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
          A plain markdown file with all 10 sections and the questions inside.
          Open it in any editor — VS Code, Obsidian, Typora, plain Notepad. Take
          your time. Share it with the team if you want a second opinion.
        </p>
        <p className="text-[12.5px] text-muted leading-[1.5] m-0">
          The file includes instructions for AI agents, so you can also hand it
          to Claude, ChatGPT, or any other model and have it draft the answers
          for you.
        </p>
        <ul className="grid gap-1.5 text-[13px] text-muted m-0 p-0 list-none">
          {SURVEY_SECTIONS.map((s) => (
            <li key={s.id}>
              <span className="font-mono text-[11px] tracking-[0.08em] mr-2">
                {String(s.number).padStart(2, '0')}
              </span>
              {s.title}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleDownload}
          className="btn btn-primary self-start mt-2"
        >
          ↓ Download template (.md)
        </button>
      </div>

      {/* Step 2: upload */}
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
          We&apos;ll parse it, show you a preview with any issues we caught, and
          let you confirm before anything is written.
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
          <p className="text-[12.5px] text-muted m-0 mb-4">.md files only.</p>
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

        {/* Or paste */}
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
            {error.message}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 flex items-center justify-between gap-3 flex-wrap pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12.5px] font-mono tracking-[0.12em] uppercase text-muted hover:text-signal transition-colors"
        >
          ← Switch method
        </button>
        <p className="text-[12px] text-muted m-0 leading-[1.55] max-w-[440px] text-right">
          Headings can be lightly edited and we&apos;ll still find your answers.
          Empty sections and skipped questions are fine.
        </p>
      </div>
    </div>
  )
}

function ImportPreview({
  review,
  hint,
  onBack,
  onConfirm,
}: {
  review: ImportReview
  hint: string
  onBack: () => void
  onConfirm: () => void
}) {
  const { stats, issues } = review
  const warnings = issues.filter((i) => i.level === 'warning' || i.level === 'error')
  const infos = issues.filter((i) => i.level === 'info')

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

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total questions" value={stats.totalQuestions} />
        <Stat label="Answered" value={stats.answeredQuestions} accent />
        <Stat label="Empty" value={stats.emptyQuestions} muted={stats.emptyQuestions === 0} />
      </div>

      {hint && (
        <p className="text-[13.5px] text-ink-2 m-0">
          Company hint: <span className="font-mono text-ink">{hint}</span>
        </p>
      )}

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
            {infos.length} skipped question{infos.length === 1 ? '' : 's'}
          </summary>
          <IssueList title="" issues={infos} tone="info" />
        </details>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-[var(--color-line)]">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost"
        >
          ← Upload a different file
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn btn-primary"
        >
          Continue to review →
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
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={styles}
    >
      {title && (
        <div className="font-mono text-[11px] tracking-[0.12em] uppercase font-medium">
          {title}
        </div>
      )}
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-[13.5px] leading-[1.5]">
        {issues.map((issue, i) => (
          <li key={`${issue.questionKey ?? 'i'}-${i}`}>· {issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function extractHint(overview: string): string {
  const t = overview.trim()
  if (!t) return ''
  const firstLine = t.split(/\r?\n/)[0]
  return firstLine.split(/[—–-]/)[0].trim().slice(0, 80)
}
