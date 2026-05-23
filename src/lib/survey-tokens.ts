/**
 * Server-side library for the token-gated onboarding survey.
 *
 * Talks to Supabase. Used by the /api/get-started/* routes and the
 * submission email builder.
 */

import { getSupabaseAdmin } from './supabase'
import {
  SURVEY_SECTIONS,
  answerKey,
  getSection,
  type SurveyAnswers,
  type SurveySection,
} from './survey'

export type SurveyTokenRow = {
  token: string
  company_name: string
  notes: string | null
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

export type SurveyRespondentRow = {
  token: string
  email: string
  name: string
  role: string
  started_at: string
  submitted_at: string | null
}

export type CompanyAnswerRow = {
  token: string
  section_id: string
  question_id: string
  answer: string
  updated_by_email: string | null
  updated_at: string
}

export type IndividualAnswerRow = {
  token: string
  respondent_email: string
  section_id: string
  question_id: string
  answer: string
  updated_at: string
}

export type TokenStatus =
  | { ok: true; token: SurveyTokenRow }
  | { ok: false; reason: 'missing' | 'unknown' | 'expired' | 'revoked' }

export async function fetchToken(rawToken: string | null | undefined): Promise<TokenStatus> {
  const token = typeof rawToken === 'string' ? rawToken.trim() : ''
  if (!token) return { ok: false, reason: 'missing' }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('survey_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  if (error) throw new Error(`fetchToken failed: ${error.message}`)
  if (!data) return { ok: false, reason: 'unknown' }
  const row = data as SurveyTokenRow
  if (row.revoked_at) return { ok: false, reason: 'revoked' }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true, token: row }
}

export async function fetchCompanyAnswers(token: string): Promise<SurveyAnswers> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('survey_company_answers')
    .select('*')
    .eq('token', token)
  if (error) throw new Error(`fetchCompanyAnswers failed: ${error.message}`)
  const out: SurveyAnswers = {}
  for (const row of (data ?? []) as CompanyAnswerRow[]) {
    out[answerKey(row.section_id, row.question_id)] = row.answer
  }
  return out
}

export async function fetchIndividualAnswers(
  token: string,
  respondentEmail: string,
): Promise<SurveyAnswers> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('survey_individual_answers')
    .select('*')
    .eq('token', token)
    .eq('respondent_email', respondentEmail.toLowerCase())
  if (error) throw new Error(`fetchIndividualAnswers failed: ${error.message}`)
  const out: SurveyAnswers = {}
  for (const row of (data ?? []) as IndividualAnswerRow[]) {
    out[answerKey(row.section_id, row.question_id)] = row.answer
  }
  return out
}

export async function upsertRespondent(input: {
  token: string
  email: string
  name: string
  role: string
}): Promise<SurveyRespondentRow> {
  const db = getSupabaseAdmin()
  const email = input.email.trim().toLowerCase()
  const { data: existing } = await db
    .from('survey_respondents')
    .select('*')
    .eq('token', input.token)
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    const { data, error } = await db
      .from('survey_respondents')
      .update({ name: input.name.trim(), role: input.role.trim() })
      .eq('token', input.token)
      .eq('email', email)
      .select('*')
      .single()
    if (error) throw new Error(`updateRespondent failed: ${error.message}`)
    return data as SurveyRespondentRow
  }

  const { data, error } = await db
    .from('survey_respondents')
    .insert({
      token: input.token,
      email,
      name: input.name.trim(),
      role: input.role.trim(),
    })
    .select('*')
    .single()
  if (error) throw new Error(`insertRespondent failed: ${error.message}`)
  return data as SurveyRespondentRow
}

export async function saveCompanyAnswer(input: {
  token: string
  sectionId: string
  questionId: string
  answer: string
  updatedByEmail: string
}): Promise<void> {
  const db = getSupabaseAdmin()
  const { error } = await db.from('survey_company_answers').upsert(
    {
      token: input.token,
      section_id: input.sectionId,
      question_id: input.questionId,
      answer: input.answer,
      updated_by_email: input.updatedByEmail.toLowerCase(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token,section_id,question_id' },
  )
  if (error) throw new Error(`saveCompanyAnswer failed: ${error.message}`)
}

export async function saveIndividualAnswer(input: {
  token: string
  respondentEmail: string
  sectionId: string
  questionId: string
  answer: string
}): Promise<void> {
  const db = getSupabaseAdmin()
  const { error } = await db.from('survey_individual_answers').upsert(
    {
      token: input.token,
      respondent_email: input.respondentEmail.toLowerCase(),
      section_id: input.sectionId,
      question_id: input.questionId,
      answer: input.answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token,respondent_email,section_id,question_id' },
  )
  if (error) throw new Error(`saveIndividualAnswer failed: ${error.message}`)
}

export async function markRespondentSubmitted(input: {
  token: string
  respondentEmail: string
}): Promise<void> {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from('survey_respondents')
    .update({ submitted_at: new Date().toISOString() })
    .eq('token', input.token)
    .eq('email', input.respondentEmail.toLowerCase())
  if (error) throw new Error(`markRespondentSubmitted failed: ${error.message}`)
}

export type RespondentBundle = {
  respondent: SurveyRespondentRow
  individualAnswers: SurveyAnswers
}

/**
 * Fetch every respondent for a token along with their individual answers.
 * Used by the submission email so all individual sections are included.
 */
export async function fetchAllRespondents(token: string): Promise<RespondentBundle[]> {
  const db = getSupabaseAdmin()
  const { data: respondents, error: rErr } = await db
    .from('survey_respondents')
    .select('*')
    .eq('token', token)
    .order('started_at', { ascending: true })
  if (rErr) throw new Error(`fetchAllRespondents failed: ${rErr.message}`)

  const { data: answers, error: aErr } = await db
    .from('survey_individual_answers')
    .select('*')
    .eq('token', token)
  if (aErr) throw new Error(`fetchAllRespondents/answers failed: ${aErr.message}`)

  const grouped: Record<string, SurveyAnswers> = {}
  for (const row of (answers ?? []) as IndividualAnswerRow[]) {
    if (!grouped[row.respondent_email]) grouped[row.respondent_email] = {}
    grouped[row.respondent_email][answerKey(row.section_id, row.question_id)] = row.answer
  }

  return (respondents ?? []).map((r) => {
    const row = r as SurveyRespondentRow
    return {
      respondent: row,
      individualAnswers: grouped[row.email] ?? {},
    }
  })
}

export type CompanyAnswerWithMeta = {
  section: SurveySection
  question: { id: string; prompt: string }
  answer: string
  updatedByEmail: string | null
  updatedAt: string | null
}

export async function fetchCompanyAnswersWithMeta(
  token: string,
): Promise<CompanyAnswerWithMeta[]> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('survey_company_answers')
    .select('*')
    .eq('token', token)
  if (error) throw new Error(`fetchCompanyAnswersWithMeta failed: ${error.message}`)

  const byKey = new Map<string, CompanyAnswerRow>()
  for (const row of (data ?? []) as CompanyAnswerRow[]) {
    byKey.set(answerKey(row.section_id, row.question_id), row)
  }

  const out: CompanyAnswerWithMeta[] = []
  for (const section of SURVEY_SECTIONS) {
    if (section.scope !== 'company') continue
    for (const q of section.questions) {
      const row = byKey.get(answerKey(section.id, q.id))
      out.push({
        section,
        question: { id: q.id, prompt: q.prompt },
        answer: row?.answer ?? '',
        updatedByEmail: row?.updated_by_email ?? null,
        updatedAt: row?.updated_at ?? null,
      })
    }
  }
  return out
}

/**
 * Validate that a section_id + question_id combo exists in the survey schema
 * and that the section has the expected scope. Prevents writes to bogus keys.
 */
export function validateScopedQuestion(
  sectionId: string,
  questionId: string,
  expectedScope: 'company' | 'individual',
): boolean {
  const section = getSection(sectionId)
  if (!section) return false
  if (section.scope !== expectedScope) return false
  return section.questions.some((q) => q.id === questionId)
}
