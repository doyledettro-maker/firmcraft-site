import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { GetStartedClient } from './GetStartedClient'
import { InvitationRequired } from './InvitationRequired'
import {
  fetchToken,
  fetchCompanyAnswers,
  type TokenStatus,
} from '@/lib/survey-tokens'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Get started · Firmcraft',
  description:
    'Tell us about your business so we can scope your AI operator. Token-gated onboarding survey.',
}

type SearchParams = { t?: string }

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const rawToken = typeof searchParams.t === 'string' ? searchParams.t.trim() : ''

  let status: TokenStatus
  try {
    status = await fetchToken(rawToken)
  } catch (err) {
    console.error('[get-started/page] token lookup failed', err)
    status = { ok: false, reason: 'unknown' }
  }

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden pt-16 pb-8">
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[200px] w-[560px] h-[560px] rounded-full pointer-events-none opacity-55"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.08),transparent 60%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[160px] -left-[160px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-45"
          style={{ background: 'radial-gradient(circle,rgba(44,107,240,0.05),transparent 60%)' }}
        />

        <div className="relative max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase mb-3.5">
            <Link href="/" className="text-signal hover:underline underline-offset-[3px]">
              ← Back to home
            </Link>
            &nbsp;·&nbsp; Get started
          </div>
          <div className="eyebrow">Client onboarding survey</div>
          <h1 className="font-sans font-medium text-[clamp(40px,4.6vw,64px)] leading-[1.04] tracking-[-0.022em] mt-3 mb-4 text-balance ">
            {status.ok ? (
              <>
                Welcome, <em>{status.token.company_name}.</em>
              </>
            ) : (
              <>
                Tell us about your <em>business.</em>
              </>
            )}
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-2 max-w-[640px] m-0 mb-2">
            {status.ok
              ? 'Ten short sections. Some are shared across your team, some are just for you. We use this to scope your operator and have something running by the end of week one.'
              : 'This survey is invitation-only — each company gets a unique link from Firmcraft.'}
          </p>
        </div>
      </section>

      <section
        className="pb-24"
        style={{ background: 'linear-gradient(180deg,var(--color-surface),var(--color-surface-2))' }}
      >
        <div className="max-w-[1080px] mx-auto px-8">
          {status.ok ? (
            <GetStartedClient
              token={status.token.token}
              companyName={status.token.company_name}
              initialCompanyAnswers={await fetchCompanyAnswers(status.token.token)}
            />
          ) : (
            <InvitationRequired reason={status.reason} />
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
