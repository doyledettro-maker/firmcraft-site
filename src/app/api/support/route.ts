import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const URGENCY_VALUES = ['general', 'not_working', 'urgent'] as const
type Urgency = (typeof URGENCY_VALUES)[number]

const URGENCY_TIMEFRAME: Record<Urgency, string> = {
  general: '24 hours',
  not_working: '4 hours',
  urgent: '1 hour',
}

type Body = {
  name: string
  company: string
  description: string
  urgency: Urgency
}

function isValidBody(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  return (
    typeof o.name === 'string' &&
    o.name.trim().length > 0 &&
    typeof o.company === 'string' &&
    o.company.trim().length > 0 &&
    typeof o.description === 'string' &&
    o.description.trim().length >= 10 &&
    typeof o.urgency === 'string' &&
    (URGENCY_VALUES as readonly string[]).includes(o.urgency)
  )
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
      { error: 'Missing or invalid fields. Name, company, description (10+ chars), and urgency are required.' },
      { status: 400 },
    )
  }

  const submission = {
    receivedAt: new Date().toISOString(),
    name: body.name.trim(),
    company: body.company.trim(),
    description: body.description.trim(),
    urgency: body.urgency,
    timeframe: URGENCY_TIMEFRAME[body.urgency],
  }

  // v1: log only. When SMTP/Resend/etc. is wired, send to doyle.dettro@emergenext.com here.
  console.log('[support] new submission', JSON.stringify(submission))

  return NextResponse.json({ ok: true, timeframe: submission.timeframe })
}
