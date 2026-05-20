import type { PlanTier, SurveyData } from './survey'

export type ClientStatus = 'onboarding' | 'active' | 'suspended'

export type Client = {
  id: string
  name: string
  industry: string
  status: ClientStatus
  planTier: PlanTier
  contactName: string
  contactEmail: string
  createdAt: string // ISO
  monthlyRevenue: number
  usage: {
    activeUsers: number
    seats: number
    aiCallsThisMonth: number
    aiCallsLimit: number
    playbooksRun: number
    integrationsConnected: number
  }
  survey: Partial<SurveyData>
}

export const mockClients: Client[] = [
  {
    id: 'cli_acme_law',
    name: 'Acme Law',
    industry: 'Legal services',
    status: 'active',
    planTier: 'flow',
    contactName: 'Margaret Chen',
    contactEmail: 'margaret@acmelaw.com',
    createdAt: '2026-02-14T16:30:00Z',
    monthlyRevenue: 799,
    usage: {
      activeUsers: 12,
      seats: 15,
      aiCallsThisMonth: 8420,
      aiCallsLimit: 25000,
      playbooksRun: 142,
      integrationsConnected: 6,
    },
    survey: {
      companyName: 'Acme Law',
      industry: 'Legal services',
      companySize: '11-50',
      website: 'https://acmelaw.com',
      primaryContactName: 'Margaret Chen',
      primaryContactEmail: 'margaret@acmelaw.com',
      primaryContactRole: 'Managing Partner',
      crm: 'Clio',
      projectManagement: 'Asana',
      communicationTools: ['Slack', 'Microsoft Teams'],
      cloudProvider: 'AWS',
      existingAITools: ['ChatGPT Team', 'Harvey'],
      technicalMaturity: 3,
      dataInfrastructure: 'moderate',
      teamAIFamiliarity: 3,
      useCasePriorities: ['Internal ops', 'Customer support', 'Data analysis', 'Content generation', 'Code assistance', 'Custom'],
      industryRegulations: ['Attorney-client privilege', 'State bar rules'],
      dataResidency: 'us',
      auditNeeds: true,
      planTier: 'flow',
      implementationTimeline: '30-days',
      successMetrics: 'Reduce intake time 40%, automate 80% of conflict checks.',
    },
  },
  {
    id: 'cli_summit_cpa',
    name: 'Summit CPA',
    industry: 'Accounting',
    status: 'active',
    planTier: 'spark',
    contactName: 'David Park',
    contactEmail: 'dpark@summitcpa.com',
    createdAt: '2026-03-02T20:15:00Z',
    monthlyRevenue: 399,
    usage: {
      activeUsers: 6,
      seats: 8,
      aiCallsThisMonth: 2150,
      aiCallsLimit: 8000,
      playbooksRun: 38,
      integrationsConnected: 3,
    },
    survey: {
      companyName: 'Summit CPA',
      industry: 'Accounting',
      companySize: '1-10',
      planTier: 'spark',
      primaryContactName: 'David Park',
      primaryContactEmail: 'dpark@summitcpa.com',
    },
  },
  {
    id: 'cli_brightside_arch',
    name: 'Brightside Architecture',
    industry: 'Architecture',
    status: 'onboarding',
    planTier: 'flow',
    contactName: 'Yuki Tanaka',
    contactEmail: 'yuki@brightside.studio',
    createdAt: '2026-05-04T14:00:00Z',
    monthlyRevenue: 0,
    usage: {
      activeUsers: 0,
      seats: 12,
      aiCallsThisMonth: 0,
      aiCallsLimit: 25000,
      playbooksRun: 0,
      integrationsConnected: 0,
    },
    survey: {
      companyName: 'Brightside Architecture',
      industry: 'Architecture',
      companySize: '11-50',
      primaryContactName: 'Yuki Tanaka',
      primaryContactEmail: 'yuki@brightside.studio',
      primaryContactRole: 'Operations Director',
      planTier: 'flow',
    },
  },
  {
    id: 'cli_redwood_pe',
    name: 'Redwood Engineering',
    industry: 'Civil engineering',
    status: 'active',
    planTier: 'forge',
    contactName: 'Aisha Patel',
    contactEmail: 'apatel@redwoodpe.com',
    createdAt: '2025-11-20T18:45:00Z',
    monthlyRevenue: 1499,
    usage: {
      activeUsers: 47,
      seats: 60,
      aiCallsThisMonth: 31200,
      aiCallsLimit: 80000,
      playbooksRun: 612,
      integrationsConnected: 11,
    },
    survey: {
      companyName: 'Redwood Engineering',
      industry: 'Civil engineering',
      companySize: '51-200',
      planTier: 'forge',
      primaryContactName: 'Aisha Patel',
      primaryContactEmail: 'apatel@redwoodpe.com',
      industryRegulations: ['ITAR', 'FedRAMP-aligned'],
      dataResidency: 'us',
      auditNeeds: true,
    },
  },
  {
    id: 'cli_oakhill_realty',
    name: 'Oakhill Realty',
    industry: 'Real estate',
    status: 'suspended',
    planTier: 'spark',
    contactName: 'Tom Bauer',
    contactEmail: 'tom@oakhill.realty',
    createdAt: '2025-09-10T15:20:00Z',
    monthlyRevenue: 0,
    usage: {
      activeUsers: 0,
      seats: 5,
      aiCallsThisMonth: 0,
      aiCallsLimit: 8000,
      playbooksRun: 0,
      integrationsConnected: 2,
    },
    survey: {
      companyName: 'Oakhill Realty',
      industry: 'Real estate',
      companySize: '1-10',
      planTier: 'spark',
    },
  },
  {
    id: 'cli_prairie_dental',
    name: 'Prairie Dental Group',
    industry: 'Healthcare / Dental',
    status: 'onboarding',
    planTier: 'flow',
    contactName: 'Dr. Rachel Olsen',
    contactEmail: 'rolsen@prairiedental.com',
    createdAt: '2026-05-07T19:10:00Z',
    monthlyRevenue: 0,
    usage: {
      activeUsers: 0,
      seats: 18,
      aiCallsThisMonth: 0,
      aiCallsLimit: 25000,
      playbooksRun: 0,
      integrationsConnected: 0,
    },
    survey: {
      companyName: 'Prairie Dental Group',
      industry: 'Healthcare / Dental',
      companySize: '11-50',
      planTier: 'flow',
      industryRegulations: ['HIPAA'],
      dataResidency: 'us',
      auditNeeds: true,
    },
  },
]

export function getClient(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id)
}
