/**
 * Markdown template generator + parser for the freeform survey.
 *
 * Template is a plain .md file the client downloads, fills out in their editor
 * of choice, and uploads back. The format is permissive: we look for `## N. Title`
 * section headings and `### Question` sub-headings, and gather everything
 * underneath each sub-heading as the answer (until the next heading).
 *
 * v2 format adds a YAML front-matter block and an "instructions for AI agents"
 * header so external AI agents can fill the file out without other context. The
 * parser is intentionally lenient and handles both v1 and v2 files without any
 * version sniffing — YAML lines and `#`-prefixed comment lines don't collide
 * with `##` / `###` headings.
 */

import { SURVEY_SECTIONS, type SurveyAnswers, answerKey, totalQuestions } from './survey'

const PLACEHOLDER_LINE =
  "_Your answer here. Delete this line and write whatever you'd like — paragraphs are welcome._"

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^_Your answer here\. Delete this line and write whatever you'd like — paragraphs are welcome\._$/,
  /^_Your answer here\.\s*$/i,
]

// Critical questions: a dismissive answer here ("N/A") is suspicious enough to
// flag. Used by reviewMarkdownImport. Everything else is fine to skip.
const CRITICAL_QUESTION_KEYS: ReadonlySet<string> = new Set([
  'company.overview',
  'company.primaryContact',
  'priorities.firstWin',
])

const DISMISSIVE_ANSWER_PATTERN =
  /^(n\/a|na|not applicable|unknown|none|no|nope|skip|tbd|todo|\?)\.?$/i

function buildV2Header(opts: { companyHint?: string; sessionId?: string }): string {
  const companyHint = opts.companyHint ?? ''
  const sessionId = opts.sessionId ?? ''
  return `---
# Firmcraft Onboarding Survey
# Format: firmcraft-survey-v2
#
# INSTRUCTIONS FOR AI AGENTS:
# 1. Each ## heading is a survey section. Do NOT rename or reorder them.
# 2. Each ### heading is a question. Write your answer below it.
# 3. Delete the placeholder text (_Your answer here..._) and replace with the answer.
# 4. HTML comments (<!-- -->) contain guidance. Read them for context, leave them in place.
# 5. Answers can be any length — paragraphs, bullet lists, whatever fits.
# 6. If you don't have information for a question, write "Not applicable" or "Unknown"
#    rather than leaving it blank.
# 7. The section intros (in <!-- --> after each ## heading) explain what the section covers.
#    Use them to understand the context of each question.
#
# CONTEXT:
# This survey helps Firmcraft build an AI agent environment customized to a company's
# needs. The more specific and detailed the answers, the better the resulting setup.
# Think of each answer as briefing a senior engineer who will configure the system.

format_version: "2.0"
survey_type: "marketing"
company_hint: ${JSON.stringify(companyHint)}
session_id: ${JSON.stringify(sessionId)}
---

# Firmcraft onboarding survey

Thanks for filling this out. Take as long as you need. There are no character
limits, no required fields, and you can rewrite anything. The more candid the
better.

When you're done, head back to https://firmcraft.ai/get-started and drop this
file in the upload area.
`
}

export type BuildTemplateOptions = {
  companyHint?: string
  sessionId?: string
}

/**
 * Build the markdown template. If `existingAnswers` is provided, render each
 * answer inline beneath its question instead of the blank placeholder line —
 * this enables the export → AI edit → reimport round-trip.
 */
export function buildMarkdownTemplate(
  existingAnswers?: SurveyAnswers,
  options: BuildTemplateOptions = {},
): string {
  const parts: string[] = [buildV2Header(options)]
  for (const section of SURVEY_SECTIONS) {
    parts.push(`\n## ${section.number}. ${section.title}\n`)
    parts.push(`<!-- ${section.intro} -->\n`)
    for (const q of section.questions) {
      parts.push(`\n### ${q.prompt}\n`)
      if (q.guidance) {
        parts.push(`<!-- ${q.guidance} -->\n`)
      }
      const existing = existingAnswers?.[answerKey(section.id, q.id)]?.trim()
      if (existing) {
        parts.push(`\n${existing}\n`)
      } else {
        parts.push(`\n${PLACEHOLDER_LINE}\n`)
      }
    }
  }
  parts.push('\n---\n\nThanks. — The Firmcraft team\n')
  return parts.join('')
}

function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim()
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse a markdown file produced from `buildMarkdownTemplate` (with light
 * client edits). Returns the answers keyed by `${sectionId}.${questionId}`.
 *
 * Lenient: missing headings yield empty strings, extra headings are ignored,
 * YAML front matter is skipped naturally (its lines don't start with `##`).
 */
export function parseMarkdownAnswers(markdown: string): SurveyAnswers {
  const answers: SurveyAnswers = {}
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      answers[answerKey(section.id, q.id)] = ''
    }
  }

  type SurveyQuestionRef = {
    sectionId: string
    questionId: string
  }

  // Strip the leading YAML front matter block, if any (`---\n...\n---`).
  const body = stripFrontMatter(markdown)
  const lines = body.split(/\r?\n/)
  let currentSection: typeof SURVEY_SECTIONS[number] | null = null
  let currentQuestion: SurveyQuestionRef | null = null
  let buffer: string[] = []

  function flush() {
    if (currentQuestion) {
      const raw = buffer.join('\n')
      const cleaned = stripComments(raw)
      const filtered = cleaned
        .split(/\r?\n/)
        .filter((l) => {
          const t = l.trim()
          return !PLACEHOLDER_PATTERNS.some((p) => p.test(t))
        })
        .join('\n')
        .trim()
      const key = answerKey(currentQuestion.sectionId, currentQuestion.questionId)
      answers[key] = filtered
    }
    buffer = []
  }

  function findSection(heading: string) {
    const norm = normalize(heading)
    return SURVEY_SECTIONS.find((s) => {
      const candidates = [
        normalize(`${s.number}. ${s.title}`),
        normalize(s.title),
        normalize(`${s.number} ${s.title}`),
      ]
      return candidates.some((c) => norm === c || norm.startsWith(c) || c.startsWith(norm))
    })
  }

  function findQuestion(section: typeof SURVEY_SECTIONS[number], heading: string) {
    const norm = normalize(heading)
    return section.questions.find((q) => {
      const promptNorm = normalize(q.prompt)
      return norm === promptNorm || norm.startsWith(promptNorm.slice(0, 30))
    })
  }

  for (const rawLine of lines) {
    const line = rawLine
    const h2 = /^##\s+(.+?)\s*$/.exec(line)
    const h3 = /^###\s+(.+?)\s*$/.exec(line)
    if (h2 && !line.startsWith('###')) {
      flush()
      currentQuestion = null
      const matched = findSection(h2[1])
      currentSection = matched ?? null
      continue
    }
    if (h3) {
      flush()
      if (currentSection) {
        const q = findQuestion(currentSection, h3[1])
        currentQuestion = q
          ? { sectionId: currentSection.id, questionId: q.id }
          : null
      } else {
        currentQuestion = null
      }
      continue
    }
    // `---` on its own line acts as a soft boundary — used for the footer
    // separator in the template, but also a natural break in user edits.
    if (/^---+\s*$/.test(line)) {
      flush()
      currentQuestion = null
      continue
    }
    if (currentQuestion) {
      buffer.push(line)
    }
  }
  flush()

  return answers
}

function stripFrontMatter(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  let i = 0
  // Allow a leading BOM or blank lines before front matter.
  while (i < lines.length && lines[i].trim() === '') i++
  if (lines[i]?.trim() !== '---') return markdown
  const start = i
  i++
  while (i < lines.length && lines[i].trim() !== '---') i++
  if (i >= lines.length) return markdown // no closing fence — leave as-is
  // Drop start..i inclusive.
  return lines.slice(0, start).concat(lines.slice(i + 1)).join('\n')
}

export function answersFilename(companyHint?: string): string {
  const base = (companyHint || 'firmcraft-onboarding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'firmcraft-onboarding'
  return `${base}.md`
}

// ---------------------------------------------------------------------------
// AI-reviewed import
// ---------------------------------------------------------------------------

export type ImportIssueLevel = 'error' | 'warning' | 'info'

export type ImportIssue = {
  level: ImportIssueLevel
  message: string
  questionKey?: string
}

export type ImportChangeKind = 'added' | 'modified' | 'removed'

export type ImportChange = {
  questionKey: string
  kind: ImportChangeKind
  before: string
  after: string
}

export type ImportReview = {
  answers: SurveyAnswers
  stats: {
    totalQuestions: number
    answeredQuestions: number
    emptyQuestions: number
    changedQuestions: number
  }
  issues: ImportIssue[]
  changes: ImportChange[] | null
}

/**
 * Run the deterministic parser and produce a review summary: stats, validation
 * issues, and (if existing answers are provided) a per-question diff. Callers
 * present this to the user as a confirmation step before committing the import.
 *
 * Async by design — leaves room for a future AI pass (fuzzy heading repair,
 * answer-quality checks) without changing the call sites.
 */
export async function reviewMarkdownImport(
  markdown: string,
  existingAnswers?: SurveyAnswers,
): Promise<ImportReview> {
  const parsed = parseMarkdownAnswers(markdown)

  const issues: ImportIssue[] = []
  let answeredQuestions = 0
  let emptyQuestions = 0

  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      const key = answerKey(section.id, q.id)
      const value = (parsed[key] || '').trim()
      if (value) {
        answeredQuestions++
        if (CRITICAL_QUESTION_KEYS.has(key) && DISMISSIVE_ANSWER_PATTERN.test(value)) {
          issues.push({
            level: 'warning',
            message: `"${q.prompt}" — a dismissive answer ("${value}") on a critical question.`,
            questionKey: key,
          })
        }
      } else {
        emptyQuestions++
        issues.push({
          level: 'info',
          message: `"${q.prompt}" was not answered.`,
          questionKey: key,
        })
      }
    }
  }

  let changes: ImportChange[] | null = null
  let changedQuestions = 0
  if (existingAnswers) {
    changes = []
    for (const section of SURVEY_SECTIONS) {
      for (const q of section.questions) {
        const key = answerKey(section.id, q.id)
        const before = (existingAnswers[key] || '').trim()
        const after = (parsed[key] || '').trim()
        if (before === after) continue
        changedQuestions++
        let kind: ImportChangeKind = 'modified'
        if (!before && after) kind = 'added'
        else if (before && !after) kind = 'removed'
        changes.push({ questionKey: key, kind, before, after })
      }
    }
  }

  return {
    answers: parsed,
    stats: {
      totalQuestions: totalQuestions(),
      answeredQuestions,
      emptyQuestions,
      changedQuestions,
    },
    issues,
    changes,
  }
}
