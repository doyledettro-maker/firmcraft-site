/**
 * Markdown template generator + parser for the freeform survey.
 *
 * Template is a plain .md file the client downloads, fills out in their editor
 * of choice, and uploads back. The format is permissive: we look for `## N. Title`
 * section headings and `### Question` sub-headings, and gather everything
 * underneath each sub-heading as the answer (until the next heading or
 * fence-comment block). Trailing instructions / placeholders inside `<!-- -->`
 * comments are stripped on parse so people can leave the guidance text alone.
 */

import { SURVEY_SECTIONS, type SurveyAnswers, answerKey } from './survey'

const HEADER = `# Firmcraft onboarding survey

Hey — thanks for filling this out. Take as long as you need. There are no
character limits, no required fields, and you can rewrite anything. The more
candid the better.

When you're done, head back to https://firmcraft.ai/get-started and drop this
file in the upload area. We'll handle the rest.

---
`

export function buildMarkdownTemplate(): string {
  const parts: string[] = [HEADER]
  for (const section of SURVEY_SECTIONS) {
    parts.push(`\n## ${section.number}. ${section.title}\n`)
    parts.push(`<!-- ${section.intro} -->\n`)
    for (const q of section.questions) {
      parts.push(`\n### ${q.prompt}\n`)
      if (q.guidance) {
        parts.push(`<!-- ${q.guidance} -->\n`)
      }
      parts.push(`\n_Your answer here. Delete this line and write whatever you'd like — paragraphs are welcome._\n`)
    }
  }
  parts.push('\n---\n\nThanks. — The Firmcraft team\n')
  return parts.join('')
}

const PLACEHOLDER_PATTERN =
  /^_Your answer here\. Delete this line and write whatever you'd like — paragraphs are welcome\._$/

function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim()
}

function normalize(s: string): string {
  // Lowercase, strip punctuation, collapse whitespace — used for matching headings
  // back to their schema entries even if the user lightly edited them.
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
 * Best-effort: missing headings yield empty strings, extra headings are
 * ignored. We don't fail on imperfect input — clients reformat all the time.
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

  const lines = markdown.split(/\r?\n/)
  let currentSection: typeof SURVEY_SECTIONS[number] | null = null
  let currentQuestion: SurveyQuestionRef | null = null
  let buffer: string[] = []

  function flush() {
    if (currentQuestion) {
      const raw = buffer.join('\n')
      const cleaned = stripComments(raw)
      // Drop default placeholder lines if the user left them.
      const filtered = cleaned
        .split(/\r?\n/)
        .filter((l) => !PLACEHOLDER_PATTERN.test(l.trim()))
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
    if (currentQuestion) {
      buffer.push(line)
    }
  }
  flush()

  return answers
}

export function answersFilename(companyHint?: string): string {
  const base = (companyHint || 'firmcraft-onboarding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'firmcraft-onboarding'
  return `${base}.md`
}
