// Generates src/lib/docs-data.ts by reading product documentation from the
// repo root (ROADMAP.md) and docs/. Runs as `prebuild` so local/Vercel builds
// pick up the latest docs. The generated file is committed so Vercel deploys
// (which may not include files outside the admin/ root) still have the content.
//
// Safety: if the source docs can't be found (e.g. a Vercel build that only
// uploads the admin/ subdir), the script exits WITHOUT overwriting the
// committed data file.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const DOCS_DIR = join(REPO_ROOT, 'docs')
const OUT_FILE = join(__dirname, '..', 'src', 'lib', 'docs-data.ts')

// Ordered groups. Each entry: [file path relative to repo root, group, title].
// Files not listed here but present in docs/ fall into the "Other" group.
const REGISTRY = [
  ['ROADMAP.md', 'Product Roadmap', 'Master Roadmap'],

  ['docs/PHASE1-AI-PHONE-ANSWERING-SPEC.md', 'Phase 1: AI Phone Answering', 'Spec'],
  ['docs/PHASE1-DECISIONS.md', 'Phase 1: AI Phone Answering', 'Decisions'],

  ['docs/scheduling-dispatch-market-research.md', 'Phase 2: Scheduling + Dispatch', 'Market Research'],
  ['docs/scheduling-dispatch-architecture.md', 'Phase 2: Scheduling + Dispatch', 'Architecture'],
  ['docs/scheduling-dispatch-build-plan.md', 'Phase 2: Scheduling + Dispatch', 'Build Plan'],
  ['docs/ai-scheduling-dispatch-research.md', 'Phase 2: Scheduling + Dispatch', 'AI Scheduling Research'],

  ['docs/digital-ops-research.md', 'Phase 6: Digital Ops', 'Research Report'],
  ['docs/gbp-setup-plan.md', 'Phase 6: Digital Ops', 'GBP Setup Plan'],
  ['docs/gbp-api-application-checklist.md', 'Phase 6: Digital Ops', 'GBP API Checklist'],

  ['docs/houston-hvac-prospect-research.md', 'Sales & Outreach', 'Houston HVAC Prospects'],
  ['docs/site-copy-vs-hermes-audit.md', 'Sales & Outreach', 'Site Copy vs Hermes Audit'],
  ['docs/brand-strategy-actions.md', 'Sales & Outreach', 'Brand Strategy Actions'],

  ['docs/firmcraft-google-workspace-setup.md', 'Operations & Setup', 'Google Workspace Setup'],
  ['docs/firmcraft-weekend-buildout-plan.md', 'Operations & Setup', 'Weekend Buildout Plan'],
  ['docs/resend-firmcraft-mail-setup.md', 'Operations & Setup', 'Resend Mail Setup'],
  ['docs/billing-spec.md', 'Operations & Setup', 'Billing Spec'],
]

// Order in which groups are presented in the sidebar.
const GROUP_ORDER = [
  'Product Roadmap',
  'Phase 1: AI Phone Answering',
  'Phase 2: Scheduling + Dispatch',
  'Phase 6: Digital Ops',
  'Sales & Outreach',
  'Operations & Setup',
  'Other',
]

// Never include docs that may carry secrets.
const EXCLUDE_RE = /credential/i

// Some ops docs contain live secrets inline. Scrub them before embedding so the
// data file (and the admin UI that renders it) never carries a real credential.
const REDACTIONS = [
  // KEY=secret env assignments (CLOUDFLARE_TOKEN=..., API_KEY=..., etc.)
  [/((?:[A-Z][A-Z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD|PASSWD|PWD))\s*=\s*)['"]?[A-Za-z0-9_\-./+=]{16,}['"]?/g, '$1<redacted>'],
  // Google OAuth client IDs
  [/\d{10,}-[a-z0-9]{16,}\.apps\.googleusercontent\.com/g, '<redacted>.apps.googleusercontent.com'],
  // Google OAuth client secrets
  [/GOCSPX-[A-Za-z0-9_\-]{10,}/g, '<redacted>'],
  // Cloudflare-style API tokens (40 char) when labelled as a token nearby is hard;
  // catch bare 40-char token-shaped strings on their own.
  [/\b[A-Za-z0-9_-]{40}\b/g, '<redacted>'],
  // Cloudflare zone / account IDs (32 hex)
  [/\b[0-9a-f]{32}\b/g, '<redacted>'],
]

function redactSecrets(text) {
  let out = text
  for (const [re, sub] of REDACTIONS) out = out.replace(re, sub)
  return out
}

function slugFromPath(p) {
  return p
    .replace(/^docs\//, '')
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function titleFromFilename(p) {
  const base = p.replace(/^docs\//, '').replace(/\.md$/i, '')
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

if (!existsSync(join(REPO_ROOT, 'ROADMAP.md'))) {
  console.warn('[build-docs] ROADMAP.md not found at repo root — keeping committed docs-data.ts')
  process.exit(0)
}

// Collect registry files first (preserves curated titles/groups/order).
const seen = new Set()
const docs = []

function addDoc(relPath, group, title) {
  if (EXCLUDE_RE.test(relPath)) return
  const abs = join(REPO_ROOT, relPath)
  if (!existsSync(abs)) {
    console.warn(`[build-docs] missing: ${relPath} (skipped)`)
    return
  }
  const content = redactSecrets(readFileSync(abs, 'utf8'))
  const lineCount = content.split('\n').length
  const wordCount = (content.match(/\S+/g) || []).length
  docs.push({ id: slugFromPath(relPath), title, group, content, lineCount, wordCount })
  seen.add(relPath)
}

for (const [relPath, group, title] of REGISTRY) addDoc(relPath, group, title)

// Sweep docs/ for anything not in the registry -> "Other".
import { readdirSync } from 'node:fs'
if (existsSync(DOCS_DIR)) {
  for (const f of readdirSync(DOCS_DIR).sort()) {
    if (!f.toLowerCase().endsWith('.md')) continue
    const rel = `docs/${f}`
    if (seen.has(rel)) continue
    addDoc(rel, 'Other', titleFromFilename(rel))
  }
}

if (docs.length === 0) {
  console.warn('[build-docs] no docs collected — keeping committed docs-data.ts')
  process.exit(0)
}

const groupsPresent = GROUP_ORDER.filter((g) => docs.some((d) => d.group === g))

const banner = `// AUTO-GENERATED by scripts/build-docs.mjs — do not edit by hand.
// Run \`npm run build\` (or \`node scripts/build-docs.mjs\`) to regenerate.
`

const body = `export interface DocMeta {
  id: string
  title: string
  group: string
  content: string
  lineCount: number
  wordCount: number
}

export const DOC_GROUPS: string[] = ${JSON.stringify(groupsPresent, null, 2)}

export const DOCS: DocMeta[] = ${JSON.stringify(docs, null, 2)}
`

writeFileSync(OUT_FILE, banner + '\n' + body)
console.log(`[build-docs] wrote ${docs.length} docs across ${groupsPresent.length} groups -> src/lib/docs-data.ts`)
