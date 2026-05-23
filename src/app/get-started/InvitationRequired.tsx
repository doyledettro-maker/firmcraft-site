type Reason = 'missing' | 'unknown' | 'expired' | 'revoked'

const COPY: Record<Reason, { headline: string; body: string }> = {
  missing: {
    headline: "You need an invitation link.",
    body: "This survey is invitation-only. Your Firmcraft contact will send you a link that looks like firmcraft.ai/get-started?t=ust-… — open that to begin.",
  },
  unknown: {
    headline: "We don't recognize that invitation.",
    body: "The token in your URL doesn't match anything on our end. Double-check the link your Firmcraft contact sent — it might have been truncated by your email client.",
  },
  expired: {
    headline: "This invitation has expired.",
    body: "Reach out to your Firmcraft contact and we'll send you a fresh link.",
  },
  revoked: {
    headline: "This invitation has been revoked.",
    body: "If that was unexpected, get in touch with your Firmcraft contact and we'll sort it out.",
  },
}

export function InvitationRequired({ reason }: { reason: Reason }) {
  const copy = COPY[reason]
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-[18px] p-8 sm:p-12 flex flex-col gap-5 max-w-[640px] mx-auto">
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-signal font-medium">
        Invitation required
      </div>
      <h2 className="font-sans font-medium text-[clamp(26px,3vw,38px)] leading-[1.1] tracking-[-0.015em] m-0 ">
        {copy.headline}
      </h2>
      <p className="text-[16px] leading-[1.6] text-ink-2 m-0">{copy.body}</p>
      <div className="flex flex-wrap gap-3 mt-2">
        <a href="/" className="btn btn-ghost">
          ← Back to home
        </a>
        <a href="mailto:hello@firmcraft.ai?subject=Onboarding%20survey%20invitation" className="btn btn-primary">
          Email Firmcraft →
        </a>
      </div>
    </div>
  )
}
