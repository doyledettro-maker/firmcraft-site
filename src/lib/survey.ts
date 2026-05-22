/**
 * Shared onboarding survey schema for the marketing site (/get-started).
 *
 * Everything is freeform: each question maps to a single textarea answer.
 * No dropdowns, no radio buttons, no character limits.
 *
 * Submitted answers are keyed by `${section.id}.${question.id}`.
 */

export type SurveyQuestion = {
  id: string
  prompt: string
  guidance?: string
  placeholder?: string
}

export type SurveySection = {
  id: string
  number: number
  title: string
  intro: string
  questions: SurveyQuestion[]
}

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: 'company',
    number: 1,
    title: 'Company profile',
    intro:
      "Let's start with the basics — who you are, what you do, and who we'll work with most.",
    questions: [
      {
        id: 'overview',
        prompt: "What's your company called, what do you do, and roughly how big are you?",
        guidance:
          'Industry, headcount, locations, website — anything that paints the picture.',
        placeholder:
          'e.g. Acme Industrial — regional industrial supply distributor in Springfield, IL. 24 staff (10 sales, 6 warehouse, 5 ops/purchasing, 3 admin). acmeindustrial.com.',
      },
      {
        id: 'primaryContact',
        prompt: "Who's the main person we'll be working with day-to-day?",
        guidance:
          "Name, role, email, phone, and anything else useful — like 'don't email after 5pm Central'.",
        placeholder:
          'Jane Owner, President, jane@acme.com, 217-555-0102. Best reached on Slack during the day.',
      },
      {
        id: 'context',
        prompt:
          "Anything else about your business we should know before we start?",
        guidance:
          'How you got here, what makes you different, recent changes, ongoing initiatives — whatever shapes how the operator should show up.',
        placeholder: 'Optional — skip if nothing comes to mind.',
      },
    ],
  },
  {
    id: 'tech',
    number: 2,
    title: 'Tech stack',
    intro:
      'We integrate with the tools you already pay for. Tell us what is actually in play.',
    questions: [
      {
        id: 'tools',
        prompt:
          'What tools does your team actually use day-to-day?',
        guidance:
          'CRM, project management, communication, accounting, calendar, document storage, e-sign, helpdesk, niche industry tools — whatever you actually open.',
        placeholder:
          'e.g. Microsoft Teams, M365, QuickBooks Online, HubSpot CRM, Google Drive, DocuSign, Calendly. Plus a custom intake form on Typeform.',
      },
      {
        id: 'aiTools',
        prompt: 'Any AI tools already in the mix? How are people using them — or not?',
        guidance:
          'ChatGPT Teams, Copilot, Claude, custom GPTs, Perplexity, anything else. Honest is fine — "we paid for it but nobody opens it" is a useful answer.',
        placeholder:
          'e.g. ChatGPT Teams ($25/user). A couple of managers use it for drafting; nobody else has logged in.',
      },
      {
        id: 'hosting',
        prompt: 'Where does your stuff live — cloud, on-prem, somewhere else?',
        guidance: 'AWS / GCP / Azure / on-prem / a mix / honestly not sure.',
        placeholder: 'e.g. mostly Microsoft 365 cloud + one on-prem file server.',
      },
    ],
  },
  {
    id: 'readiness',
    number: 3,
    title: 'AI readiness',
    intro:
      "No wrong answers — this just tells us how much hand-holding to plan for.",
    questions: [
      {
        id: 'technicalMaturity',
        prompt: 'How technically capable is your team?',
        guidance:
          'Comfortable with APIs and integrations, or more "just send me an email"? It is fine to be the latter.',
        placeholder:
          'e.g. one of the owners is technical (built our website). The rest aren\'t — they\'ll need everything to work via Teams or email.',
      },
      {
        id: 'data',
        prompt: 'How is your operational data organized today?',
        guidance:
          'Spreadsheets and folders? CRM with discipline? A real warehouse with pipelines? Or a mix that depends on who you ask?',
        placeholder:
          'e.g. customer data is in HubSpot, billing is in QuickBooks, the rest lives in shared Google Drive folders we keep meaning to clean up.',
      },
      {
        id: 'sentiment',
        prompt: 'How does your team currently feel about AI?',
        guidance:
          'Excited, skeptical, indifferent, openly resistant — all fair. Knowing this lets us calibrate the rollout.',
        placeholder:
          'e.g. the owners are curious. A couple of managers are excited. Most of the staff thinks it\'s overhyped and would rather not talk about it.',
      },
    ],
  },
  {
    id: 'priorities',
    number: 4,
    title: 'Use case priorities',
    intro:
      "What should the operator focus on first? Top of the list is what we'll wire up in week one.",
    questions: [
      {
        id: 'firstWin',
        prompt: 'If we could fix exactly one thing in week one, what would it be?',
        guidance:
          'Be as specific as you can — the more concrete the workflow, the faster we ship it.',
        placeholder:
          'e.g. turning inbound RFQs into draft quotes. Sales spends ~12 hours/week retyping requests into our system and we are always behind.',
      },
      {
        id: 'roughRanking',
        prompt: 'What other workflows are top of mind? Rank them roughly.',
        guidance:
          "List a few in priority order. They don't have to be fully scoped yet — even a name and one sentence is plenty.",
        placeholder:
          '1) RFQ-to-quote drafting\n2) Order status follow-up with customers\n3) Weekly KPI digest for leadership\n4) Triage of after-hours email\n5) Drafting vendor / supplier responses',
      },
      {
        id: 'successHeadline',
        prompt: "What's the headline you'd want to share six months in?",
        guidance: 'In your own words — what does success look like?',
        placeholder:
          'e.g. "We took a week of administrative work off every manager\'s plate and we are not behind on quotes for the first time in three years."',
      },
    ],
  },
  {
    id: 'integrations',
    number: 5,
    title: 'Integrations',
    intro:
      'We support most modern SaaS APIs. Tell us what to connect on day one.',
    questions: [
      {
        id: 'systems',
        prompt: 'Which systems should the operator plug into on day one?',
        guidance:
          'Be specific — Salesforce, Gmail, Drive, your specific ERP or CRM vendor, your accounting platform, etc.',
        placeholder:
          'e.g. Microsoft 365 (mail + calendar + SharePoint), HubSpot CRM, QuickBooks Online, DocuSign, our internal ERP (NetSuite).',
      },
      {
        id: 'apiQuirks',
        prompt:
          'Any of those have weird APIs, no APIs, or known quirks we should know about?',
        guidance:
          "Don't worry if you don't know — but a heads-up saves a week.",
        placeholder:
          "e.g. our ERP doesn't have a real API for the workflows we care about; we'll likely need to scrape PDFs out of email. NetSuite customization requires a vendor consultant.",
      },
      {
        id: 'context',
        prompt: 'Where will the operator pull context from when answering questions?',
        guidance:
          'SOPs, internal wikis, email archives, document repositories, vendor portals, your website — anywhere you would point a new employee.',
        placeholder:
          'e.g. we keep SOPs in a Notion workspace, plus a SharePoint folder of process docs, plus the four years of email in our shared inbox.',
      },
    ],
  },
  {
    id: 'security',
    number: 6,
    title: 'Security & compliance',
    intro:
      'Honest answers help us configure the right tenant — encryption, audit logs, data residency.',
    questions: [
      {
        id: 'regulations',
        prompt: 'Any regulations or compliance frameworks that apply to you?',
        guidance:
          'HIPAA, SOC 2, GDPR, CCPA, PCI-DSS, ITAR, FedRAMP, state bar / attorney privilege, anything else.',
        placeholder:
          'e.g. nothing formal yet. A few enterprise customers have asked about SOC 2 but no one has required it.',
      },
      {
        id: 'residency',
        prompt: 'Where does your data need to live?',
        guidance: 'US only? EU only? No preference? Anything that matters to you or your clients.',
        placeholder: 'e.g. US only. A handful of customers are starting to ask whether their data stays in the US.',
      },
      {
        id: 'controls',
        prompt:
          "Do you need audit logs, SSO, or any specific security controls in place?",
        guidance:
          "Existing frameworks (ISO 27001, NIST CSF, CIS), audit log requirements, SSO provider — anything we should plan around.",
        placeholder:
          "e.g. we'd like SSO via Microsoft Entra and a tamper-evident audit log of every action the operator takes. No formal infosec program yet.",
      },
    ],
  },
  {
    id: 'team',
    number: 7,
    title: 'Team & access',
    intro: 'Seats, departments, and who runs the show on your side.',
    questions: [
      {
        id: 'users',
        prompt:
          'Roughly how many people will use this, and what departments / roles are they in?',
        guidance: 'Approximate is fine. We just need to scope seats and access.',
        placeholder:
          'e.g. 24 total — 10 sales, 6 warehouse, 5 ops/purchasing, 3 admin. Plus me (operations lead / admin).',
      },
      {
        id: 'admins',
        prompt: 'Who are the admins?',
        guidance:
          "The people who can approve config changes, invite users, and manage billing. Names + emails.",
        placeholder:
          'e.g. Jane Owner (jane@acme.com) and David Operations (david@acme.com). Both can approve anything.',
      },
      {
        id: 'training',
        prompt: 'How do you want training to work?',
        guidance:
          'Self-serve docs, a guided live session, white-glove department-by-department rollouts — or some mix.',
        placeholder:
          'e.g. a 1-hour live session with the whole team, then department-specific follow-ups for sales vs. warehouse vs. ops.',
      },
    ],
  },
  {
    id: 'budget',
    number: 8,
    title: 'Budget & timeline',
    intro:
      'Flat monthly rate. You can change tiers any time — we will prorate.',
    questions: [
      {
        id: 'timeline',
        prompt: 'When do you want to be live?',
        guidance: 'ASAP, in 30 days, in 90 days, flexible — whatever maps to your reality.',
        placeholder: "e.g. ASAP. We'd love our first workflow automated before end of month.",
      },
      {
        id: 'metrics',
        prompt: 'How will you measure success?',
        guidance:
          'Hours saved, response time, deals closed, tickets handled, orders processed on time — be specific if you can.',
        placeholder:
          "e.g. cut RFQ-to-quote time from 3 days to same-day. Get our shared inbox response time under an hour.",
      },
    ],
  },
  {
    id: 'communication',
    number: 9,
    title: 'Communication preferences',
    intro: 'During onboarding and ongoing operations.',
    questions: [
      {
        id: 'channel',
        prompt:
          'How do you prefer to stay in touch during onboarding?',
        guidance: 'Email, shared Slack channel, regular calls, a mix.',
        placeholder:
          "e.g. shared Slack channel for day-to-day, plus a 30-min weekly call on Tuesdays.",
      },
      {
        id: 'cadence',
        prompt: 'How often do you want status updates?',
        guidance: 'Daily standup, weekly digest, bi-weekly, monthly — whatever works.',
        placeholder: 'e.g. weekly digest on Fridays. Daily would be too much noise.',
      },
      {
        id: 'escalation',
        prompt:
          "Who's on the escalation list — who do we page when something goes wrong?",
        guidance:
          "Names + how to reach them, especially after hours. Helpful to list a primary and a backup.",
        placeholder:
          "e.g. primary: Jane Owner (cell 217-555-0102). Backup: David Operations (cell 217-555-0144). Don't text after 9pm Central unless it's urgent.",
      },
    ],
  },
  {
    id: 'custom',
    number: 10,
    title: 'Custom requirements',
    intro:
      "Edge cases, hard requirements, things you wish other vendors had asked. Be candid — this is where we calibrate.",
    questions: [
      {
        id: 'specialNeeds',
        prompt: 'Any special needs or hard constraints?',
        guidance:
          'Air-gapped network? Translation languages? Specific industry quirks? Things that have to work day one.',
        placeholder:
          'e.g. customer pricing data is highly sensitive — no third-party model training on our data, ever.',
      },
      {
        id: 'mustHave',
        prompt: 'What features would make this a clear win in the first 30 days?',
        guidance: 'The two or three things we absolutely need to land for you to feel good.',
        placeholder:
          'e.g. (1) automated RFQ-to-quote drafting, (2) weekly leadership KPI digest, (3) inbox triage that surfaces anything from a top-20 customer.',
      },
      {
        id: 'dealBreakers',
        prompt: "Any deal-breakers? What would cause you to walk away?",
        guidance: "We'd rather know now than later.",
        placeholder:
          "e.g. any model training on our data; long-term contracts; per-seat pricing; vendors without a US-only data residency option.",
      },
    ],
  },
]

export type SurveyAnswers = Record<string, string>

export function emptyAnswers(): SurveyAnswers {
  const out: SurveyAnswers = {}
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      out[`${section.id}.${q.id}`] = ''
    }
  }
  return out
}

export function answerKey(sectionId: string, questionId: string): string {
  return `${sectionId}.${questionId}`
}

export function totalQuestions(): number {
  return SURVEY_SECTIONS.reduce((n, s) => n + s.questions.length, 0)
}
