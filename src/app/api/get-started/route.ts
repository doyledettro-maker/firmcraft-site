import { NextResponse } from 'next/server'
import { SURVEY_SECTIONS } from '@/lib/survey'

export const runtime = 'nodejs'

type Body = {
  method: 'conversational' | 'markdown'
  answers: Record<string, string>
  companyHint?: string
}

function isValidBody(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  if (o.method !== 'conversational' && o.method !== 'markdown') return false
  if (!o.answers || typeof o.answers !== 'object') return false
  for (const v of Object.values(o.answers as Record<string, unknown>)) {
    if (typeof v !== 'string') return false
  }
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
      { error: 'Missing method or answers.' },
      { status: 400 },
    )
  }

  const sections = SURVEY_SECTIONS.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
    questions: s.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      answer: (body.answers[`${s.id}.${q.id}`] || '').trim(),
    })),
  }))

  const submission = {
    receivedAt: new Date().toISOString(),
    method: body.method,
    companyHint: typeof body.companyHint === 'string' ? body.companyHint.trim() : '',
    sections,
  }

  // v1: log only. The admin dashboard will read these once the storage backend
  // is wired (Resend → email + Postgres or D1 for the queue).
  console.log('[get-started] new survey submission', JSON.stringify(submission))

  return NextResponse.json({ ok: true })
}
