export { getClients, getClient, createClient, updateClient } from './clients'
export { getClientUsage, getAllUsageTotals } from './usage'
export { getClientInvoices } from './invoices'
export { getInfrastructureStatus } from './infrastructure'
export { getClientConfig, upsertClientConfig } from './config'
export { getClientSkills, getClientSkillCount } from './skills'
export {
  getCompanies,
  getCompany,
  findCompanyByName,
  searchCompaniesByName,
  createCompany,
  upsertCompanyByName,
  updateCompany,
  deleteCompany,
} from './companies'
export {
  getContacts,
  getContact,
  getContactWithCompany,
  getContactsForCompany,
  getContactByEmail,
  findCompanyIdsByEmailDomain,
  createContact,
  createContacts,
  updateContact,
  deleteContact,
  getContactStats,
} from './contacts'
export {
  logCorrespondence,
  getCorrespondenceForContact,
  getCorrespondenceForCompany,
  getLatestTouchByCompany,
  deleteCorrespondence,
} from './correspondence'
export {
  getOpportunities,
  getOpportunity,
  getOpenOpportunityForCompany,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_PRIORITIES,
  OPPORTUNITY_PLAN_TIERS,
  NON_CLOSED_STAGES,
} from './opportunities'
export { getAnalyticsSummary } from './analytics'
export { getLeads, getLead, updateLead, getLeadStats, LEAD_STATUSES } from './leads'
export {
  recordBeacon,
  getLatestBeacons,
  getRecentBeaconsByClient,
  getClientHealthOverview,
  evaluateHealth,
  DANGEROUS_CONFIG_KEYS,
  ALLOWED_PUBLIC_PORTS,
  SUSTAINED_LOAD_PER_CORE,
  SUSTAINED_LOAD_HISTORY,
} from './health-beacons'

export type { ClientCreateInput, ClientUpdateInput } from './mappers'
export type { UsageEvent, UsageSummary, DateRange } from './usage'
export type { Invoice, InvoiceStatus } from './invoices'
export type { InfrastructureRecord, ServiceStatus } from './infrastructure'
export type { ClientSkill, ClientSkillStatus } from './skills'
export type { Company, CompanyInput, CompanyUpdate, CompanyStatus } from './companies'
export type {
  Contact,
  ContactInput,
  ContactUpdate,
  ContactStatus,
  ContactWithCompany,
} from './contacts'
export type { Correspondence, CorrespondenceInput, CorrespondenceType } from './correspondence'
export type {
  Opportunity,
  OpportunityInput,
  OpportunityUpdate,
  OpportunityStage,
  OpportunityPriority,
  OpportunityPlanTier,
  OpportunityWithRelations,
} from './opportunities'
export type {
  AnalyticsSummary,
  DailyVisits,
  PathCount,
  ReferrerCount,
} from './analytics'
export type { Lead, LeadStatus, LeadSegment, LeadUpdate, LeadStats } from './leads'
export type {
  Beacon,
  BeaconInput,
  ClientHealth,
  HealthLight,
  ContainerStatus,
  GatewayState,
  PublicListener,
  LoadAvg,
  DangerousConfigKey,
} from './health-beacons'
export { getSecurityIncidents } from './security-incidents'
export type {
  SecurityIncident,
  IncidentSeverity,
  IncidentStatus,
} from './security-incidents'
