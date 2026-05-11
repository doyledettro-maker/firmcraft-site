'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardBody,
  Field,
  FieldGroup,
  Hint,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui'
import { emptySurvey, planMeta, type SurveyData, type PlanTier } from '@/lib/survey'
import {
  buildPartnerMarkdownTemplate,
  partnerAnswersFilename,
  reviewPartnerMarkdownImport,
  type PartnerImportReview,
  type PartnerSurveyAnswers,
} from '@/lib/survey-markdown'
import { CheckCircle2 } from 'lucide-react'

type Draft = Pick<
  SurveyData,
  | 'companyName'
  | 'industry'
  | 'companySize'
  | 'website'
  | 'primaryContactName'
  | 'primaryContactEmail'
  | 'primaryContactRole'
  | 'planTier'
  | 'implementationTimeline'
  | 'successMetrics'
  | 'specialNeeds'
  | 'priorityFeatures'
> & { partnerNote: string }

const initial: Draft = {
  companyName: '',
  industry: '',
  companySize: emptySurvey.companySize,
  website: '',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactRole: '',
  planTier: '',
  implementationTimeline: '',
  successMetrics: '',
  specialNeeds: '',
  priorityFeatures: '',
  partnerNote: '',
}

// Map the flat freeform PartnerSurveyAnswers onto our typed Draft. Text fields
// copy verbatim; dropdown enums use a small fuzzy match and fall through to
// the current value (so re-import never blows away a manually-picked enum).
function mergeAnswersIntoDraft(answers: PartnerSurveyAnswers, current: Draft): Draft {
  const get = (k: string) => (answers[k] || '').trim()

  const overview = get('company.overview')
  const { companyName, industry } = splitCompanyOverview(overview, current)
  const companySize = matchCompanySize(overview) ?? current.companySize
  const planTier = matchPlanTier(get('plan.planTier')) ?? current.planTier
  const implementationTimeline =
    matchTimeline(get('plan.timeline')) ?? current.implementationTimeline

  return {
    companyName,
    industry,
    companySize,
    website: get('company.website') || current.website,
    primaryContactName: get('contact.name') || current.primaryContactName,
    primaryContactEmail: get('contact.email') || current.primaryContactEmail,
    primaryContactRole: get('contact.role') || current.primaryContactRole,
    planTier,
    implementationTimeline,
    successMetrics: get('plan.successMetrics') || current.successMetrics,
    specialNeeds: get('notes.complianceNeeds') || current.specialNeeds,
    priorityFeatures: get('notes.priorityFeatures') || current.priorityFeatures,
    partnerNote: get('notes.partnerNote') || current.partnerNote,
  }
}

function splitCompanyOverview(
  overview: string,
  current: Draft,
): { companyName: string; industry: string } {
  if (!overview) {
    return { companyName: current.companyName, industry: current.industry }
  }
  const firstLine = overview.split(/\r?\n/)[0]
  const [head, ...rest] = firstLine.split(/\s+[—–-]\s+/)
  const tail = rest.join(' — ').trim()
  return {
    companyName: head.trim().slice(0, 120) || current.companyName,
    industry: tail.slice(0, 200) || current.industry,
  }
}

function matchCompanySize(text: string): Draft['companySize'] | null {
  const t = text.toLowerCase()
  if (/\b(500\+|1000|10,?000|over 500|more than 500)\b/.test(t)) return '500+'
  if (/\b(201[-\s]?500|300|400|450)\b/.test(t)) return '201-500'
  if (/\b(51[-\s]?200|100|150|200)\b/.test(t)) return '51-200'
  if (/\b(11[-\s]?50|20|30|40|50)\b/.test(t)) return '11-50'
  if (/\b(1[-\s]?10|under 10|small|single[-\s]location|family|2 staff|5 staff)\b/.test(t)) return '1-10'
  return null
}

function matchPlanTier(text: string): PlanTier | null {
  const t = text.toLowerCase()
  if (/forge|1,?499|enterprise/.test(t)) return 'forge'
  if (/flow|799/.test(t)) return 'flow'
  if (/spark|399/.test(t)) return 'spark'
  return null
}

function matchTimeline(text: string): Draft['implementationTimeline'] | null {
  const t = text.toLowerCase()
  if (/asap|immediately|right away|this week|next week/.test(t)) return 'asap'
  if (/30[-\s]?day|within a month|one month/.test(t)) return '30-days'
  if (/60[-\s]?day|two months/.test(t)) return '60-days'
  if (/90[-\s]?day|quarter|three months/.test(t)) return '90-days'
  if (/flexible|no rush|when ready|tbd/.test(t)) return 'flexible'
  return null
}

function draftToAnswers(draft: Draft): PartnerSurveyAnswers {
  const overview = [draft.companyName, draft.industry].filter(Boolean).join(' — ')
  return {
    'company.overview': overview,
    'company.website': draft.website,
    'contact.name': draft.primaryContactName,
    'contact.email': draft.primaryContactEmail,
    'contact.role': draft.primaryContactRole,
    'plan.planTier': draft.planTier ? planMeta[draft.planTier].name : '',
    'plan.timeline': draft.implementationTimeline,
    'plan.successMetrics': draft.successMetrics,
    'notes.priorityFeatures': draft.priorityFeatures,
    'notes.complianceNeeds': draft.specialNeeds,
    'notes.partnerNote': draft.partnerNote,
  }
}

export function SubmitClientForm({ partnerName }: { partnerName: string }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Submission failed.')
      }
      const j = await res.json()
      setSubmittedId(j.id ?? 'sub_pending')
    } catch (e: any) {
      setError(e.message ?? 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return (
      <Card className="max-w-[640px]">
        <CardBody className="p-8">
          <div className="w-12 h-12 rounded-full bg-[#E5EFDC] grid place-items-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-[#3D5A2C]" />
          </div>
          <h2 className="font-serif-warm text-[28px] tracking-[-0.02em] m-0">
            Submitted to <em className="text-accent italic">Firmcraft</em>
          </h2>
          <p className="text-ink-2 mt-2 leading-relaxed">
            We&rsquo;ve queued <strong>{draft.companyName || 'this client'}</strong>{' '}
            for review. Submission id{' '}
            <code className="font-mono-warm text-[12px] bg-paper-2 px-1.5 py-0.5 rounded">
              {submittedId}
            </code>
            . You&rsquo;ll be CC&rsquo;d on the kickoff email and the client
            will appear in your client list once their tenant is active.
          </p>
          <div className="flex gap-2 mt-5">
            <Button
              onClick={() => {
                setDraft(initial)
                setSubmittedId(null)
              }}
            >
              Submit another
            </Button>
            <Button variant="ghost" onClick={() => router.push('/clients')}>
              Back to my clients
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 max-w-[820px]">
      <MarkdownImportCard
        draft={draft}
        onApply={(answers) => setDraft((d) => mergeAnswersIntoDraft(answers, d))}
      />

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Section 1 · Company profile</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
            Who is the client?
          </h3>
        </div>
        <CardBody>
          <FieldGroup>
            <Field className="md:col-span-2">
              <Label htmlFor="companyName">Company name *</Label>
              <Input
                id="companyName"
                required
                value={draft.companyName}
                onChange={(e) => update('companyName', e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={draft.industry}
                onChange={(e) => update('industry', e.target.value)}
                placeholder="e.g. Legal services"
              />
            </Field>
            <Field>
              <Label htmlFor="companySize">Company size</Label>
              <Select
                id="companySize"
                value={draft.companySize}
                onChange={(e) => update('companySize', e.target.value as Draft['companySize'])}
              >
                <option value="">Select…</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="201-500">201–500</option>
                <option value="500+">500+</option>
              </Select>
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://"
                value={draft.website}
                onChange={(e) => update('website', e.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Section 2 · Primary contact</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
            Who should we work with?
          </h3>
        </div>
        <CardBody>
          <FieldGroup>
            <Field>
              <Label htmlFor="primaryContactName">Name *</Label>
              <Input
                id="primaryContactName"
                required
                value={draft.primaryContactName}
                onChange={(e) => update('primaryContactName', e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="primaryContactEmail">Email *</Label>
              <Input
                id="primaryContactEmail"
                type="email"
                required
                value={draft.primaryContactEmail}
                onChange={(e) => update('primaryContactEmail', e.target.value)}
              />
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="primaryContactRole">Title / role</Label>
              <Input
                id="primaryContactRole"
                value={draft.primaryContactRole}
                onChange={(e) => update('primaryContactRole', e.target.value)}
                placeholder="e.g. Managing Partner, Head of Ops"
              />
            </Field>
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Section 3 · Plan &amp; timeline</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
            What does the client need?
          </h3>
        </div>
        <CardBody>
          <FieldGroup>
            <Field>
              <Label htmlFor="planTier">Recommended plan</Label>
              <Select
                id="planTier"
                value={draft.planTier}
                onChange={(e) => update('planTier', e.target.value as PlanTier | '')}
              >
                <option value="">Help us choose</option>
                {(Object.keys(planMeta) as PlanTier[]).map((tier) => (
                  <option key={tier} value={tier}>
                    {planMeta[tier].name} — {planMeta[tier].price}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="implementationTimeline">Timeline</Label>
              <Select
                id="implementationTimeline"
                value={draft.implementationTimeline}
                onChange={(e) =>
                  update('implementationTimeline', e.target.value as Draft['implementationTimeline'])
                }
              >
                <option value="">Select…</option>
                <option value="asap">As soon as possible</option>
                <option value="30-days">Within 30 days</option>
                <option value="60-days">Within 60 days</option>
                <option value="90-days">Within 90 days</option>
                <option value="flexible">Flexible</option>
              </Select>
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="successMetrics">What does success look like?</Label>
              <Textarea
                id="successMetrics"
                value={draft.successMetrics}
                onChange={(e) => update('successMetrics', e.target.value)}
                placeholder="e.g. Cut intake time by 40%, automate weekly status reports."
              />
            </Field>
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Section 4 · Notes</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
            Anything Firmcraft should know?
          </h3>
        </div>
        <CardBody>
          <FieldGroup>
            <Field className="md:col-span-2">
              <Label htmlFor="priorityFeatures">Priority workflows / features</Label>
              <Textarea
                id="priorityFeatures"
                value={draft.priorityFeatures}
                onChange={(e) => update('priorityFeatures', e.target.value)}
              />
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="specialNeeds">Compliance or special requirements</Label>
              <Textarea
                id="specialNeeds"
                value={draft.specialNeeds}
                onChange={(e) => update('specialNeeds', e.target.value)}
                placeholder="HIPAA, attorney-client privilege, US-only data residency, etc."
              />
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="partnerNote">Note from {partnerName}</Label>
              <Textarea
                id="partnerNote"
                value={draft.partnerNote}
                onChange={(e) => update('partnerNote', e.target.value)}
                placeholder="Context for the Firmcraft team — relationship, urgency, how you sold it."
              />
              <Hint>This note is internal — not shared with the client.</Hint>
            </Field>
          </FieldGroup>
        </CardBody>
      </Card>

      {error ? (
        <div className="text-[13px] text-[#A23B1F] bg-[#F4D8CC]/40 border border-[#A23B1F]/20 rounded-lg px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit to Firmcraft'}
        </Button>
        <span className="text-[12.5px] text-muted">
          You&rsquo;ll get a confirmation email at your partner address.
        </span>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Markdown import card
// ---------------------------------------------------------------------------

function MarkdownImportCard({
  draft,
  onApply,
}: {
  draft: Draft
  onApply: (answers: PartnerSurveyAnswers) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PartnerImportReview | null>(null)

  function handleDownload() {
    const md = buildPartnerMarkdownTemplate(draftToAnswers(draft), {
      companyHint: draft.companyName,
    })
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = partnerAnswersFilename(draft.companyName)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const text = await file.text()
      const review = await reviewPartnerMarkdownImport(text, draftToAnswers(draft))
      if (review.stats.answeredQuestions === 0) {
        setError(
          "Couldn't find any answers in that file. Make sure section headings start with '##' and question headings start with '###'.",
        )
        return
      }
      setPreview(review)
    } catch {
      setError('Could not read that file.')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <Card>
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Preview · confirm to apply</div>
          <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
            Here&rsquo;s what we parsed.
          </h3>
        </div>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <PreviewStat label="Total" value={preview.stats.totalQuestions} />
            <PreviewStat label="Answered" value={preview.stats.answeredQuestions} accent />
            <PreviewStat label="Empty" value={preview.stats.emptyQuestions} />
          </div>
          {preview.stats.changedQuestions > 0 && (
            <p className="text-[13px] text-ink-2 m-0">
              <strong className="font-medium text-ink">
                {preview.stats.changedQuestions}
              </strong>{' '}
              answer{preview.stats.changedQuestions === 1 ? '' : 's'} will change the
              current draft.
            </p>
          )}
          {preview.issues.filter((i) => i.level !== 'info').length > 0 && (
            <div
              className="rounded-lg border px-3 py-2.5 text-[13px] flex flex-col gap-1.5"
              style={{
                color: '#A23B1F',
                background: 'rgba(162,59,31,.05)',
                borderColor: 'rgba(162,59,31,.25)',
              }}
            >
              <div className="font-medium uppercase tracking-[0.1em] text-[11px]">
                Heads up
              </div>
              <ul className="m-0 p-0 list-none flex flex-col gap-1">
                {preview.issues
                  .filter((i) => i.level !== 'info')
                  .map((issue, i) => (
                    <li key={i}>· {issue.message}</li>
                  ))}
              </ul>
            </div>
          )}
          {preview.issues.filter((i) => i.level === 'info').length > 0 && (
            <details>
              <summary className="cursor-pointer text-[12px] uppercase tracking-[0.1em] text-muted hover:text-ink list-none">
                + {preview.issues.filter((i) => i.level === 'info').length} skipped
                question(s)
              </summary>
              <ul className="m-0 p-0 mt-2 list-none flex flex-col gap-1 text-[13px] text-ink-2">
                {preview.issues
                  .filter((i) => i.level === 'info')
                  .map((issue, i) => (
                    <li key={i}>· {issue.message}</li>
                  ))}
              </ul>
            </details>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              onClick={() => {
                onApply(preview.answers)
                setPreview(null)
              }}
            >
              Apply to form
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPreview(null)}
            >
              Cancel
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <div className="px-6 py-5 border-b border-line">
        <div className="eyebrow">Optional · markdown template</div>
        <h3 className="font-serif-warm text-[22px] mt-1 tracking-[-0.01em]">
          Prefer to draft offline?
        </h3>
      </div>
      <CardBody className="flex flex-col gap-3">
        <p className="text-[13.5px] text-ink-2 leading-snug m-0">
          Download a markdown file with the four sections. Fill it in any editor —
          or hand it to Claude/ChatGPT and let an AI agent draft answers. Drop
          the filled file back here and we&rsquo;ll preview before pre-filling
          the form.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" variant="ghost" size="sm" onClick={handleDownload}>
            ↓ Download template (.md)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? 'Reading…' : '↑ Upload filled markdown'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {error && (
          <div
            className="text-[13px] rounded-lg border px-3 py-2"
            style={{
              color: '#A23B1F',
              background: 'rgba(162,59,31,.05)',
              borderColor: 'rgba(162,59,31,.25)',
            }}
          >
            {error}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function PreviewStat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-line bg-paper/30 px-3 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span
        className={[
          'font-serif-warm text-[22px] leading-[1] tracking-[-0.01em]',
          accent ? 'text-accent' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
