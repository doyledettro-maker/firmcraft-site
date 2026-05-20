// Shared pricing source of truth for Managed AI (Spark/Flow/Scale), Build
// packages, and Operate retainers. Keep numbers identical to the HTML designs
// in design/site-expansion/.

export type OperatorPlan = {
  tier: 'Spark' | 'Flow' | 'Scale' | 'Custom'
  headline: string
  /** Plain-English team-size for the plan — the primary sizing input. */
  teamSize: string
  /** Short sales tagline pairing the team-size with the typical buyer. */
  teamFit: string
  price: string
  setup: string
  /** Long-form copy used on /managed-ai. */
  sub: string
  /** Condensed copy used in the /pricing summary row. */
  subShort: string
  features: string[]
  cta: string
  href: string
  featured?: boolean
  badge?: string
  /** True for the custom/larger-engagement card — renders without $/mo + setup row. */
  custom?: boolean
}

export const OPERATOR_PLANS: OperatorPlan[] = [
  {
    tier: 'Spark',
    headline: 'Get started',
    teamSize: '1–2 people',
    teamFit: 'Solo owner-operators and one-person shops.',
    price: '$399',
    setup: '+ $1,000 one-time setup',
    sub: 'A single workflow, fully run for you. For one-person shops and businesses validating the model.',
    subShort: '1–2 people on the agent. One core workflow, 3 integrations, $100/mo token allowance, monthly review.',
    features: [
      '1–2 people using the agent day-to-day',
      'One core workflow (e.g. contracts, intake, claims)',
      '$100/mo AI token allowance included',
      'Up to 3 tool integrations',
      'Lives in your team chat',
      'Monthly review with your ops lead',
    ],
    cta: 'Start with Spark',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Spark',
  },
  {
    tier: 'Flow',
    headline: 'Run the business',
    teamSize: '3–5 people',
    teamFit: 'Small teams running real recurring work.',
    price: '$799',
    setup: '+ $2,000 one-time setup',
    sub: 'The operator handles the recurring work eating your calendar — claims, contracts, follow-up, marketing.',
    subShort:
      '3–5 people on the agent. Up to 8 workflows, unlimited integrations, $200/mo tokens, weekly review.',
    features: [
      '3–5 people using the agent day-to-day',
      'Up to 8 active workflows',
      '$200/mo AI token allowance included',
      'Unlimited integrations',
      'Custom playbooks per role',
      'Weekly ops review + change requests',
      'SOC 2 controls + audit log access',
    ],
    cta: 'Choose Flow',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Flow',
    featured: true,
    badge: 'Most popular',
  },
  {
    tier: 'Scale',
    headline: 'Operate at scale',
    teamSize: '6–10 people',
    teamFit: 'Multi-role teams, multiple locations, or growing crews.',
    price: '$1,499',
    setup: '+ $3,500 one-time setup',
    sub: 'Multi-team, multi-location businesses. Custom builds, dedicated lead, priority queue.',
    subShort:
      '6–10 people on the agent. Unlimited workflows, dedicated ops lead, priority queue + SLA.',
    features: [
      '6–10 people using the agent day-to-day',
      'Unlimited workflows',
      '$400/mo AI token allowance included',
      'Multi-team workspaces & role policies',
      'Dedicated implementation lead',
      'Priority queue + 4-hour response SLA',
      'Quarterly business review',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@firmcraft.ai?subject=Firmcraft%20Scale',
  },
  {
    tier: 'Custom',
    headline: 'Bigger than ten?',
    teamSize: '11+ people',
    teamFit: 'Whole departments, multi-entity rollouts, ERP-deep workflows.',
    price: 'Custom',
    setup: 'Starts with the Assessment',
    sub: 'Larger teams need scoped onboarding, multi-department workflows, and real ERP integration. Pricing is set by the AI Readiness Assessment, not a sticker price.',
    subShort:
      '11+ people. Begins with a fixed-fee Assessment ($4.5k–$8.5k), then a scoped Build engagement.',
    features: [
      '11+ people using the agent day-to-day',
      'Multi-department or multi-location rollout',
      'Embedded into your ERP (BC, NetSuite, Acumatica)',
      'Custom workflows scoped on the Assessment',
      'Dedicated implementation lead + roadmap',
      'Fixed-fee Build engagement, not a monthly plan',
    ],
    cta: 'Book the Assessment',
    href: '/pricing#assess',
    custom: true,
  },
]

export type BuildPackage = {
  key: 'foundation' | 'finance' | 'operations' | 'voice-support'
  name: string
  nameEm: string
  blurb: string
  duration: string
  priceLow: string
  priceHigh: string
  priceNote?: string
  outcome: string
}

export const BUILD_PACKAGES: BuildPackage[] = [
  {
    key: 'foundation',
    name: 'Firmcraft ',
    nameEm: 'Foundation',
    blurb:
      'The anchor build. Managed Hermes + RAG + messaging gateway + Langfuse + training.',
    duration: '6–8 weeks',
    priceLow: '$25k',
    priceHigh: '$45k',
    outcome:
      'Sovereign chat live in your stack, indexed knowledge, gateway + observability in place, team trained.',
  },
  {
    key: 'finance',
    name: 'Firmcraft ',
    nameEm: 'Finance',
    blurb:
      'Foundation + Vic.ai or Stampli + BC or NetSuite integration + AP/AR workflows.',
    duration: '10–14 weeks',
    priceLow: '$55k',
    priceHigh: '$95k',
    priceNote: 'Includes Foundation',
    outcome:
      'AP automated, month-end accelerated, audit-ready trail on every model-touched txn.',
  },
  {
    key: 'operations',
    name: 'Firmcraft ',
    nameEm: 'Operations',
    blurb:
      'Foundation + n8n agent workflows + ERP integrations + asset/maintenance loop.',
    duration: '12–16 weeks',
    priceLow: '$65k',
    priceHigh: '$110k',
    priceNote: 'Includes Foundation',
    outcome:
      'Work orders drafted, dispatched, closed. Field-to-ERP loop sealed. No after-hours entry.',
  },
  {
    key: 'voice-support',
    name: 'Firmcraft ',
    nameEm: 'Voice + Support',
    blurb:
      'Foundation + Retell or Vapi voice agent + Fin or Hermes chat + CRM / helpdesk wiring.',
    duration: '8–12 weeks',
    priceLow: '$40k',
    priceHigh: '$80k',
    priceNote: 'Includes Foundation',
    outcome:
      'Voice triage, chat agent across surfaces, handoffs preserved into your CRM.',
  },
]

export type OperateTier = {
  tier: string
  name: string
  priceLow: string
  priceHigh: string
  scope: string
  features: string[]
  featured?: boolean
}

export const OPERATE_TIERS: OperateTier[] = [
  {
    tier: 'Tier 01',
    name: 'Essential',
    priceLow: '$2.5k',
    priceHigh: '$5k',
    scope: '5–10 hrs / month · 1 BD SLA',
    features: [
      'Model monitoring & eval regression',
      'Prompt tuning & minor workflow edits',
      'Quarterly executive review',
    ],
  },
  {
    tier: 'Tier 02',
    name: 'Standard',
    priceLow: '$7.5k',
    priceHigh: '$15k',
    scope: '10–25 hrs / month · same-day SLA',
    features: [
      'Everything in Essential',
      '1–2 new workflows / quarter',
      'Eval & regression suite ownership',
      'Monthly ops review',
    ],
    featured: true,
  },
  {
    tier: 'Tier 03',
    name: 'Comprehensive',
    priceLow: '$20k',
    priceHigh: '$40k',
    scope: '25+ hrs / month · 4-hr SLA',
    features: [
      'Everything in Standard',
      'Embedded fractional AI lead',
      'Continuous roadmap execution',
      'Vendor & partner negotiation',
    ],
  },
]

export const ASSESSMENT = {
  priceLow: '$4,500',
  priceHigh: '$8,500',
  duration: '2–3 weeks',
}
