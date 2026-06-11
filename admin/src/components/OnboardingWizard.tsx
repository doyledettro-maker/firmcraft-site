'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Plus, Trash2, Check } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Field,
  FieldGroup,
  Hint,
  Input,
  Label,
  Radio,
  SectionHeading,
  Select,
  Stepper,
  Textarea,
} from './ui'
import { Logo } from './Logo'
import {
  emptySurvey,
  planMeta,
  sectionTitles,
  type Contact,
  type SurveyData,
} from '@/lib/survey'

type Update = <K extends keyof SurveyData>(key: K, value: SurveyData[K]) => void

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 1: Company Profile                                            */
/* ─────────────────────────────────────────────────────────────────────── */

function S1Company({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 1 of 10"
        title={<>Tell us about your <em>company</em>.</>}
        description="The basics — who you are, how big you are, and who we should talk to."
      />
      <FieldGroup>
        <Field>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" value={data.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Acme Co." />
        </Field>
        <Field>
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" value={data.industry} onChange={(e) => update('industry', e.target.value)} placeholder="e.g. Legal services, Architecture" />
        </Field>
        <Field>
          <Label htmlFor="companySize">Company size</Label>
          <Select id="companySize" value={data.companySize} onChange={(e) => update('companySize', e.target.value as SurveyData['companySize'])}>
            <option value="">Select size…</option>
            <option value="1-10">1–10 employees</option>
            <option value="11-50">11–50 employees</option>
            <option value="51-200">51–200 employees</option>
            <option value="201-500">201–500 employees</option>
            <option value="500+">500+ employees</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="website">Website</Label>
          <Input id="website" type="url" value={data.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" />
        </Field>
      </FieldGroup>
      <div className="mt-6">
        <h4 className="font-sans font-semibold text-[20px] tracking-[-0.01em]">Primary contact</h4>
        <Hint>The main person we&rsquo;ll work with during onboarding.</Hint>
      </div>
      <FieldGroup className="mt-3">
        <Field>
          <Label htmlFor="contactName">Full name</Label>
          <Input id="contactName" value={data.primaryContactName} onChange={(e) => update('primaryContactName', e.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" type="email" value={data.primaryContactEmail} onChange={(e) => update('primaryContactEmail', e.target.value)} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="contactRole">Role / title</Label>
          <Input id="contactRole" value={data.primaryContactRole} onChange={(e) => update('primaryContactRole', e.target.value)} placeholder="e.g. Managing Partner, COO" />
        </Field>
      </FieldGroup>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 2: Current Tech Stack                                         */
/* ─────────────────────────────────────────────────────────────────────── */

const COMM_TOOLS = ['Slack', 'Microsoft Teams', 'Discord', 'Email only', 'Google Chat', 'Other']
const AI_TOOLS = ['ChatGPT / OpenAI', 'Claude (Anthropic)', 'GitHub Copilot', 'Google Gemini', 'Custom in-house', 'None yet']

function S2TechStack({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 2 of 10"
        title={<>What&rsquo;s in your <em>tech stack</em> today?</>}
        description="We integrate with the tools you already use. Tell us what's in play so we can plan the connections."
      />
      <FieldGroup>
        <Field>
          <Label htmlFor="crm">CRM</Label>
          <Input id="crm" value={data.crm} onChange={(e) => update('crm', e.target.value)} placeholder="Salesforce, HubSpot, Clio, none, etc." />
        </Field>
        <Field>
          <Label htmlFor="pm">Project management</Label>
          <Input id="pm" value={data.projectManagement} onChange={(e) => update('projectManagement', e.target.value)} placeholder="Asana, Linear, Jira, Monday, etc." />
        </Field>
      </FieldGroup>

      <div className="mt-7">
        <Label>Communication tools</Label>
        <Hint>Where does your team actually talk? (Pick all that apply.)</Hint>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {COMM_TOOLS.map((tool) => (
            <Checkbox
              key={tool}
              label={tool}
              checked={data.communicationTools.includes(tool)}
              onChange={() => update('communicationTools', toggleInArray(data.communicationTools, tool))}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Cloud provider</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {(['AWS', 'GCP', 'Azure', 'On-prem', 'None', 'Other'] as const).map((p) => (
            <Radio
              key={p}
              label={p}
              name="cloudProvider"
              checked={data.cloudProvider === p}
              onChange={() => update('cloudProvider', p)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Existing AI tools in use</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {AI_TOOLS.map((tool) => (
            <Checkbox
              key={tool}
              label={tool}
              checked={data.existingAITools.includes(tool)}
              onChange={() => update('existingAITools', toggleInArray(data.existingAITools, tool))}
            />
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 3: AI Readiness                                                */
/* ─────────────────────────────────────────────────────────────────────── */

function ScaleField({
  label,
  hint,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  hint?: string
  value: number
  onChange: (n: number) => void
  lowLabel: string
  highLabel: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      {hint ? <Hint>{hint}</Hint> : null}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-12 rounded-lg border font-mono text-[13px] transition-colors ${
                active ? 'bg-accent text-white border-accent' : 'bg-paper border-line-2 hover:border-accent text-ink'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-[12px] text-muted mt-2 font-mono uppercase tracking-[0.12em]">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

function S3Readiness({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 3 of 10"
        title={<>How <em>AI-ready</em> is your team today?</>}
        description="No wrong answers — this just tells us how much hand-holding to plan for."
      />
      <div className="grid gap-7">
        <ScaleField
          label="Technical maturity"
          hint="How comfortable is your team with technical integration work — APIs, webhooks, scripting?"
          value={data.technicalMaturity}
          onChange={(n) => update('technicalMaturity', n)}
          lowLabel="Non-technical"
          highLabel="Engineering team"
        />
        <div>
          <Label>Data infrastructure</Label>
          <Hint>How is your operational data organized today?</Hint>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {([
              ['none', 'None', 'Spreadsheets, email threads'],
              ['basic', 'Basic', 'A few SaaS tools, no warehouse'],
              ['moderate', 'Moderate', 'CRM + PM, some reporting'],
              ['advanced', 'Advanced', 'Warehouse, BI, pipelines'],
            ] as const).map(([val, lbl, desc]) => (
              <Radio
                key={val}
                label={lbl}
                description={desc}
                name="dataInfrastructure"
                checked={data.dataInfrastructure === val}
                onChange={() => update('dataInfrastructure', val)}
              />
            ))}
          </div>
        </div>
        <ScaleField
          label="Team AI familiarity"
          hint="How often does your team already use AI tools day-to-day?"
          value={data.teamAIFamiliarity}
          onChange={(n) => update('teamAIFamiliarity', n)}
          lowLabel="Rarely"
          highLabel="Daily power users"
        />
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 4: Use Case Priorities (rank)                                  */
/* ─────────────────────────────────────────────────────────────────────── */

function S4Priorities({ data, update }: { data: SurveyData; update: Update }) {
  function move(index: number, dir: -1 | 1) {
    const next = [...data.useCasePriorities]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update('useCasePriorities', next)
  }
  return (
    <>
      <SectionHeading
        eyebrow="Step 4 of 10"
        title={<>What should the operator <em>focus on first</em>?</>}
        description="Drag-rank by importance. Top of the list is what we&rsquo;ll wire up in week one."
      />
      <ol className="grid gap-2 max-w-[640px]">
        {data.useCasePriorities.map((item, i) => (
          <li
            key={item}
            className="flex items-center gap-3 bg-paper-2 border border-line rounded-xl px-4 py-3"
          >
            <span className="font-mono text-[12px] text-accent w-6 text-center">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 font-medium text-[14.5px]">{item}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 grid place-items-center rounded-md border border-line-2 hover:border-accent disabled:opacity-30 disabled:hover:border-line-2"
                aria-label="Move up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === data.useCasePriorities.length - 1}
                className="w-8 h-8 grid place-items-center rounded-md border border-line-2 hover:border-accent disabled:opacity-30 disabled:hover:border-line-2"
                aria-label="Move down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 5: Integration Requirements                                    */
/* ─────────────────────────────────────────────────────────────────────── */

const SYSTEMS = [
  'CRM (Salesforce, HubSpot, Clio…)',
  'Email (Gmail, Outlook)',
  'Calendar',
  'Project management',
  'Document storage (Drive, SharePoint, Dropbox)',
  'Accounting (QuickBooks, Xero)',
  'E-signature (DocuSign, Adobe Sign)',
  'Helpdesk / ticketing',
  'Custom internal tools',
]

const DATA_SOURCES = [
  'Internal SOPs / wikis',
  'Email archives',
  'Document repository',
  'Database / data warehouse',
  'Public website / marketing',
  'Vendor / customer portals',
]

function S5Integrations({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 5 of 10"
        title={<>What systems should it <em>plug into</em>?</>}
        description="We support most modern SaaS APIs. Tell us what to connect on day one."
      />
      <div>
        <Label>Systems to connect</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {SYSTEMS.map((sys) => (
            <Checkbox
              key={sys}
              label={sys}
              checked={data.systemsToConnect.includes(sys)}
              onChange={() => update('systemsToConnect', toggleInArray(data.systemsToConnect, sys))}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>API availability</Label>
        <Hint>Do those systems expose APIs we can talk to?</Hint>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {([
            ['all', 'All have APIs'],
            ['some', 'Some do'],
            ['none', 'None / unsure'],
            ['unknown', 'Not sure yet'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="apiAvailability"
              checked={data.apiAvailability === val}
              onChange={() => update('apiAvailability', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>SSO provider</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {([
            ['okta', 'Okta'],
            ['google', 'Google Workspace'],
            ['azure-ad', 'Microsoft Entra / Azure AD'],
            ['auth0', 'Auth0'],
            ['none', 'No SSO yet'],
            ['other', 'Other'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="ssoProvider"
              checked={data.ssoProvider === val}
              onChange={() => update('ssoProvider', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Data sources for grounding</Label>
        <Hint>Where will the operator pull context from when answering questions?</Hint>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {DATA_SOURCES.map((src) => (
            <Checkbox
              key={src}
              label={src}
              checked={data.dataSources.includes(src)}
              onChange={() => update('dataSources', toggleInArray(data.dataSources, src))}
            />
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 6: Security & Compliance                                       */
/* ─────────────────────────────────────────────────────────────────────── */

const REGULATIONS = ['HIPAA', 'SOC 2', 'GDPR', 'CCPA', 'PCI-DSS', 'ITAR', 'FedRAMP', 'State bar / attorney privilege', 'Other']
const FRAMEWORKS = ['ISO 27001', 'NIST CSF', 'CIS Controls', 'Internal infosec policy', 'Vendor risk program', 'None yet']

function S6Security({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 6 of 10"
        title={<>What about <em>security &amp; compliance</em>?</>}
        description="Honest answers help us configure the right tenant — encryption, audit logs, data residency, etc."
      />
      <div>
        <Label>Industry regulations that apply</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {REGULATIONS.map((r) => (
            <Checkbox
              key={r}
              label={r}
              checked={data.industryRegulations.includes(r)}
              onChange={() => update('industryRegulations', toggleInArray(data.industryRegulations, r))}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Data residency requirement</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {([
            ['us', 'US only'],
            ['eu', 'EU only'],
            ['apac', 'APAC only'],
            ['no-pref', 'No preference'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="dataResidency"
              checked={data.dataResidency === val}
              onChange={() => update('dataResidency', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Checkbox
          label="We need audit logs of every action the operator takes."
          description="Required for regulated industries; recommended for everyone."
          checked={data.auditNeeds}
          onChange={(e) => update('auditNeeds', e.currentTarget.checked)}
        />
      </div>

      <div className="mt-7">
        <Label>Existing security frameworks</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {FRAMEWORKS.map((f) => (
            <Checkbox
              key={f}
              label={f}
              checked={data.existingFrameworks.includes(f)}
              onChange={() => update('existingFrameworks', toggleInArray(data.existingFrameworks, f))}
            />
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 7: Team & Access                                               */
/* ─────────────────────────────────────────────────────────────────────── */

const DEPARTMENTS = ['Executive', 'Operations', 'Sales', 'Marketing', 'Finance', 'Legal', 'HR', 'Engineering', 'Customer success', 'Other']

function ContactList({
  contacts,
  onChange,
  addLabel,
}: {
  contacts: Contact[]
  onChange: (next: Contact[]) => void
  addLabel: string
}) {
  function update(i: number, patch: Partial<Contact>) {
    const next = contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onChange(next)
  }
  function remove(i: number) {
    onChange(contacts.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...contacts, { name: '', email: '' }])
  }
  return (
    <div className="grid gap-3">
      {contacts.map((c, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-start">
          <Input
            placeholder="Full name"
            value={c.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={c.email}
            onChange={(e) => update(i, { email: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={contacts.length === 1}
            className="h-10 w-10 grid place-items-center rounded-md border border-line-2 text-muted hover:text-ink hover:border-accent disabled:opacity-30"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="w-fit">
        <Plus className="w-4 h-4" /> {addLabel}
      </Button>
    </div>
  )
}

function S7Team({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 7 of 10"
        title={<>Who&rsquo;ll <em>use</em> it?</>}
        description="Seats, departments, and who runs the show on your side."
      />
      <FieldGroup>
        <Field>
          <Label htmlFor="numUsers">Approximate number of users</Label>
          <Input
            id="numUsers"
            inputMode="numeric"
            value={data.numberOfUsers}
            onChange={(e) => update('numberOfUsers', e.target.value)}
            placeholder="e.g. 25"
          />
        </Field>
        <Field>
          <Label>Training preference</Label>
          <Select
            value={data.trainingPreference}
            onChange={(e) => update('trainingPreference', e.target.value as SurveyData['trainingPreference'])}
          >
            <option value="">Select…</option>
            <option value="self-serve">Self-serve docs &amp; videos</option>
            <option value="guided">Guided live training session</option>
            <option value="white-glove">White-glove department-by-department rollout</option>
          </Select>
        </Field>
      </FieldGroup>

      <div className="mt-7">
        <Label>Departments / roles using the operator</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {DEPARTMENTS.map((d) => (
            <Checkbox
              key={d}
              label={d}
              checked={data.departments.includes(d)}
              onChange={() => update('departments', toggleInArray(data.departments, d))}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Admin contacts</Label>
        <Hint>Who can approve config changes, invite users, and manage billing?</Hint>
        <div className="mt-3">
          <ContactList
            contacts={data.adminContacts}
            onChange={(c) => update('adminContacts', c)}
            addLabel="Add admin"
          />
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 8: Budget & Timeline                                           */
/* ─────────────────────────────────────────────────────────────────────── */

function S8Budget({ data, update }: { data: SurveyData; update: Update }) {
  const tiers: Array<{ key: 'spark' | 'flow' | 'forge'; features: string[] }> = [
    {
      key: 'spark',
      features: ['1 team / channel', '8k AI calls/mo', 'Core integrations', 'Email support'],
    },
    {
      key: 'flow',
      features: ['Multi-team', '25k AI calls/mo', 'All integrations', 'Custom playbooks', 'Slack support'],
    },
    {
      key: 'forge',
      features: ['Unlimited teams', '80k AI calls/mo', 'SSO + audit log', 'Dedicated tenant', 'Custom SLAs'],
    },
  ]
  return (
    <>
      <SectionHeading
        eyebrow="Step 8 of 10"
        title={<>Pick a <em>plan &amp; timeline</em>.</>}
        description="Flat monthly rate. You can change tiers any time — we'll prorate."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map(({ key, features }) => {
          const meta = planMeta[key]
          const active = data.planTier === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => update('planTier', key)}
              className={`text-left rounded-2xl border p-6 transition-all ${
                active
                  ? 'bg-accent text-white border-accent shadow-lift-lg'
                  : 'bg-paper-2 border-line hover:border-accent'
              }`}
            >
              <div className={`font-mono text-[11px] uppercase tracking-[0.16em] ${active ? 'text-white/70' : 'text-muted'}`}>
                {key.toUpperCase()}
              </div>
              <div className="mt-1 font-sans font-semibold text-[28px] leading-none">{meta.name}</div>
              <div className="mt-2 font-sans font-semibold text-[34px] leading-none">{meta.price}</div>
              <div className={`mt-1 text-[13.5px] ${active ? 'text-white/85' : 'text-ink-2'}`}>{meta.tagline}</div>
              <ul className={`mt-4 grid gap-1.5 text-[13.5px] ${active ? 'text-white/85' : 'text-ink-2'}`}>
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 flex-none mt-0.5 ${active ? 'text-white' : 'text-accent-2'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        <Label>Implementation timeline</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {([
            ['asap', 'ASAP (this week)'],
            ['30-days', 'In 30 days'],
            ['60-days', 'In 60 days'],
            ['90-days', 'In 90 days'],
            ['flexible', 'Flexible'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="implementationTimeline"
              checked={data.implementationTimeline === val}
              onChange={() => update('implementationTimeline', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label htmlFor="successMetrics">How will you measure success?</Label>
        <Hint>Hours saved, response time, deals closed, tickets handled — be specific if you can.</Hint>
        <Textarea
          id="successMetrics"
          className="mt-3"
          value={data.successMetrics}
          onChange={(e) => update('successMetrics', e.target.value)}
          placeholder="e.g. cut intake-to-engagement time from 5 days to 1; automate 80% of conflict checks…"
        />
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 9: Communication Preferences                                   */
/* ─────────────────────────────────────────────────────────────────────── */

function S9Communication({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 9 of 10"
        title={<>How should we <em>stay in touch</em>?</>}
        description="During onboarding and ongoing operations."
      />
      <div>
        <Label>Primary contact method</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          {([
            ['email', 'Email'],
            ['slack', 'Shared Slack channel'],
            ['phone', 'Phone / video call'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="primaryContactMethod"
              checked={data.primaryContactMethod === val}
              onChange={() => update('primaryContactMethod', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Status update frequency</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {([
            ['daily', 'Daily standup'],
            ['weekly', 'Weekly digest'],
            ['biweekly', 'Bi-weekly'],
            ['monthly', 'Monthly'],
          ] as const).map(([val, lbl]) => (
            <Radio
              key={val}
              label={lbl}
              name="updateFrequency"
              checked={data.updateFrequency === val}
              onChange={() => update('updateFrequency', val)}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Label>Escalation contacts</Label>
        <Hint>Who do we page when something needs human review or goes wrong outside business hours?</Hint>
        <div className="mt-3">
          <ContactList
            contacts={data.escalationContacts}
            onChange={(c) => update('escalationContacts', c)}
            addLabel="Add escalation contact"
          />
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Section 10: Custom Requirements                                        */
/* ─────────────────────────────────────────────────────────────────────── */

function S10Custom({ data, update }: { data: SurveyData; update: Update }) {
  return (
    <>
      <SectionHeading
        eyebrow="Step 10 of 10"
        title={<>Anything <em>else</em> we should know?</>}
        description="Edge cases, hard requirements, things you wish other vendors had asked. Be candid — this is where we calibrate."
      />
      <div className="grid gap-6">
        <div>
          <Label htmlFor="specialNeeds">Special needs or constraints</Label>
          <Hint>Air-gapped network? Translation languages? Specific industry quirks?</Hint>
          <Textarea
            id="specialNeeds"
            className="mt-3"
            value={data.specialNeeds}
            onChange={(e) => update('specialNeeds', e.target.value)}
            placeholder="e.g. all data must stay on-prem; we operate in EN/ES/FR…"
          />
        </div>
        <div>
          <Label htmlFor="priorityFeatures">Priority features</Label>
          <Hint>What would make this a clear win in the first 30 days?</Hint>
          <Textarea
            id="priorityFeatures"
            className="mt-3"
            value={data.priorityFeatures}
            onChange={(e) => update('priorityFeatures', e.target.value)}
            placeholder="e.g. automated client intake summaries, conflict checks, weekly KPI digests…"
          />
        </div>
        <div>
          <Label htmlFor="dealBreakers">Deal-breakers</Label>
          <Hint>What would cause you to walk away? We&rsquo;d rather know now than later.</Hint>
          <Textarea
            id="dealBreakers"
            className="mt-3"
            value={data.dealBreakers}
            onChange={(e) => update('dealBreakers', e.target.value)}
            placeholder="e.g. any model training on our data; no on-call coverage; long-term contracts…"
          />
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Wizard shell                                                          */
/* ─────────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  S1Company,
  S2TechStack,
  S3Readiness,
  S4Priorities,
  S5Integrations,
  S6Security,
  S7Team,
  S8Budget,
  S9Communication,
  S10Custom,
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<SurveyData>(emptySurvey)
  const [submitted, setSubmitted] = useState(false)

  const update: Update = (key, value) => setData((d) => ({ ...d, [key]: value }))

  const Section = SECTIONS[step]
  const isLast = step === SECTIONS.length - 1
  const stepperItems = useMemo(() => sectionTitles.map((label) => ({ label })), [])

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-6 py-16">
        <Card className="max-w-[560px] w-full text-center">
          <CardBody className="py-10">
            <div className="w-14 h-14 mx-auto rounded-full bg-accent-2 grid place-items-center text-white">
              <Check className="w-7 h-7" />
            </div>
            <h1 className="font-sans font-semibold text-[34px] mt-5 tracking-[-0.02em]">
              Marked <em className="not-italic text-accent">reviewed.</em>
            </h1>
            <p className="text-ink-2 mt-3 leading-relaxed">
              In production this will move the submission to the &ldquo;reviewed&rdquo;
              pile and trigger the kickoff scheduling email to{' '}
              <span className="font-medium text-ink">{data.primaryContactEmail || 'the primary contact'}</span>.
              For now this is just a UI preview.
            </p>
            <div className="flex gap-3 justify-center mt-7">
              <Link href="/onboarding">
                <Button variant="ghost">← Back to inbox</Button>
              </Link>
              <Button onClick={() => { setSubmitted(false); setStep(0); setData(emptySurvey) }}>
                Reset preview
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-line">
        <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/onboarding" className="no-underline">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-[13px] text-muted">
            <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              Submission preview
            </span>
            <span className="hidden sm:inline">
              Section <span className="text-ink font-medium">{step + 1}</span> of {SECTIONS.length}
            </span>
            <Link href="/onboarding">
              <Button variant="ghost" size="sm">← Back to inbox</Button>
            </Link>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-[3px] bg-line">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${((step + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1">
        <div className="max-w-[1240px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          {/* Sidebar stepper */}
          <aside className="hidden lg:block sticky top-24 self-start">
            <div className="eyebrow mb-3">Sections</div>
            <Stepper steps={stepperItems} current={step} onJump={(i) => setStep(i)} />
          </aside>

          {/* Form */}
          <main>
            <Card className="shadow-lift">
              <CardBody className="p-8 md:p-10">
                <Section data={data} update={update} />
              </CardBody>
            </Card>

            {/* Nav */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              {isLast ? (
                <Button onClick={() => setSubmitted(true)}>
                  Mark reviewed
                  <Check className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}>
                  Next section
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
