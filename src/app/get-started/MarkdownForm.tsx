'use client'

import { useRef, useState } from 'react'
import {
  buildMarkdownTemplate,
  parseMarkdownAnswers,
  answersFilename,
} from '@/lib/survey-markdown'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers } from '@/lib/survey'

type ParseError = {
  message: string
}

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

  function processText(text: string, hint?: string) {
    setError(null)
    try {
      const parsed = parseMarkdownAnswers(text)
      const answeredCount = Object.values(parsed).filter(
        (v) => v.trim().length > 0,
      ).length
      if (answeredCount === 0) {
        setError({
          message:
            "We couldn't find any answers in that file. Make sure section headings start with '##' and question headings start with '###'.",
        })
        return
      }
      const companyOverview = parsed[answerKey('company', 'overview')] || ''
      onParsed(parsed, hint || extractHint(companyOverview))
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
      processText(text, file.name.replace(/\.md$/i, '').replace(/[-_]/g, ' '))
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

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      {/* Step 1: download */}
      <div className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-accent font-medium">
            Step 1
          </span>
          <span className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted">
            Markdown
          </span>
        </div>
        <h3 className="font-serif-warm font-medium text-[24px] leading-[1.15] tracking-[-0.01em] m-0 serif-h">
          Download the <em>template.</em>
        </h3>
        <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
          A plain markdown file with all 10 sections and the questions inside.
          Open it in any editor — VS Code, Obsidian, Typora, plain Notepad. Take
          your time. Share it with the team if you want a second opinion.
        </p>
        <ul className="grid gap-1.5 text-[13px] text-muted m-0 p-0 list-none">
          {SURVEY_SECTIONS.map((s) => (
            <li key={s.id}>
              <span className="font-mono-warm text-[11px] tracking-[0.08em] mr-2">
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
      <div className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-accent font-medium">
            Step 2
          </span>
          <span className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted">
            Upload
          </span>
        </div>
        <h3 className="font-serif-warm font-medium text-[24px] leading-[1.15] tracking-[-0.01em] m-0 serif-h">
          Drop your filled <em>.md</em> here.
        </h3>
        <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
          We&apos;ll parse it, show you what we caught, and let you edit anything
          before you submit.
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
              ? 'border-accent bg-paper'
              : 'border-[var(--line-2)] bg-paper/40 hover:border-ink',
          ].join(' ')}
        >
          <div
            className="font-serif-warm italic font-medium text-[34px] leading-[1] mb-3"
            style={{ color: 'var(--accent)' }}
            aria-hidden
          >
            ↓
          </div>
          <p className="font-serif-warm font-medium text-[18px] tracking-[-0.005em] m-0 mb-1">
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
          <summary className="cursor-pointer text-[12.5px] font-mono-warm tracking-[0.1em] uppercase text-muted hover:text-ink transition-colors list-none">
            <span className="mr-1.5">+</span>
            Or paste markdown directly
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={8}
              placeholder="Paste your filled-out markdown here…"
              className="w-full rounded-lg border border-[var(--line)] bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white font-mono-warm resize-y min-h-[140px]"
            />
            <button
              type="button"
              onClick={() => processText(pasted)}
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
              color: '#B45A3A',
              background: 'rgba(180,90,58,.08)',
              borderColor: 'rgba(180,90,58,.3)',
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
          className="text-[12.5px] font-mono-warm tracking-[0.12em] uppercase text-muted hover:text-accent transition-colors"
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

function extractHint(overview: string): string {
  const t = overview.trim()
  if (!t) return ''
  const firstLine = t.split(/\r?\n/)[0]
  return firstLine.split(/[—–-]/)[0].trim().slice(0, 80)
}
