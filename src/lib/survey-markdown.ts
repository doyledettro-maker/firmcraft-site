/**
 * Markdown template generator + parser for the freeform survey.
 *
 * Template is a plain .md file the client downloads, fills out in their editor
 * of choice, and uploads back. The format is permissive: we look for `## N. Title`
 * section headings and `### Question` sub-headings, and gather everything
 * underneath each sub-heading as the answer (until the next heading).
 *
 * v3 splits templates by scope: one file for company-wide sections (shared
 * across everyone from a company) and one for individual sections (filled out
 * per respondent). The YAML front-matter carries `scope: company|individual`
 * so an uploaded file is unambiguous; if missing, we infer from which sections
 * the file actually contains answers for.
 */

import {
  SURVEY_SECTIONS,
  answerKey,
  type SurveyAnswers,
  type SurveyScope,
  type SurveySection,
} from './survey'

const PLACEHOLDER_LINE =
  "_Your answer here. Delete this line and write whatever you'd like — paragraphs are welcome._"

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^_Your answer here\. Delete this line and write whatever you'd like — paragraphs are welcome\._$/,
  /^_Your answer here\.\s*$/i,
]

const CRITICAL_QUESTION_KEYS: ReadonlySet<string> = new Set([
  'company.overview',
  'company.primaryContact',
  'priorities.firstWin',
])

const DISMISSIVE_ANSWER_PATTERN =
  /^(n\/a|na|not applicable|unknown|none|no|nope|skip|tbd|todo|\?)\.?$/i

function scopeLabel(scope: SurveyScope): string {
  return scope === 'company' ? 'company-wide' : 'individual'
}

function buildHeader(opts: {
  scope: SurveyScope
  companyName?: string
  token?: string
  respondentEmail?: string
}): string {
  const sharedLine =
    opts.scope === 'company'
      ? 'These answers are SHARED across everyone from this company. Anyone with the same'
      : "These answers are TIED to one respondent's email address. Other people from the same"
  const sharedLine2 =
    opts.scope === 'company'
      ? 'invitation link will see them and can edit them.'
      : 'company answer their own individual sections separately.'

  return `---
# Firmcraft Onboarding Survey — ${scopeLabel(opts.scope).toUpperCase()} sections
# Format: firmcraft-survey-v3
#
# INSTRUCTIONS FOR AI AGENTS:
# 1. Each ## heading is a survey section. Do NOT rename or reorder them.
# 2. Each ### heading is a question. Write your answer below it.
# 3. Delete the placeholder text (_Your answer here..._) and replace with the answer.
# 4. HTML comments (<!-- -->) contain guidance. Read them for context, leave them in place.
# 5. Answers can be any length — paragraphs, bullet lists, whatever fits.
# 6. If you don't have information for a question, write "Not applicable" or "Unknown"
#    rather than leaving it blank.
# 7. ${sharedLine}
#    ${sharedLine2}
#
# CONTEXT:
# This survey helps Firmcraft build an AI agent environment customized to a company's
# needs. The more specific and detailed the answers, the better the resulting setup.

format_version: "3.0"
scope: ${opts.scope}
company_name: ${JSON.stringify(opts.companyName ?? '')}
token: ${JSON.stringify(opts.token ?? '')}
respondent_email: ${JSON.stringify(opts.respondentEmail ?? '')}
---

# Firmcraft onboarding — ${scopeLabel(opts.scope)} sections

${
  opts.scope === 'company'
    ? `These are the sections shared across everyone from ${opts.companyName || 'your company'}. Whoever fills these in first writes the canonical answer; teammates can edit them later.`
    : `These are the sections specific to you${opts.respondentEmail ? ` (${opts.respondentEmail})` : ''}. Other people from ${opts.companyName || 'your company'} will fill these out for themselves.`
}

When you're done, head back to the survey link and drop this file in the upload
area, or email it back to Firmcraft.
`
}

export type BuildTemplateOptions = {
  scope: SurveyScope
  companyName?: string
  token?: string
  respondentEmail?: string
  existingAnswers?: SurveyAnswers
}

/**
 * Build a scope-specific markdown template. Only sections matching `scope` are
 * included. If `existingAnswers` is provided, current answers are rendered
 * inline so the file becomes a round-trippable working document.
 */
export function buildMarkdownTemplate(options: BuildTemplateOptions): string {
  const parts: string[] = [
    buildHeader({
      scope: options.scope,
      companyName: options.companyName,
      token: options.token,
      respondentEmail: options.respondentEmail,
    }),
  ]
  for (const section of SURVEY_SECTIONS) {
    if (section.scope !== options.scope) continue
    parts.push(`\n## ${section.number}. ${section.title}\n`)
    parts.push(`<!-- ${section.intro} -->\n`)
    for (const q of section.questions) {
      parts.push(`\n### ${q.prompt}\n`)
      if (q.guidance) {
        parts.push(`<!-- ${q.guidance} -->\n`)
      }
      const existing = options.existingAnswers?.[answerKey(section.id, q.id)]?.trim()
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

export type FrontMatter = {
  scope?: SurveyScope
  companyName?: string
  token?: string
  respondentEmail?: string
  formatVersion?: string
}

/**
 * Extract the YAML front matter block, if any. Returns the body without the
 * fence and a loosely-typed metadata object. Format is intentionally lenient:
 * we tolerate v2 files with no `scope:` key (will be inferred later).
 */
function readFrontMatter(markdown: string): { body: string; meta: FrontMatter } {
  const lines = markdown.split(/\r?\n/)
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  if (lines[i]?.trim() !== '---') return { body: markdown, meta: {} }
  const start = i
  i++
  const yamlLines: string[] = []
  while (i < lines.length && lines[i].trim() !== '---') {
    yamlLines.push(lines[i])
    i++
  }
  if (i >= lines.length) return { body: markdown, meta: {} }
  const body = lines.slice(0, start).concat(lines.slice(i + 1)).join('\n')

  const meta: FrontMatter = {}
  for (const line of yamlLines) {
    const stripped = line.replace(/^\s*#.*/, '').trim()
    if (!stripped) continue
    const m = /^([a-zA-Z_]+)\s*:\s*(.*)$/.exec(stripped)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    // Strip surrounding quotes (JSON.stringify uses double quotes; tolerate single too).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    switch (key) {
      case 'scope':
        if (value === 'company' || value === 'individual') meta.scope = value
        break
      case 'company_name':
        meta.companyName = value
        break
      case 'token':
        meta.token = value
        break
      case 'respondent_email':
        meta.respondentEmail = value
        break
      case 'format_version':
        meta.formatVersion = value
        break
    }
  }

  return { body, meta }
}

/**
 * Parse a filled-out markdown file into an answers map. Only questions whose
 * section matches `scopeFilter` are populated (others are left empty); if
 * `scopeFilter` is undefined, every section is considered.
 *
 * Always returns a fully-keyed answers object (every question in the full
 * survey has a key, blank if not in the file or out of scope).
 */
export function parseMarkdownAnswers(
  markdown: string,
  scopeFilter?: SurveyScope,
): SurveyAnswers {
  const answers: SurveyAnswers = {}
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      answers[answerKey(section.id, q.id)] = ''
    }
  }

  type SurveyQuestionRef = {
    sectionId: string
    questionId: string
    scope: SurveyScope
  }

  const { body } = readFrontMatter(markdown)
  const lines = body.split(/\r?\n/)
  let currentSection: SurveySection | null = null
  let currentQuestion: SurveyQuestionRef | null = null
  let buffer: string[] = []

  function flush() {
    if (currentQuestion) {
      if (!scopeFilter || currentQuestion.scope === scopeFilter) {
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

  function findQuestion(section: SurveySection, heading: string) {
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
          ? { sectionId: currentSection.id, questionId: q.id, scope: currentSection.scope }
          : null
      } else {
        currentQuestion = null
      }
      continue
    }
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

/**
 * Detect which scope a file appears to target. Front matter wins; otherwise
 * inferred by counting non-empty answers per scope from a permissive parse.
 */
export function detectScope(markdown: string): SurveyScope | null {
  const { meta } = readFrontMatter(markdown)
  if (meta.scope) return meta.scope
  const allParsed = parseMarkdownAnswers(markdown)
  let company = 0
  let individual = 0
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      const value = allParsed[answerKey(section.id, q.id)]
      if (!value || !value.trim()) continue
      if (section.scope === 'company') company++
      else individual++
    }
  }
  if (company === 0 && individual === 0) return null
  return company >= individual ? 'company' : 'individual'
}

export function answersFilenameForScope(
  scope: SurveyScope,
  companyName?: string,
  respondentEmail?: string,
): string {
  const slug = (companyName || 'firmcraft-onboarding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'firmcraft-onboarding'
  if (scope === 'company') return `${slug}-company.md`
  const emailSlug = (respondentEmail ?? '')
    .toLowerCase()
    .split('@')[0]
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
  return emailSlug ? `${slug}-${emailSlug}.md` : `${slug}-individual.md`
}

// ---------------------------------------------------------------------------
// Import review
// ---------------------------------------------------------------------------

export type ImportIssueLevel = 'error' | 'warning' | 'info'

export type ImportIssue = {
  level: ImportIssueLevel
  message: string
  questionKey?: string
}

export type ImportReview = {
  scope: SurveyScope
  detectedFromFrontMatter: boolean
  answers: SurveyAnswers
  stats: {
    totalQuestions: number
    answeredQuestions: number
    emptyQuestions: number
  }
  issues: ImportIssue[]
  frontMatter: FrontMatter
}

/**
 * Parse a markdown file scoped to a single survey scope. Returns counts and
 * any quality issues (dismissive answers on critical questions, etc.) so the
 * client can show a confirmation step before persisting.
 *
 * If `forceScope` is provided, that scope is used regardless of what the file
 * declares. Otherwise we read the front matter, falling back to inference.
 */
export async function reviewMarkdownImport(
  markdown: string,
  forceScope?: SurveyScope,
): Promise<ImportReview> {
  const { meta } = readFrontMatter(markdown)
  const detected = forceScope ?? meta.scope ?? detectScope(markdown)
  if (!detected) {
    throw new Error(
      "Couldn't tell whether this is a company-wide or individual file — and we didn't find any answers. Re-download a template and try again.",
    )
  }
  const detectedFromFrontMatter = !forceScope && !!meta.scope

  const parsed = parseMarkdownAnswers(markdown, detected)

  const issues: ImportIssue[] = []
  let answeredQuestions = 0
  let emptyQuestions = 0
  let scopeTotal = 0

  for (const section of SURVEY_SECTIONS) {
    if (section.scope !== detected) continue
    for (const q of section.questions) {
      scopeTotal++
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

  return {
    scope: detected,
    detectedFromFrontMatter,
    answers: parsed,
    stats: {
      totalQuestions: scopeTotal,
      answeredQuestions,
      emptyQuestions,
    },
    issues,
    frontMatter: meta,
  }
}
