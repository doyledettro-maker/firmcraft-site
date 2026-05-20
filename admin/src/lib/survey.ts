/**
 * Onboarding survey schema (UI-only stub — backend wiring later).
 */

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'
export type CloudProvider = 'AWS' | 'GCP' | 'Azure' | 'On-prem' | 'None' | 'Other'
export type DataInfra = 'none' | 'basic' | 'moderate' | 'advanced'
export type ApiAvailability = 'all' | 'some' | 'none' | 'unknown'
export type SsoProvider = 'okta' | 'google' | 'azure-ad' | 'auth0' | 'none' | 'other'
export type DataResidency = 'us' | 'eu' | 'apac' | 'no-pref'
export type TrainingPreference = 'self-serve' | 'guided' | 'white-glove'
/**
 * Plan tiers — Operator rebrand (Solo / Team / Pro) + Pilot for cost-recovery
 * customers. Legacy spark/flow/forge are kept for backfill safety; new clients
 * should never get those.
 */
export type PlanTier =
  | 'solo'
  | 'team'
  | 'pro'
  | 'pilot'
  | 'spark'
  | 'flow'
  | 'forge'
export type ImplementationTimeline = 'asap' | '30-days' | '60-days' | '90-days' | 'flexible'
export type ContactMethod = 'email' | 'slack' | 'phone'
export type UpdateFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export type Contact = { name: string; email: string }

export type SurveyData = {
  // 1. Company Profile
  companyName: string
  industry: string
  companySize: CompanySize | ''
  website: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactRole: string

  // 2. Tech stack
  crm: string
  projectManagement: string
  communicationTools: string[]
  cloudProvider: CloudProvider | ''
  existingAITools: string[]

  // 3. AI readiness
  technicalMaturity: number // 1..5
  dataInfrastructure: DataInfra | ''
  teamAIFamiliarity: number // 1..5

  // 4. Use case priorities (ranked: index 0 = top priority)
  useCasePriorities: string[]

  // 5. Integrations
  systemsToConnect: string[]
  apiAvailability: ApiAvailability | ''
  ssoProvider: SsoProvider | ''
  dataSources: string[]

  // 6. Security & compliance
  industryRegulations: string[]
  dataResidency: DataResidency | ''
  auditNeeds: boolean
  existingFrameworks: string[]

  // 7. Team & access
  numberOfUsers: string // string for free input; we'll cast on the backend
  departments: string[]
  adminContacts: Contact[]
  trainingPreference: TrainingPreference | ''

  // 8. Budget & timeline
  planTier: PlanTier | ''
  implementationTimeline: ImplementationTimeline | ''
  successMetrics: string

  // 9. Communication
  primaryContactMethod: ContactMethod | ''
  updateFrequency: UpdateFrequency | ''
  escalationContacts: Contact[]

  // 10. Custom requirements
  specialNeeds: string
  priorityFeatures: string
  dealBreakers: string
}

export const emptySurvey: SurveyData = {
  companyName: '',
  industry: '',
  companySize: '',
  website: '',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactRole: '',

  crm: '',
  projectManagement: '',
  communicationTools: [],
  cloudProvider: '',
  existingAITools: [],

  technicalMaturity: 3,
  dataInfrastructure: '',
  teamAIFamiliarity: 3,

  useCasePriorities: [
    'Customer support',
    'Internal ops',
    'Data analysis',
    'Content generation',
    'Code assistance',
    'Custom',
  ],

  systemsToConnect: [],
  apiAvailability: '',
  ssoProvider: '',
  dataSources: [],

  industryRegulations: [],
  dataResidency: '',
  auditNeeds: false,
  existingFrameworks: [],

  numberOfUsers: '',
  departments: [],
  adminContacts: [{ name: '', email: '' }],
  trainingPreference: '',

  planTier: '',
  implementationTimeline: '',
  successMetrics: '',

  primaryContactMethod: '',
  updateFrequency: '',
  escalationContacts: [{ name: '', email: '' }],

  specialNeeds: '',
  priorityFeatures: '',
  dealBreakers: '',
}

export const sectionTitles = [
  'Company profile',
  'Current tech stack',
  'AI readiness',
  'Use case priorities',
  'Integration requirements',
  'Security & compliance',
  'Team & access',
  'Budget & timeline',
  'Communication preferences',
  'Custom requirements',
] as const

export const planMeta: Record<PlanTier, { name: string; price: string; tagline: string }> = {
  // Operator rebrand (current naming).
  solo:  { name: 'Operator Solo',  price: '$399/mo',   tagline: '1-2 person firms — core managed AI.' },
  team:  { name: 'Operator Team',  price: '$799/mo',   tagline: '3-5 person firms — multi-team, all integrations.' },
  pro:   { name: 'Operator Pro',   price: '$1,499/mo', tagline: '6-10 person firms — priority response, quarterly review.' },
  pilot: { name: 'Operator Pilot', price: '$50/mo',    tagline: 'Cost-recovery pilot — case-study / promo participation.' },
  // Legacy aliases — kept so old records render. Do not use for new clients.
  spark: { name: 'Spark (legacy)', price: '$399/mo',   tagline: 'Single team, core integrations.' },
  flow:  { name: 'Flow (legacy)',  price: '$799/mo',   tagline: 'Multi-team, all integrations, custom playbooks.' },
  forge: { name: 'Forge (legacy)', price: '$1,499/mo', tagline: 'Enterprise — SSO, dedicated tenant, custom SLAs.' },
}
