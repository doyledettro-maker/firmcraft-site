/**
 * Markdown template generator + parser for the partner client-submission
 * survey. Mirrors the marketing `survey-markdown.ts` pattern but with a
 * smaller 4-section schema and partner-specific AI-agent context.
 *
 * Answers are flat string values keyed by `${sectionId}.${questionId}` —
 * separate from the typed `SurveyData` model in `./survey.ts`. Callers map
 * the parsed answers onto the typed draft as needed (e.g. dropdown enums).
 */

export type PartnerSurveyQuestion = {
  id: string
  prompt: string
  guidance?: string
}

export type PartnerSurveySection = {
  id: string
  number: number
  title: string
  intro: string
  questions: PartnerSurveyQuestion[]
}

export type PartnerSurveyAnswers = Record<string, string>

export const PARTNER_SURVEY_SECTIONS: PartnerSurveySection[] = [
  {
    id: 'company',
    number: 1,
    title: 'Company profile',
    intro:
      "Who is the client — the basics. Industry, size, website, anything that paints the picture.",
    questions: [
      {
        id: 'overview',
        prompt: "What's the client called, what do they do, and roughly how big are they?",
        guidance:
          'Name, industry, headcount band (1-10 / 11-50 / 51-200 / 201-500 / 500+), locations — whatever you know.',
      },
      {
        id: 'website',
        prompt: "What's their website?",
        guidance: 'Just a URL is fine.',
      },
    ],
  },
  {
    id: 'contact',
    number: 2,
    title: 'Primary contact',
    intro: "Who should Firmcraft work with day-to-day on this engagement?",
    questions: [
      {
        id: 'name',
        prompt: "Who's the primary contact?",
        guidance: 'Full name.',
      },
      {
        id: 'email',
        prompt: "What's their email?",
        guidance: 'Used for kickoff comms and the welcome thread.',
      },
      {
        id: 'role',
        prompt: "What's their title or role?",
        guidance: 'e.g. Managing Partner, Head of Ops, COO.',
      },
    ],
  },
  {
    id: 'plan',
    number: 3,
    title: 'Plan & timeline',
    intro:
      'What does this client need — recommended plan tier, timeline to go live, and what success looks like.',
    questions: [
      {
        id: 'planTier',
        prompt: 'Which plan tier feels right — Spark ($399/mo), Flow ($799/mo), or Forge ($1,499/mo)?',
        guidance: "It's fine to say 'help us choose' or describe what they want covered.",
      },
      {
        id: 'timeline',
        prompt: 'When do they want to go live?',
        guidance: 'ASAP / within 30 days / 60 days / 90 days / flexible.',
      },
      {
        id: 'successMetrics',
        prompt: 'What does success look like for this client?',
        guidance:
          'Concrete metrics or workflows where possible — hours saved, response time, deals closed, etc.',
      },
    ],
  },
  {
    id: 'notes',
    number: 4,
    title: 'Notes',
    intro:
      'Priority workflows, compliance constraints, and any context Firmcraft should know — relationship, urgency, how you sold it.',
    questions: [
      {
        id: 'priorityFeatures',
        prompt: 'Which workflows or features should Firmcraft prioritize?',
        guidance: 'Top 2-3, in priority order.',
      },
      {
        id: 'complianceNeeds',
        prompt: 'Any compliance or special requirements?',
        guidance:
          'HIPAA, SOC 2, attorney-client privilege, data residency, air-gapped, anything else.',
      },
      {
        id: 'partnerNote',
        prompt: "Anything Firmcraft should know — relationship, urgency, how you sold it?",
        guidance: 'Internal note from you to the Firmcraft team. Not shared with the client.',
      },
    ],
  },
]

export function partnerAnswerKey(sectionId: string, questionId: string): string {
  return `${sectionId}.${questionId}`
}

export function emptyPartnerAnswers(): PartnerSurveyAnswers {
  const out: PartnerSurveyAnswers = {}
  for (const s of PARTNER_SURVEY_SECTIONS) {
    for (const q of s.questions) {
      out[partnerAnswerKey(s.id, q.id)] = ''
    }
  }
  return out
}

export function partnerTotalQuestions(): number {
  return PARTNER_SURVEY_SECTIONS.reduce((n, s) => n + s.questions.length, 0)
}

const PLACEHOLDER_LINE =
  "_Your answer here. Delete this line and write whatever you'd like — paragraphs are welcome._"

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^_Your answer here\. Delete this line and write whatever you'd like — paragraphs are welcome\._$/,
  /^_Your answer here\.\s*$/i,
]

const CRITICAL_QUESTION_KEYS: ReadonlySet<string> = new Set([
  'company.overview',
  'contact.name',
  'contact.email',
])

const DISMISSIVE_ANSWER_PATTERN =
  /^(n\/a|na|not applicable|unknown|none|no|nope|skip|tbd|todo|\?)\.?$/i

function buildV2Header(opts: { companyHint?: string; sessionId?: string }): string {
  const companyHint = opts.companyHint ?? ''
  const sessionId = opts.sessionId ?? ''
  return `---
# Firmcraft Partner Survey
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
# This survey helps a Firmcraft partner define their service offerings, target
# verticals, and technical capabilities. Answers drive the partner portal
# configuration and client matching algorithm.

format_version: "2.0"
survey_type: "partner"
company_hint: ${JSON.stringify(companyHint)}
session_id: ${JSON.stringify(sessionId)}
---

# Firmcraft partner survey

Fill this out for the client you're submitting to Firmcraft. Take as long as
you need — no character limits, no required fields. When you're done, head
back to the partner portal and drop this file in the upload area.
`
}

export type BuildPartnerTemplateOptions = {
  companyHint?: string
  sessionId?: string
}

export function buildPartnerMarkdownTemplate(
  existingAnswers?: PartnerSurveyAnswers,
  options: BuildPartnerTemplateOptions = {},
): string {
  const parts: string[] = [buildV2Header(options)]
  for (const section of PARTNER_SURVEY_SECTIONS) {
    parts.push(`\n## ${section.number}. ${section.title}\n`)
    parts.push(`<!-- ${section.intro} -->\n`)
    for (const q of section.questions) {
      parts.push(`\n### ${q.prompt}\n`)
      if (q.guidance) {
        parts.push(`<!-- ${q.guidance} -->\n`)
      }
      const existing = existingAnswers?.[partnerAnswerKey(section.id, q.id)]?.trim()
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

function stripFrontMatter(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  if (lines[i]?.trim() !== '---') return markdown
  const start = i
  i++
  while (i < lines.length && lines[i].trim() !== '---') i++
  if (i >= lines.length) return markdown
  return lines.slice(0, start).concat(lines.slice(i + 1)).join('\n')
}

export function parsePartnerMarkdownAnswers(markdown: string): PartnerSurveyAnswers {
  const answers: PartnerSurveyAnswers = emptyPartnerAnswers()

  type QuestionRef = { sectionId: string; questionId: string }

  const body = stripFrontMatter(markdown)
  const lines = body.split(/\r?\n/)
  let currentSection: PartnerSurveySection | null = null
  let currentQuestion: QuestionRef | null = null
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
      const key = partnerAnswerKey(currentQuestion.sectionId, currentQuestion.questionId)
      answers[key] = filtered
    }
    buffer = []
  }

  function findSection(heading: string): PartnerSurveySection | undefined {
    const norm = normalize(heading)
    return PARTNER_SURVEY_SECTIONS.find((s) => {
      const candidates = [
        normalize(`${s.number}. ${s.title}`),
        normalize(s.title),
        normalize(`${s.number} ${s.title}`),
      ]
      return candidates.some((c) => norm === c || norm.startsWith(c) || c.startsWith(norm))
    })
  }

  function findQuestion(section: PartnerSurveySection, heading: string) {
    const norm = normalize(heading)
    return section.questions.find((q) => {
      const promptNorm = normalize(q.prompt)
      return norm === promptNorm || norm.startsWith(promptNorm.slice(0, 30))
    })
  }

  for (const line of lines) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line)
    const h3 = /^###\s+(.+?)\s*$/.exec(line)
    if (h2 && !line.startsWith('###')) {
      flush()
      currentQuestion = null
      currentSection = findSection(h2[1]) ?? null
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

export function partnerAnswersFilename(companyHint?: string): string {
  const base = (companyHint || 'firmcraft-partner-submission')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'firmcraft-partner-submission'
  return `${base}.md`
}

// ---------------------------------------------------------------------------
// AI-reviewed import
// ---------------------------------------------------------------------------

export type PartnerImportIssueLevel = 'error' | 'warning' | 'info'

export type PartnerImportIssue = {
  level: PartnerImportIssueLevel
  message: string
  questionKey?: string
}

export type PartnerImportChangeKind = 'added' | 'modified' | 'removed'

export type PartnerImportChange = {
  questionKey: string
  kind: PartnerImportChangeKind
  before: string
  after: string
}

export type PartnerImportReview = {
  answers: PartnerSurveyAnswers
  stats: {
    totalQuestions: number
    answeredQuestions: number
    emptyQuestions: number
    changedQuestions: number
  }
  issues: PartnerImportIssue[]
  changes: PartnerImportChange[] | null
}

export async function reviewPartnerMarkdownImport(
  markdown: string,
  existingAnswers?: PartnerSurveyAnswers,
): Promise<PartnerImportReview> {
  const parsed = parsePartnerMarkdownAnswers(markdown)

  const issues: PartnerImportIssue[] = []
  let answeredQuestions = 0
  let emptyQuestions = 0

  for (const section of PARTNER_SURVEY_SECTIONS) {
    for (const q of section.questions) {
      const key = partnerAnswerKey(section.id, q.id)
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
        if (key === 'contact.email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          issues.push({
            level: 'warning',
            message: `Contact email "${value}" doesn't look like a valid address.`,
            questionKey: key,
          })
        }
      } else {
        emptyQuestions++
        const level: PartnerImportIssueLevel =
          CRITICAL_QUESTION_KEYS.has(key) ? 'warning' : 'info'
        issues.push({
          level,
          message: `"${q.prompt}" was not answered.`,
          questionKey: key,
        })
      }
    }
  }

  let changes: PartnerImportChange[] | null = null
  let changedQuestions = 0
  if (existingAnswers) {
    changes = []
    for (const section of PARTNER_SURVEY_SECTIONS) {
      for (const q of section.questions) {
        const key = partnerAnswerKey(section.id, q.id)
        const before = (existingAnswers[key] || '').trim()
        const after = (parsed[key] || '').trim()
        if (before === after) continue
        changedQuestions++
        let kind: PartnerImportChangeKind = 'modified'
        if (!before && after) kind = 'added'
        else if (before && !after) kind = 'removed'
        changes.push({ questionKey: key, kind, before, after })
      }
    }
  }

  return {
    answers: parsed,
    stats: {
      totalQuestions: partnerTotalQuestions(),
      answeredQuestions,
      emptyQuestions,
      changedQuestions,
    },
    issues,
    changes,
  }
}
