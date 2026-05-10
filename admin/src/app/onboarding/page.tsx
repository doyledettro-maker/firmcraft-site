import Link from 'next/link'
import { ExternalLink, Inbox, FileText, Eye, Handshake } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import { mockPartnerSubmissions } from '@/lib/partner-submissions'
import { getPartner } from '@/lib/mock-partners'
import { formatDate } from '@/lib/format'

export const metadata = {
  title: 'Submissions · Firmcraft Admin',
}

export default function SubmissionsPage() {
  const submissions = mockPartnerSubmissions
  const pending = submissions.filter((s) => s.status === 'pending')
  return (
    <AppShell>
      <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
        <div>
          <div className="eyebrow">Onboarding submissions</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            Review submitted <em className="text-accent italic">surveys</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[640px] leading-relaxed">
            Clients fill out the onboarding survey on the public site. Once the
            backend wiring lands, every submission will appear in the queue
            below for review.
          </p>
        </div>
        <a
          href="https://firmcraft.ai/get-started"
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="ghost">
            <ExternalLink className="w-4 h-4" />
            Open client form
          </Button>
        </a>
      </div>

      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-paper-2 grid place-items-center flex-none">
              <Inbox className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif-warm text-[20px] tracking-[-0.01em] m-0">
                {pending.length === 0
                  ? 'Inbox is empty.'
                  : `${pending.length} submission${pending.length === 1 ? '' : 's'} waiting for review.`}
              </h3>
              <p className="text-ink-2 text-[14px] leading-relaxed mt-1">
                Surveys flow in from two places: clients filling out{' '}
                <code className="font-mono-warm text-[12.5px] bg-paper-2 px-1.5 py-0.5 rounded">
                  firmcraft.ai/get-started
                </code>{' '}
                directly, or partners submitting on a client&rsquo;s behalf
                through the partner portal. Both land in the queue below.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link href="/clients">
                  <Button variant="ghost" size="sm">All clients</Button>
                </Link>
                <Link href="/partners">
                  <Button variant="ghost" size="sm">
                    <Handshake className="w-4 h-4" />
                    Partners
                  </Button>
                </Link>
                <a
                  href="https://firmcraft.ai/get-started"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm">
                    <FileText className="w-4 h-4" />
                    Open the client-facing form
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="px-6 py-5 border-b border-line flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="eyebrow">Pending review</div>
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">
              Submission queue
            </h3>
          </div>
          <Link href="/onboarding/preview">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
              Preview review tool
            </Button>
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-paper-2 grid place-items-center mx-auto mb-4">
              <Inbox className="w-5 h-5 text-muted" />
            </div>
            <h4 className="font-serif-warm text-[20px] tracking-[-0.01em] m-0">
              No submissions yet.
            </h4>
            <p className="text-ink-2 text-[13.5px] leading-relaxed max-w-[420px] mx-auto mt-2">
              When a client finishes the survey at firmcraft.ai/get-started,
              it&rsquo;ll show up here for review. Until the storage backend is
              wired, watch the marketing site server logs.
            </p>
            <div className="mt-5 flex justify-center">
              <Link href="/onboarding/preview">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                  See what a submission looks like
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((s) => {
              const partner = s.partnerId ? getPartner(s.partnerId) : null
              return (
                <li key={s.id} className="px-6 py-5 flex items-start gap-4 hover:bg-paper-2/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-paper-2 grid place-items-center flex-none">
                    {partner ? (
                      <Handshake className="w-4 h-4 text-accent-2" />
                    ) : (
                      <FileText className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-ink">
                        {s.survey.companyName ?? 'Unnamed company'}
                      </div>
                      <Badge tone="amber">{s.status}</Badge>
                      {partner ? (
                        <Badge tone="green">via {partner.name}</Badge>
                      ) : (
                        <Badge>direct</Badge>
                      )}
                    </div>
                    <div className="text-[12.5px] text-muted mt-0.5">
                      {[s.survey.industry, s.survey.companySize, s.survey.primaryContactEmail]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {s.partnerNote ? (
                      <p className="text-[13px] text-ink-2 mt-2 max-w-[640px]">
                        <span className="text-muted">Note:</span> {s.partnerNote}
                      </p>
                    ) : null}
                    <div className="text-[11.5px] text-muted mt-2 font-mono-warm">
                      submitted {formatDate(s.submittedAt)} · id {s.id}
                    </div>
                  </div>
                  <Link href="/onboarding/preview">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                      Review
                    </Button>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  )
}
