export { getClients, getClient, createClient, updateClient } from './clients'
export { getClientUsage, getAllUsageTotals } from './usage'
export { getClientInvoices } from './invoices'
export { getInfrastructureStatus } from './infrastructure'
export { getClientConfig, upsertClientConfig } from './config'
export { getClientSkills, getClientSkillCount } from './skills'
export {
  getProspects,
  getProspect,
  createProspects,
  updateProspect,
  getProspectStats,
} from './prospects'
export { logTrackingEvent, getEventsForProspect } from './tracking'

export type { ClientCreateInput, ClientUpdateInput } from './mappers'
export type { UsageEvent, UsageSummary, DateRange } from './usage'
export type { Invoice, InvoiceStatus } from './invoices'
export type { InfrastructureRecord, ServiceStatus } from './infrastructure'
export type { ClientSkill, ClientSkillStatus } from './skills'
export type { Prospect, ProspectStatus, ProspectInput, ProspectUpdate } from './prospects'
export type { TrackingEvent, TrackingEventType } from './tracking'
