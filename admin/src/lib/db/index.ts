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
  deleteCorrespondence,
} from './correspondence'

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
