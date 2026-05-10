'use client'

import { useState } from 'react'
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
