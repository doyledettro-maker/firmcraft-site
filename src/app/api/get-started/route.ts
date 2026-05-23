import { NextResponse } from 'next/server'
import {
  fetchToken,
  fetchAllRespondents,
  fetchCompanyAnswersWithMeta,
  markRespondentSubmitted,
  saveCompanyAnswer,
  saveIndividualAnswer,
} from '@/lib/survey-tokens'
import { SURVEY_SECTIONS, answerKey } from '@/lib/survey'
import { sendSubmissionEmail } from '@/lib/notify-submission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  token: string
  respondentEmail: string
  /** Final snapshot of all answers from the client, used to flush any pending edits. */
  answers: Record<string, string>
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  if (typeof o.token !== 'string') return false
  if (typeof o.respondentEmail !== 'string') return false
  if (!o.answers || typeof o.answers !== 'object') return false
  for (const v of Object.values(o.answers as Record<string, unknown>)) {
    if (typeof v !== 'string') return false
  }
  return true
}

/**
 * POST /api/get-started
 *
 * Finalize this respondent's submission:
 *   1. Flush the latest snapshot of answers (in case the user edited on the
 *      review screen without triggering per-question saves).
 *   2. Mark the respondent as submitted.
 *   3. Email Doyle a digest of company-wide answers + every respondent's
 *      individual answers.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (!isValid(body)) {
    return NextResponse.json({ error: 'Malformed submit payload.' }, { status: 400 })
  }

  const status = await fetchToken(body.token)
  if (!status.ok) {
    return NextResponse.json({ error: `Invitation ${status.reason}.` }, { status: 404 })
  }
  const token = status.token.token

  // Flush every answer that came back in the final snapshot. Cheaper than a
  // diff and guarantees the email reflects exactly what the user saw.
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      const value = body.answers[answerKey(section.id, q.id)]
      if (typeof value !== 'string') continue
      if (section.scope === 'company') {
        await saveCompanyAnswer({
          token,
          sectionId: section.id,
          questionId: q.id,
          answer: value,
          updatedByEmail: body.respondentEmail,
        })
      } else {
        await saveIndividualAnswer({
          token,
          respondentEmail: body.respondentEmail,
          sectionId: section.id,
          questionId: q.id,
          answer: value,
        })
      }
    }
  }

  await markRespondentSubmitted({ token, respondentEmail: body.respondentEmail })

  const [companyAnswers, respondents] = await Promise.all([
    fetchCompanyAnswersWithMeta(token),
    fetchAllRespondents(token),
  ])

  const emailResult = await sendSubmissionEmail({
    receivedAt: new Date().toISOString(),
    token,
    companyName: status.token.company_name,
    submittingRespondentEmail: body.respondentEmail,
    companyAnswers,
    respondents: respondents.map((r) => ({
      email: r.respondent.email,
      name: r.respondent.name,
      role: r.respondent.role,
      submittedAt: r.respondent.submitted_at,
      answers: r.individualAnswers,
    })),
  })

  if (!emailResult.ok) {
    console.error('[get-started] email send failed:', emailResult.error)
  }

  return NextResponse.json({ ok: true })
}
