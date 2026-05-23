import { NextResponse } from 'next/server'
import {
  fetchToken,
  upsertRespondent,
  fetchCompanyAnswers,
  fetchIndividualAnswers,
} from '@/lib/survey-tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = { token: string; email: string; name: string; role: string }

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  return (
    typeof o.token === 'string' &&
    typeof o.email === 'string' &&
    typeof o.name === 'string' &&
    typeof o.role === 'string'
  )
}

/**
 * POST /api/get-started/respondent
 * Body: { token, email, name, role }
 *
 * Creates (or refreshes) a respondent record for this token+email combo.
 * Returns the company answers and this respondent's individual answers.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (!isValid(body)) {
    return NextResponse.json(
      { error: 'token, email, name, and role are required.' },
      { status: 400 },
    )
  }
  if (!body.name.trim() || !body.role.trim()) {
    return NextResponse.json(
      { error: 'Name and role are required.' },
      { status: 400 },
    )
  }
  if (!isEmail(body.email.trim())) {
    return NextResponse.json(
      { error: 'A valid email is required.' },
      { status: 400 },
    )
  }

  try {
    const status = await fetchToken(body.token)
    if (!status.ok) {
      return NextResponse.json({ error: `Invitation ${status.reason}.` }, { status: 404 })
    }

    const respondent = await upsertRespondent({
      token: status.token.token,
      email: body.email,
      name: body.name,
      role: body.role,
    })

    const companyAnswers = await fetchCompanyAnswers(status.token.token)
    const individualAnswers = await fetchIndividualAnswers(status.token.token, respondent.email)

    return NextResponse.json({
      ok: true,
      respondent,
      companyName: status.token.company_name,
      companyAnswers,
      individualAnswers,
    })
  } catch (err) {
    console.error('[respondent] error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
