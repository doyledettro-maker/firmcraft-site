import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

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
type Industry = (typeof INDUSTRIES)[number]

const TEAM_SIZES = ['1-5', '6-15', '16-50', '51+'] as const
type TeamSize = (typeof TEAM_SIZES)[number]

const COMM_STYLES = ['formal', 'friendly', 'brief'] as const
type CommStyle = (typeof COMM_STYLES)[number]

const RESPONSE_TIMES = ['immediate', 'hour', 'day', 'async'] as const
type ResponseTime = (typeof RESPONSE_TIMES)[number]

type TeamMember = {
  name: string
  role: string
  email: string
  channel: string
}

type ToolEntry = {
  key: string
  note: string
}

type FileMeta = {
  name: string
  size: number
  type: string
}

type Body = {
  // Step 1
  companyName: string
  industry: Industry
  teamSize: TeamSize
  locations: number
  description: string
  // Step 2
  teamMembers: TeamMember[]
  primaryContact: string
  // Step 3
  tools: ToolEntry[]
  otherTool: string
  // Step 4
  topTasks: string[]
  timeConsumingTasks: string
  approvalRequired: string
  // Step 5
  communicationStyle: CommStyle
  responseTime: ResponseTime
  workStart: string
  workEnd: string
  timezone: string
  notes: string
  // Step 6
  files: FileMeta[]
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isString)
}

function isTeamMember(v: unknown): v is TeamMember {
  if (!v || typeof v !== 'object') return false
  const m = v as Record<string, unknown>
  return (
    isString(m.name) && isString(m.role) && isString(m.email) && isString(m.channel)
  )
}

function isToolEntry(v: unknown): v is ToolEntry {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return isString(t.key) && isString(t.note)
}

function isFileMeta(v: unknown): v is FileMeta {
  if (!v || typeof v !== 'object') return false
  const f = v as Record<string, unknown>
  return isString(f.name) && typeof f.size === 'number' && isString(f.type)
}

function isValidBody(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  if (!isString(o.companyName) || o.companyName.trim().length === 0) return false
  if (!isString(o.industry) || !(INDUSTRIES as readonly string[]).includes(o.industry))
    return false
  if (!isString(o.teamSize) || !(TEAM_SIZES as readonly string[]).includes(o.teamSize))
    return false
  if (typeof o.locations !== 'number' || o.locations < 0 || !Number.isFinite(o.locations))
    return false
  if (!isString(o.description) || o.description.trim().length < 10) return false
  if (!Array.isArray(o.teamMembers) || !o.teamMembers.every(isTeamMember)) return false
  if ((o.teamMembers as TeamMember[]).length === 0) return false
  if (!isString(o.primaryContact) || o.primaryContact.trim().length === 0) return false
  if (!Array.isArray(o.tools) || !o.tools.every(isToolEntry)) return false
  if (!isString(o.otherTool)) return false
  if (!isStringArray(o.topTasks)) return false
  if (!isString(o.timeConsumingTasks)) return false
  if (!isString(o.approvalRequired)) return false
  if (!isString(o.communicationStyle) || !(COMM_STYLES as readonly string[]).includes(o.communicationStyle))
    return false
  if (!isString(o.responseTime) || !(RESPONSE_TIMES as readonly string[]).includes(o.responseTime))
    return false
  if (!isString(o.workStart) || !isString(o.workEnd) || !isString(o.timezone)) return false
  if (!isString(o.notes)) return false
  if (!Array.isArray(o.files) || !o.files.every(isFileMeta)) return false
  return true
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid fields. Please complete all required steps before submitting.',
      },
      { status: 400 },
    )
  }

  const submission = {
    receivedAt: new Date().toISOString(),
    company: {
      name: body.companyName.trim(),
      industry: body.industry,
      teamSize: body.teamSize,
      locations: body.locations,
      description: body.description.trim(),
    },
    team: {
      members: body.teamMembers.map((m) => ({
        name: m.name.trim(),
        role: m.role.trim(),
        email: m.email.trim(),
        channel: m.channel.trim(),
      })),
      primaryContact: body.primaryContact.trim(),
    },
    tools: {
      selected: body.tools
        .filter((t) => t.key.trim().length > 0)
        .map((t) => ({ key: t.key, note: t.note.trim() })),
      other: body.otherTool.trim(),
    },
    workflows: {
      topTasks: body.topTasks.map((t) => t.trim()).filter((t) => t.length > 0),
      timeConsumingTasks: body.timeConsumingTasks.trim(),
      approvalRequired: body.approvalRequired.trim(),
    },
    preferences: {
      communicationStyle: body.communicationStyle,
      responseTime: body.responseTime,
      workingHours: {
        start: body.workStart,
        end: body.workEnd,
        timezone: body.timezone,
      },
      notes: body.notes.trim(),
    },
    files: {
      // v1 limitation: file uploads capture metadata only. Actual upload handling
      // requires storage (S3/R2) to be wired before files are persisted. For now
      // we record the names so the team can ask the client to forward attachments
      // by email until storage lands.
      note: 'metadata only — no binary persisted; storage backend not yet configured',
      list: body.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    },
  }

  // v1: log only. When SMTP/Resend/etc. is wired, send to doyle.dettro@emergenext.com here.
  console.log('[onboard] new submission', JSON.stringify(submission))

  return NextResponse.json({ ok: true, company: submission.company.name })
}
