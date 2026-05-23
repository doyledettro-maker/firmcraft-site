import { NextResponse } from 'next/server'
import { fetchToken, fetchCompanyAnswers, fetchIndividualAnswers } from '@/lib/survey-tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/get-started/token?t=ust-xxx[&email=jane@acme.com]
 *
 * Validate a survey token. If `email` is provided, also returns that
 * respondent's existing individual answers (so re-opening the link resumes).
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('t')
  const email = url.searchParams.get('email')

  try {
    const status = await fetchToken(token)
    if (!status.ok) {
      return NextResponse.json(
        { ok: false, reason: status.reason },
        { status: status.reason === 'missing' ? 400 : 404 },
      )
    }

    const companyAnswers = await fetchCompanyAnswers(status.token.token)
    let individualAnswers: Record<string, string> = {}
    if (email) {
      individualAnswers = await fetchIndividualAnswers(status.token.token, email)
    }

    return NextResponse.json({
      ok: true,
      token: status.token.token,
      companyName: status.token.company_name,
      companyAnswers,
      individualAnswers,
    })
  } catch (err) {
    console.error('[token] error', err)
    return NextResponse.json(
      { ok: false, reason: 'server', error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
