'use client'

import { useMemo, useRef, useState } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Professional Services',
  'Healthcare/Dental',
  'Legal',
  'Accounting',
  'Trades/Construction',
  'Real Estate',
  'Retail/E-commerce',
  'Other',
] as const

const TEAM_SIZES = ['1-5', '6-15', '16-50', '51+'] as const
type TeamSize = (typeof TEAM_SIZES)[number]

const COMM_CHANNELS = ['Microsoft Teams', 'Slack', 'Email', 'SMS', 'WhatsApp']

type ToolDef = { key: string; label: string }
const TOOL_CATEGORIES: { name: string; tools: ToolDef[] }[] = [
  {
    name: 'Communication',
    tools: [
      { key: 'teams', label: 'Microsoft Teams' },
      { key: 'slack', label: 'Slack' },
      { key: 'gchat', label: 'Google Chat' },
      { key: 'email', label: 'Email' },
      { key: 'whatsapp', label: 'WhatsApp' },
    ],
  },
  {
    name: 'Productivity',
    tools: [
      { key: 'gworkspace', label: 'Google Workspace' },
      { key: 'm365', label: 'Microsoft 365' },
      { key: 'notion', label: 'Notion' },
      { key: 'asana', label: 'Asana' },
      { key: 'monday', label: 'Monday.com' },
    ],
  },
  {
    name: 'Accounting',
    tools: [
      { key: 'qb', label: 'QuickBooks' },
      { key: 'xero', label: 'Xero' },
      { key: 'freshbooks', label: 'FreshBooks' },
      { key: 'wave', label: 'Wave' },
    ],
  },
  {
    name: 'CRM',
    tools: [
      { key: 'salesforce', label: 'Salesforce' },
      { key: 'hubspot', label: 'HubSpot' },
      { key: 'zoho', label: 'Zoho' },
      { key: 'pipedrive', label: 'Pipedrive' },
    ],
  },
  {
    name: 'Documents',
    tools: [
      { key: 'docusign', label: 'DocuSign' },
      { key: 'pandadoc', label: 'PandaDoc' },
      { key: 'adobesign', label: 'Adobe Sign' },
    ],
  },
  {
    name: 'Scheduling',
    tools: [
      { key: 'calendly', label: 'Calendly' },
      { key: 'acuity', label: 'Acuity' },
      { key: 'square', label: 'Square Appointments' },
    ],
  },
]

type CommStyle = 'formal' | 'friendly' | 'brief'
const COMM_STYLES: { value: CommStyle; label: string; sub: string }[] = [
  { value: 'formal', label: 'Formal / Professional', sub: 'Polished sentences. No contractions.' },
  { value: 'friendly', label: 'Friendly / Casual', sub: "Warm, conversational. Like a teammate." },
  { value: 'brief', label: 'Brief / Direct', sub: 'Short answers. Cut the preamble.' },
]

type ResponseTime = 'immediate' | 'hour' | 'day' | 'async'
const RESPONSE_TIMES: { value: ResponseTime; label: string; sub: string }[] = [
  { value: 'immediate', label: 'Immediate', sub: 'Within minutes during work hours.' },
  { value: 'hour', label: 'Within an hour', sub: 'Acknowledge fast, full reply soon.' },
  { value: 'day', label: 'Within a day', sub: 'Reply by next business day is fine.' },
  { value: 'async', label: 'Async is fine', sub: 'No urgency unless explicitly flagged.' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const ACCEPTED_FILE_TYPES =
  '.pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg'

// ─── Types ───────────────────────────────────────────────────────────────────

type TeamMember = {
  id: string
  name: string
  role: string
  email: string
  channel: string
}

type ToolSelection = { selected: boolean; note: string }

type FormState = {
  // Step 1
  companyName: string
  industry: string
  teamSize: TeamSize | ''
  locations: string
  description: string
  // Step 2
  teamMembers: TeamMember[]
  primaryContactId: string
  // Step 3
  tools: Record<string, ToolSelection>
  otherTool: string
  // Step 4
  topTasks: string[]
  timeConsumingTasks: string
  approvalRequired: string
  // Step 5
  communicationStyle: CommStyle | ''
  responseTime: ResponseTime | ''
  workStart: string
  workEnd: string
  timezone: string
  notes: string
  // Step 6
  files: File[]
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const STEP_TITLES = [
  'Your business',
  'Your team',
  'Your tools',
  'Your workflows',
  'Your preferences',
  'Your documents',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const initialForm = (): FormState => {
  const tools: Record<string, ToolSelection> = {}
  for (const cat of TOOL_CATEGORIES) {
    for (const t of cat.tools) {
      tools[t.key] = { selected: false, note: '' }
    }
  }
  return {
    companyName: '',
    industry: '',
    teamSize: '',
    locations: '1',
    description: '',
    teamMembers: [{ id: newId(), name: '', role: '', email: '', channel: '' }],
    primaryContactId: '',
    tools,
    otherTool: '',
    topTasks: ['', '', '', '', ''],
    timeConsumingTasks: '',
    approvalRequired: '',
    communicationStyle: '',
    responseTime: '',
    workStart: '09:00',
    workEnd: '17:00',
    timezone: 'America/Chicago',
    notes: '',
    files: [],
  }
}

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardForm() {
  const [form, setForm] = useState<FormState>(() => initialForm())
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [successCompany, setSuccessCompany] = useState('')
  const totalSteps = STEP_TITLES.length

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // ─── Step validation ───────────────────────────────────────────────────────
  const validateStep = (i: number): string | null => {
    if (i === 0) {
      if (!form.companyName.trim()) return 'Please enter your company name.'
      if (!form.industry) return 'Please select an industry.'
      if (!form.teamSize) return 'Please select a team size.'
      const loc = Number(form.locations)
      if (!Number.isFinite(loc) || loc < 0)
        return 'Please enter a valid number of locations.'
      if (form.description.trim().length < 10)
        return 'Tell us a bit more about what you do (at least 10 characters).'
    }
    if (i === 1) {
      if (form.teamMembers.length === 0) return 'Please add at least one team member.'
      for (const m of form.teamMembers) {
        if (!m.name.trim()) return 'Each team member needs a name.'
        if (!m.role.trim()) return 'Each team member needs a role.'
        if (!m.email.trim() || !/^\S+@\S+\.\S+$/.test(m.email.trim()))
          return 'Each team member needs a valid email.'
        if (!m.channel.trim())
          return 'Each team member needs a preferred communication channel.'
      }
      if (!form.primaryContactId) return 'Please pick a primary point of contact.'
      if (!form.teamMembers.some((m) => m.id === form.primaryContactId))
        return 'The primary contact must be one of your team members.'
    }
    if (i === 2) {
      const anySelected = Object.values(form.tools).some((t) => t.selected)
      if (!anySelected && !form.otherTool.trim())
        return 'Pick at least one tool, or describe one under "Other".'
    }
    if (i === 3) {
      const filledTasks = form.topTasks.filter((t) => t.trim().length > 0)
      if (filledTasks.length === 0)
        return 'Please list at least one task you’d like to automate.'
    }
    if (i === 4) {
      if (!form.communicationStyle) return 'Please pick a communication style.'
      if (!form.responseTime) return 'Please pick a response time expectation.'
      if (!form.workStart || !form.workEnd)
        return 'Please set your working hours.'
      if (!form.timezone) return 'Please select a timezone.'
    }
    // step 5 (documents) is optional
    return null
  }

  const next = () => {
    const v = validateStep(step)
    if (v) {
      setErrorMsg(v)
      setStatus('error')
      return
    }
    setErrorMsg('')
    setStatus('idle')
    setStep((s) => Math.min(s + 1, totalSteps - 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => {
    setErrorMsg('')
    setStatus('idle')
    setStep((s) => Math.max(s - 1, 0))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Team member operations ────────────────────────────────────────────────
  const addMember = () =>
    setForm((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { id: newId(), name: '', role: '', email: '', channel: '' },
      ],
    }))

  const removeMember = (id: string) =>
    setForm((prev) => {
      const next = prev.teamMembers.filter((m) => m.id !== id)
      return {
        ...prev,
        teamMembers: next.length ? next : [{ id: newId(), name: '', role: '', email: '', channel: '' }],
        primaryContactId: prev.primaryContactId === id ? '' : prev.primaryContactId,
      }
    })

  const updateMember = (id: string, key: keyof Omit<TeamMember, 'id'>, value: string) =>
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m) =>
        m.id === id ? { ...m, [key]: value } : m,
      ),
    }))

  // ─── Tool operations ───────────────────────────────────────────────────────
  const toggleTool = (key: string) =>
    setForm((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        [key]: { ...prev.tools[key], selected: !prev.tools[key].selected },
      },
    }))

  const setToolNote = (key: string, note: string) =>
    setForm((prev) => ({
      ...prev,
      tools: { ...prev.tools, [key]: { ...prev.tools[key], note } },
    }))

  // ─── File operations ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files)
    setForm((prev) => ({ ...prev, files: [...prev.files, ...incoming] }))
  }

  const removeFile = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== idx),
    }))

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg('')
    // Re-validate all required steps just in case.
    for (let i = 0; i < totalSteps - 1; i++) {
      const v = validateStep(i)
      if (v) {
        setErrorMsg(v)
        setStatus('error')
        setStep(i)
        return
      }
    }
    setStatus('submitting')
    try {
      const primary = form.teamMembers.find((m) => m.id === form.primaryContactId)
      const payload = {
        companyName: form.companyName.trim(),
        industry: form.industry,
        teamSize: form.teamSize,
        locations: Number(form.locations) || 0,
        description: form.description.trim(),
        teamMembers: form.teamMembers.map((m) => ({
          name: m.name.trim(),
          role: m.role.trim(),
          email: m.email.trim(),
          channel: m.channel.trim(),
        })),
        primaryContact: primary ? primary.name.trim() : '',
        tools: Object.entries(form.tools)
          .filter(([, t]) => t.selected)
          .map(([key, t]) => ({ key, note: t.note })),
        otherTool: form.otherTool.trim(),
        topTasks: form.topTasks,
        timeConsumingTasks: form.timeConsumingTasks,
        approvalRequired: form.approvalRequired,
        communicationStyle: form.communicationStyle,
        responseTime: form.responseTime,
        workStart: form.workStart,
        workEnd: form.workEnd,
        timezone: form.timezone,
        notes: form.notes,
        files: form.files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      }
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed.')
      }
      const data = await res.json().catch(() => ({}))
      setSuccessCompany(data.company || form.companyName.trim())
      setStatus('success')
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  // ─── Success view ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="bg-white border border-[var(--line)] rounded-[18px] p-8 sm:p-12 flex flex-col gap-5 max-w-[720px] mx-auto">
        <div
          className="font-serif-warm font-medium text-[44px] leading-[0.9]"
          style={{ color: 'var(--accent-2)' }}
        >
          ✓
        </div>
        <h2 className="font-serif-warm font-medium text-[clamp(28px,3vw,40px)] leading-[1.1] tracking-[-0.015em] m-0 serif-h">
          Thanks, <em>{successCompany}.</em> We&apos;ve got it.
        </h2>
        <p className="text-[16.5px] leading-[1.6] text-ink-2 m-0">
          We&apos;ll use this to configure your operator. Expect to hear from us within{' '}
          <strong className="text-ink font-medium">24 hours</strong> with next steps and the
          handful of follow-up questions we always have. If anything urgent comes up before
          then, email{' '}
          <a
            href="mailto:hello@firmcraft.ai"
            className="text-accent hover:underline underline-offset-[3px]"
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

  // ─── Form views ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[860px] mx-auto">
      {/* Progress */}
      <ProgressBar step={step} total={totalSteps} titles={STEP_TITLES} />

      <div className="bg-white border border-[var(--line)] rounded-[18px] p-6 sm:p-10 flex flex-col gap-7">
        <div>
          <div className="font-mono-warm text-[11px] tracking-[0.16em] uppercase text-muted mb-2">
            Step {step + 1} of {totalSteps}
          </div>
          <h2 className="font-serif-warm font-medium text-[clamp(26px,3vw,38px)] leading-[1.1] tracking-[-0.015em] m-0 serif-h">
            {step === 0 && (
              <>
                Tell us about your <em>business.</em>
              </>
            )}
            {step === 1 && (
              <>
                Who&apos;s on your <em>team?</em>
              </>
            )}
            {step === 2 && (
              <>
                What <em>tools</em> do you use?
              </>
            )}
            {step === 3 && (
              <>
                What <em>work</em> should the operator pick up?
              </>
            )}
            {step === 4 && (
              <>
                How should it <em>show up?</em>
              </>
            )}
            {step === 5 && (
              <>
                Anything to <em>share?</em>
              </>
            )}
          </h2>
        </div>

        {step === 0 && <Step1 form={form} update={update} />}
        {step === 1 && (
          <Step2
            form={form}
            update={update}
            addMember={addMember}
            removeMember={removeMember}
            updateMember={updateMember}
          />
        )}
        {step === 2 && (
          <Step3
            form={form}
            update={update}
            toggleTool={toggleTool}
            setToolNote={setToolNote}
          />
        )}
        {step === 3 && <Step4 form={form} update={update} />}
        {step === 4 && <Step5 form={form} update={update} />}
        {step === 5 && (
          <Step6
            form={form}
            addFiles={addFiles}
            removeFile={removeFile}
            fileInputRef={fileInputRef}
            dragActive={dragActive}
            setDragActive={setDragActive}
          />
        )}

        {status === 'error' && errorMsg && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-[13.5px]"
            style={{
              color: '#FB7C50',
              background: 'rgba(180,90,58,.08)',
              borderColor: 'rgba(180,90,58,.3)',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || status === 'submitting'}
            className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={status === 'submitting'}
              className="btn btn-primary"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="btn btn-primary btn-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit onboarding →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({
  step,
  total,
  titles,
}: {
  step: number
  total: number
  titles: string[]
}) {
  const pct = ((step + 1) / total) * 100
  return (
    <div className="mb-7">
      <div className="flex justify-between items-end mb-3 gap-3">
        <div className="font-mono-warm text-[11px] tracking-[0.16em] uppercase text-muted">
          {titles[step]}
        </div>
        <div className="font-mono-warm text-[11px] tracking-[0.16em] uppercase text-muted">
          {step + 1} / {total}
        </div>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--line)' }}
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`${titles[step]} (${step + 1} of ${total})`}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
      </div>
      <ol className="mt-3 hidden md:flex items-center gap-1.5 text-[10.5px] font-mono-warm tracking-[0.1em] uppercase text-muted overflow-x-auto">
        {titles.map((t, i) => (
          <li
            key={t}
            className={[
              'flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap',
              i === step
                ? 'text-ink bg-paper border border-[var(--line)]'
                : i < step
                ? 'text-accent'
                : '',
            ].join(' ')}
          >
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full flex-none"
              style={{
                background:
                  i === step
                    ? 'var(--accent)'
                    : i < step
                    ? 'var(--accent-2)'
                    : 'var(--line-2)',
              }}
            />
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Step 1: Business ────────────────────────────────────────────────────────

function Step1({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Company name" htmlFor="companyName" required>
          <input
            id="companyName"
            type="text"
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            autoComplete="organization"
            required
            className={inputClass}
            placeholder="Acme Dental"
          />
        </Field>
        <Field label="Industry" htmlFor="industry" required>
          <select
            id="industry"
            value={form.industry}
            onChange={(e) => update('industry', e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Pick one…
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium mb-1">
          Team size <span className="text-accent">*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TEAM_SIZES.map((size) => {
            const selected = form.teamSize === size
            return (
              <label
                key={size}
                className={[
                  'cursor-pointer rounded-xl border px-4 py-3 flex items-center gap-2 transition-all',
                  selected
                    ? 'border-ink bg-paper'
                    : 'border-[var(--line)] bg-white hover:border-[var(--line-2)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="teamSize"
                  value={size}
                  checked={selected}
                  onChange={() => update('teamSize', size)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={[
                    'inline-block w-3.5 h-3.5 rounded-full border-2 flex-none',
                    selected ? 'border-ink' : 'border-[var(--line-2)]',
                  ].join(' ')}
                  style={{
                    background: selected ? 'var(--ink)' : 'transparent',
                    boxShadow: selected ? 'inset 0 0 0 2px #fff' : undefined,
                  }}
                />
                <span className="font-serif-warm font-medium text-[15.5px] tracking-[-0.005em] text-ink">
                  {size}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Locations" htmlFor="locations" required>
          <input
            id="locations"
            type="number"
            min={0}
            step={1}
            value={form.locations}
            onChange={(e) => update('locations', e.target.value)}
            required
            className={inputClass}
            placeholder="1"
          />
        </Field>
      </div>

      <Field label="Brief description of what you do" htmlFor="description" required>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          required
          rows={4}
          className={`${inputClass} resize-y min-h-[110px]`}
          placeholder="What you sell, who buys it, and the rhythm of a typical week."
        />
      </Field>
    </div>
  )
}

// ─── Step 2: Team ────────────────────────────────────────────────────────────

function Step2({
  form,
  update,
  addMember,
  removeMember,
  updateMember,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  addMember: () => void
  removeMember: (id: string) => void
  updateMember: (id: string, key: keyof Omit<TeamMember, 'id'>, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
        Who will use the operator? Add one row per teammate. We&apos;ll use these to scope
        permissions and write each person&apos;s{' '}
        <code className="font-mono-warm text-[12.5px] bg-paper px-1.5 py-px rounded">
          USER.md
        </code>{' '}
        (the file that tells the operator who they are and what they can approve).
      </p>

      <div className="flex flex-col gap-4">
        {form.teamMembers.map((m, idx) => (
          <div
            key={m.id}
            className="rounded-xl border border-[var(--line)] bg-paper/40 p-4 sm:p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted">
                Teammate {idx + 1}
              </div>
              {form.teamMembers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="text-[12px] font-mono-warm tracking-[0.1em] uppercase text-muted hover:text-accent transition-colors"
                  aria-label={`Remove teammate ${idx + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name" htmlFor={`m-name-${m.id}`} required compact>
                <input
                  id={`m-name-${m.id}`}
                  type="text"
                  value={m.name}
                  onChange={(e) => updateMember(m.id, 'name', e.target.value)}
                  className={inputClass}
                  placeholder="Jane Partner"
                  autoComplete="off"
                />
              </Field>
              <Field label="Role" htmlFor={`m-role-${m.id}`} required compact>
                <input
                  id={`m-role-${m.id}`}
                  type="text"
                  value={m.role}
                  onChange={(e) => updateMember(m.id, 'role', e.target.value)}
                  className={inputClass}
                  placeholder="Managing Partner"
                  autoComplete="off"
                />
              </Field>
              <Field label="Email" htmlFor={`m-email-${m.id}`} required compact>
                <input
                  id={`m-email-${m.id}`}
                  type="email"
                  value={m.email}
                  onChange={(e) => updateMember(m.id, 'email', e.target.value)}
                  className={inputClass}
                  placeholder="jane@acme.com"
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Preferred channel"
                htmlFor={`m-channel-${m.id}`}
                required
                compact
              >
                <select
                  id={`m-channel-${m.id}`}
                  value={m.channel}
                  onChange={(e) => updateMember(m.id, 'channel', e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Pick one…
                  </option>
                  {COMM_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button type="button" onClick={addMember} className="btn btn-ghost">
          + Add teammate
        </button>
        <span className="text-[12.5px] text-muted">
          Add as many as you need. You can revise after onboarding.
        </span>
      </div>

      <Field label="Primary point of contact" htmlFor="primaryContact" required>
        <select
          id="primaryContact"
          value={form.primaryContactId}
          onChange={(e) => update('primaryContactId', e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Pick from the team above…
          </option>
          {form.teamMembers
            .filter((m) => m.name.trim())
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.trim()}
                {m.role.trim() ? ` — ${m.role.trim()}` : ''}
              </option>
            ))}
        </select>
      </Field>
    </div>
  )
}

// ─── Step 3: Tools ───────────────────────────────────────────────────────────

function Step3({
  form,
  update,
  toggleTool,
  setToolNote,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  toggleTool: (key: string) => void
  setToolNote: (key: string, note: string) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
        Check the tools your team actually uses. For each one, a quick note on{' '}
        <em>how</em> you use it helps us scope integrations and permissions.
      </p>

      {TOOL_CATEGORIES.map((cat) => (
        <div key={cat.name} className="flex flex-col gap-3">
          <h3 className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-accent font-medium m-0">
            {cat.name}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {cat.tools.map((t) => {
              const sel = form.tools[t.key]
              return (
                <div
                  key={t.key}
                  className={[
                    'rounded-xl border transition-all',
                    sel.selected
                      ? 'border-ink bg-paper'
                      : 'border-[var(--line)] bg-white hover:border-[var(--line-2)]',
                  ].join(' ')}
                >
                  <label className="cursor-pointer flex items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={sel.selected}
                      onChange={() => toggleTool(t.key)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={[
                        'inline-grid place-items-center w-4 h-4 rounded-[4px] border-2 flex-none transition-all',
                        sel.selected ? 'border-ink' : 'border-[var(--line-2)]',
                      ].join(' ')}
                      style={{
                        background: sel.selected ? 'var(--ink)' : 'transparent',
                      }}
                    >
                      {sel.selected && (
                        <span
                          className="text-[10px] leading-none"
                          style={{ color: 'var(--paper)' }}
                        >
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="font-serif-warm font-medium text-[15.5px] tracking-[-0.005em] text-ink">
                      {t.label}
                    </span>
                  </label>
                  {sel.selected && (
                    <div className="px-3 pb-3 -mt-1">
                      <input
                        type="text"
                        value={sel.note}
                        onChange={(e) => setToolNote(t.key, e.target.value)}
                        className={`${inputClass} text-[13.5px] py-2`}
                        placeholder="How do you use it?"
                        aria-label={`How do you use ${t.label}?`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <Field label="Other (free text)" htmlFor="otherTool">
        <input
          id="otherTool"
          type="text"
          value={form.otherTool}
          onChange={(e) => update('otherTool', e.target.value)}
          className={inputClass}
          placeholder="Anything else we should connect to?"
        />
      </Field>
    </div>
  )
}

// ─── Step 4: Workflows ───────────────────────────────────────────────────────

function Step4({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const setTopTask = (idx: number, value: string) => {
    const next = form.topTasks.slice()
    next[idx] = value
    update('topTasks', next)
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <label className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium block mb-1">
            Top 5 tasks you&apos;d like to automate <span className="text-accent">*</span>
          </label>
          <p className="text-[13px] text-muted m-0">
            Ranked 1–5, most important first. Plain English — &ldquo;send the weekly invoice
            reminders,&rdquo; &ldquo;triage new patient intake,&rdquo; etc.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {form.topTasks.map((t, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span
                className="font-serif-warm font-medium text-[24px] leading-[1] flex-none mt-2"
                style={{ color: 'var(--accent)' }}
                aria-hidden
              >
                {idx + 1}
              </span>
              <textarea
                value={t}
                onChange={(e) => setTopTask(idx, e.target.value)}
                rows={2}
                className={`${inputClass} resize-y min-h-[56px] flex-1`}
                placeholder={
                  idx === 0
                    ? "The single biggest time-suck."
                    : `Task #${idx + 1}…`
                }
                aria-label={`Task ${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Field
        label="What tasks does your team spend the most time on?"
        htmlFor="timeConsumingTasks"
      >
        <textarea
          id="timeConsumingTasks"
          value={form.timeConsumingTasks}
          onChange={(e) => update('timeConsumingTasks', e.target.value)}
          rows={4}
          className={`${inputClass} resize-y min-h-[100px]`}
          placeholder="Where does the calendar disappear? Specific roles + what they do."
        />
      </Field>

      <Field
        label="Tasks the operator should NEVER do without your approval"
        htmlFor="approvalRequired"
      >
        <textarea
          id="approvalRequired"
          value={form.approvalRequired}
          onChange={(e) => update('approvalRequired', e.target.value)}
          rows={4}
          className={`${inputClass} resize-y min-h-[100px]`}
          placeholder="Anything that touches money, sends to clients, or is otherwise irreversible."
        />
      </Field>
    </div>
  )
}

// ─── Step 5: Preferences ─────────────────────────────────────────────────────

function Step5({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium mb-1">
          Communication style <span className="text-accent">*</span>
        </legend>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {COMM_STYLES.map((opt) => {
            const selected = form.communicationStyle === opt.value
            return (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-xl border p-4 flex flex-col gap-1 transition-all',
                  selected
                    ? 'border-ink bg-paper'
                    : 'border-[var(--line)] bg-white hover:border-[var(--line-2)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="communicationStyle"
                  value={opt.value}
                  checked={selected}
                  onChange={() => update('communicationStyle', opt.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={[
                      'inline-block w-3.5 h-3.5 rounded-full border-2 flex-none',
                      selected ? 'border-ink' : 'border-[var(--line-2)]',
                    ].join(' ')}
                    style={{
                      background: selected ? 'var(--ink)' : 'transparent',
                      boxShadow: selected ? 'inset 0 0 0 2px #fff' : undefined,
                    }}
                  />
                  <span className="font-serif-warm font-medium text-[15.5px] tracking-[-0.005em] text-ink">
                    {opt.label}
                  </span>
                </span>
                <span className="text-[12.5px] text-muted leading-[1.4] pl-6">
                  {opt.sub}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium mb-1">
          Response time expectations <span className="text-accent">*</span>
        </legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {RESPONSE_TIMES.map((opt) => {
            const selected = form.responseTime === opt.value
            return (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-xl border p-4 flex flex-col gap-1 transition-all',
                  selected
                    ? 'border-ink bg-paper'
                    : 'border-[var(--line)] bg-white hover:border-[var(--line-2)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="responseTime"
                  value={opt.value}
                  checked={selected}
                  onChange={() => update('responseTime', opt.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={[
                      'inline-block w-3.5 h-3.5 rounded-full border-2 flex-none',
                      selected ? 'border-ink' : 'border-[var(--line-2)]',
                    ].join(' ')}
                    style={{
                      background: selected ? 'var(--ink)' : 'transparent',
                      boxShadow: selected ? 'inset 0 0 0 2px #fff' : undefined,
                    }}
                  />
                  <span className="font-serif-warm font-medium text-[15px] tracking-[-0.005em] text-ink">
                    {opt.label}
                  </span>
                </span>
                <span className="text-[12px] text-muted leading-[1.4] pl-6">
                  {opt.sub}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Working hours start" htmlFor="workStart" required>
          <input
            id="workStart"
            type="time"
            value={form.workStart}
            onChange={(e) => update('workStart', e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Working hours end" htmlFor="workEnd" required>
          <input
            id="workEnd"
            type="time"
            value={form.workEnd}
            onChange={(e) => update('workEnd', e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Timezone" htmlFor="timezone" required>
          <select
            id="timezone"
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            className={inputClass}
            required
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Anything else we should know?" htmlFor="notes">
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
          className={`${inputClass} resize-y min-h-[100px]`}
          placeholder="Quirks, sensitivities, ongoing initiatives, recent incidents — anything that shapes how the operator should show up."
        />
      </Field>
    </div>
  )
}

// ─── Step 6: Documents ───────────────────────────────────────────────────────

function Step6({
  form,
  addFiles,
  removeFile,
  fileInputRef,
  dragActive,
  setDragActive,
}: {
  form: FormState
  addFiles: (files: FileList | File[]) => void
  removeFile: (idx: number) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  dragActive: boolean
  setDragActive: (b: boolean) => void
}) {
  const totalSize = useMemo(
    () => form.files.reduce((acc, f) => acc + f.size, 0),
    [form.files],
  )
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14.5px] text-ink-2 leading-[1.55] m-0">
        Optional. These help us configure your operator faster — org chart, process docs,
        pricing sheets, brand guidelines, anything else we should see. You can always add
        more later.
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
            addFiles(e.dataTransfer.files)
          }
        }}
        className={[
          'rounded-xl border-2 border-dashed p-8 sm:p-10 text-center transition-colors',
          dragActive
            ? 'border-accent bg-paper'
            : 'border-[var(--line-2)] bg-white hover:border-ink',
        ].join(' ')}
      >
        <div
          className="font-serif-warm font-medium text-[34px] leading-[1] mb-3"
          style={{ color: 'var(--accent)' }}
          aria-hidden
        >
          ↓
        </div>
        <p className="font-serif-warm font-medium text-[20px] tracking-[-0.01em] m-0 mb-1">
          Drop files here, <em>or click to browse.</em>
        </p>
        <p className="text-[13px] text-muted m-0 mb-4">
          PDF, DOCX, XLSX, PNG, JPG.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost"
        >
          Choose files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(e.target.files)
              e.target.value = ''
            }
          }}
          className="sr-only"
          aria-label="Upload reference documents"
        />
      </div>

      {form.files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium m-0">
              {form.files.length} file{form.files.length === 1 ? '' : 's'} attached
            </h4>
            <span className="font-mono-warm text-[11px] text-muted">
              {formatBytes(totalSize)} total
            </span>
          </div>
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {form.files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex items-center gap-3 bg-paper border border-[var(--line)] rounded-lg px-3 py-2 text-[13.5px]"
              >
                <span
                  aria-hidden
                  className="font-mono-warm text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-white border border-[var(--line)] text-muted"
                >
                  {(f.name.split('.').pop() || '?').toUpperCase()}
                </span>
                <span className="flex-1 text-ink truncate">{f.name}</span>
                <span className="font-mono-warm text-[11px] text-muted flex-none">
                  {formatBytes(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-[11px] font-mono-warm tracking-[0.1em] uppercase text-muted hover:text-accent transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted leading-[1.5] mt-1 m-0">
            Note: for v1 we capture file names so we know what to ask for. Once our storage
            backend is wired, you&apos;ll be able to upload directly from this page. For now
            we&apos;ll follow up by email.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Shared field + input ────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-[var(--line)] bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:bg-white transition-colors'

function Field({
  label,
  htmlFor,
  required,
  compact,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
      <label
        htmlFor={htmlFor}
        className="font-mono-warm text-[11px] tracking-[0.14em] uppercase text-muted font-medium"
      >
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
    </div>
  )
}
