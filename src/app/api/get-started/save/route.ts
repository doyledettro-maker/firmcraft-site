import { NextResponse } from 'next/server'
import {
  fetchToken,
  saveCompanyAnswer,
  saveIndividualAnswer,
  validateScopedQuestion,
} from '@/lib/survey-tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  token: string
  respondentEmail: string
  scope: 'company' | 'individual'
  sectionId: string
  questionId: string
  answer: string
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  return (
    typeof o.token === 'string' &&
    typeof o.respondentEmail === 'string' &&
    (o.scope === 'company' || o.scope === 'individual') &&
    typeof o.sectionId === 'string' &&
    typeof o.questionId === 'string' &&
    typeof o.answer === 'string'
  )
}

/**
 * POST /api/get-started/save
 * Body: { token, respondentEmail, scope, sectionId, questionId, answer }
 *
 * Persists a single answer. Used by the conversational form to save each
 * response as the respondent advances.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (!isValid(body)) {
    return NextResponse.json({ error: 'Malformed save payload.' }, { status: 400 })
  }
  if (!validateScopedQuestion(body.sectionId, body.questionId, body.scope)) {
    return NextResponse.json(
      { error: `Unknown question ${body.sectionId}.${body.questionId} for scope ${body.scope}.` },
      { status: 400 },
    )
  }

  try {
    const status = await fetchToken(body.token)
    if (!status.ok) {
      return NextResponse.json({ error: `Invitation ${status.reason}.` }, { status: 404 })
    }

    if (body.scope === 'company') {
      await saveCompanyAnswer({
        token: status.token.token,
        sectionId: body.sectionId,
        questionId: body.questionId,
        answer: body.answer,
        updatedByEmail: body.respondentEmail,
      })
    } else {
      await saveIndividualAnswer({
        token: status.token.token,
        respondentEmail: body.respondentEmail,
        sectionId: body.sectionId,
        questionId: body.questionId,
        answer: body.answer,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[save] error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
