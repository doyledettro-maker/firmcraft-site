'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { Button, Field, FieldGroup, Hint, Input, Label, Select, Textarea } from './ui'

type Priority = 'low' | 'normal' | 'high' | 'urgent'

export function SupportContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [description, setDescription] = useState('')

  function reset() {
    setName('')
    setEmail('')
    setSubject('')
    setPriority('normal')
    setDescription('')
    setSubmitted(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const payload = { name, email, subject, priority, description, submittedAt: new Date().toISOString() }
    // TODO: wire to email/ticketing backend (Resend, Linear, etc).
    // For now we just log to the console so we can verify intake locally.
    // eslint-disable-next-line no-console
    console.log('[firmcraft.support] new ticket', payload)
    await new Promise((r) => setTimeout(r, 400))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#A8D08A]/25 bg-[#1A2D14] px-6 py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-[#A8D08A] mx-auto mb-3" />
        <div className="font-serif-warm text-[24px] tracking-[-0.01em]">Message received</div>
        <p className="text-ink-2 mt-2 max-w-[440px] mx-auto">
          A Firmcraft operator will reach out at <span className="font-mono-warm">{email || 'your email'}</span> shortly.
          For urgent production issues, also email{' '}
          <a href="mailto:support@firmcraft.ai" className="text-ink underline underline-offset-2">
            support@firmcraft.ai
          </a>
          .
        </p>
        <button
          onClick={reset}
          className="mt-5 text-[13px] text-ink-2 hover:text-ink underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <FieldGroup>
        <Field>
          <Label htmlFor="support-name">Your name</Label>
          <Input
            id="support-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Doyle Dettro"
          />
        </Field>
        <Field>
          <Label htmlFor="support-email">Email</Label>
          <Input
            id="support-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@firm.com"
          />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <Label htmlFor="support-subject">Subject</Label>
          <Input
            id="support-subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Quick summary of the issue"
          />
        </Field>
        <Field>
          <Label htmlFor="support-priority">Priority</Label>
          <Select
            id="support-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low — question / nice-to-have</option>
            <option value="normal">Normal — needs attention this week</option>
            <option value="high">High — blocking work today</option>
            <option value="urgent">Urgent — production incident</option>
          </Select>
          <Hint>Use “Urgent” only for outages — pages on-call.</Hint>
        </Field>
      </FieldGroup>

      <Field>
        <Label htmlFor="support-description">What’s going on?</Label>
        <Textarea
          id="support-description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What were you doing, what happened, what did you expect? Paste any error messages."
          rows={6}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          <Send className="w-4 h-4" />
          {submitting ? 'Sending…' : 'Submit ticket'}
        </Button>
      </div>
    </form>
  )
}
