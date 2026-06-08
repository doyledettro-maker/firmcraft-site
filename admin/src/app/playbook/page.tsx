import { Brain, Network, Sparkles, TrendingUp, UserCog } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PlaybookWorkspace } from '@/components/playbook/PlaybookWorkspace'

export const metadata = { title: 'Playbook · Firmcraft Admin' }

const AGENT_POINTS: { icon: typeof Brain; title: string; body: string }[] = [
  { icon: Brain, title: 'Remembers everything', body: 'Every call, job, and customer interaction — Hermes never forgets context the way a new hire would.' },
  { icon: UserCog, title: 'Learns the business', body: 'Your services, pricing, hours, and how you like things done. It gets sharper the longer it runs.' },
  { icon: Network, title: 'Orchestrates the tools', body: 'Phone, scheduling, invoicing, booking — Hermes ties them together so nobody copy-pastes between screens.' },
  { icon: TrendingUp, title: 'Gets smarter over time', body: 'The more you use it, the better it routes, books, and follows up. It compounds.' },
]

export default function PlaybookPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <div className="eyebrow">Playbook · Houston contractor market</div>
        <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
          Robert’s <em className="text-accent italic">sales playbook</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[620px] leading-relaxed">
          Your daily command center for outreach — the pricing calculator, scripts, objection handling, and who we
          target. Built to reference live on a call, not read once.
        </p>
      </div>

      {/* THE HERO: the AI agent */}
      <section className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.10] via-paper-2 to-paper-2 mb-8">
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            background:
              'radial-gradient(600px circle at 88% 0%, rgba(56,189,248,0.14), transparent 55%)',
          }}
        />
        <div className="relative px-6 md:px-8 py-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent-3">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="font-mono-warm text-[11px] uppercase tracking-[0.18em] text-accent-3">
              Lead with this — it’s the hero
            </span>
          </div>

          <h2 className="font-serif-warm text-[28px] md:text-[34px] leading-[1.1] tracking-[-0.02em] max-w-[760px]">
            The a la carte tools are what they <em className="text-accent-2 italic">replace</em>. Hermes — the AI
            operator — is what they <em className="text-accent-2 italic">can’t get anywhere else</em>.
          </h2>
          <p className="text-ink-2 text-[15px] leading-relaxed mt-4 max-w-[720px]">
            Don’t open by listing features. Open with the operator. Hermes is an AI office manager that runs the whole
            workflow — for a fraction of the cost of hiring one. The modules below are the capabilities it brings to the
            job; the agent is the reason it all works together.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {AGENT_POINTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-line-2 bg-paper/60 backdrop-blur px-4 py-4">
                <Icon className="w-5 h-5 text-accent-3" />
                <div className="text-[14px] font-medium text-ink mt-2.5">{title}</div>
                <p className="text-[12.5px] text-ink-2 mt-1 leading-snug">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-accent-2/30 bg-accent-2/[0.07] px-4 py-3.5">
            <p className="text-[14px] text-ink leading-snug">
              <span className="font-medium text-accent-2">Say it like this:</span> “It’s like hiring an office manager
              for your business — except it’s a fraction of the cost, it never calls in sick, and it gets smarter every
              week.”
            </p>
          </div>
        </div>
      </section>

      <PlaybookWorkspace />
    </AppShell>
  )
}
