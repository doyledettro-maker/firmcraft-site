import type { SurveyData } from './survey'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

/**
 * A survey submitted by a partner on behalf of a prospective client.
 * These flow into the admin Submissions queue for Firmcraft to review
 * and convert into a tenant.
 *
 * Currently mock-only — the real backend will replace this with a
 * persistent store. Submissions submitted by clients themselves
 * via firmcraft.ai/get-started will share the same shape with
 * `partnerId === null`.
 */
export type PartnerSubmission = {
  id: string
  partnerId: string | null
  /** ISO timestamp of when the partner submitted. */
  submittedAt: string
  status: SubmissionStatus
  /** Free-text note the partner can attach for the Firmcraft team. */
  partnerNote?: string
  /** Partial because partners can submit drafts; review tool fills gaps. */
  survey: Partial<SurveyData>
}

export const mockPartnerSubmissions: PartnerSubmission[] = [
  {
    id: 'sub_2026_05_01',
    partnerId: 'prt_north_ridge',
    submittedAt: '2026-05-09T14:22:00Z',
    status: 'pending',
    partnerNote:
      'Mid-size IP firm in Boston. Ready to move quickly — wants to start onboarding by end of month.',
    survey: {
      companyName: 'Beacon IP Partners',
      industry: 'Legal services',
      companySize: '11-50',
      website: 'https://beaconip.com',
      primaryContactName: 'Lena Forsythe',
      primaryContactEmail: 'lena@beaconip.com',
      primaryContactRole: 'Director of Operations',
      planTier: 'flow',
      implementationTimeline: '30-days',
      industryRegulations: ['Attorney-client privilege', 'State bar rules'],
      dataResidency: 'us',
      auditNeeds: true,
    },
  },
]
