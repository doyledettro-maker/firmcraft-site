import Link from 'next/link'
import { ArrowUpRight, BookOpen, ExternalLink, LifeBuoy, MessageSquare, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { ServiceStatusList } from '@/components/ServiceStatusList'
import { SupportContactForm } from '@/components/SupportContactForm'

export const metadata = {
  title: 'Support · Firmcraft Admin',
}

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is Firmcraft?',
    a: 'Firmcraft is an AI operator service that runs custom agents for professional services firms. We host the LLM gateway (LiteLLM), observability (Langfuse), and the Hermes sales agent on our infrastructure, then plug them into your firm’s tools.',
  },
  {
    q: 'Where do I see traces and token usage?',
    a: 'Every model call routes through LiteLLM and is logged to Langfuse. Open Langfuse at langfuse.firmcraft.ai with your team SSO to see traces, evals, and per-feature spend.',
  },
  {
    q: 'A model call failed — where do I look first?',
    a: 'Check the Status page (/status) to confirm LiteLLM and Langfuse are up. If both are green, open the Langfuse trace for the failed call — error details and retries are captured there. For repeat failures, file a ticket with the trace ID.',
  },
  {
    q: 'How do I rotate an API key?',
    a: 'For LiteLLM virtual keys, ask the Firmcraft team via this support form (high priority). We rotate inside the LiteLLM admin UI and re-issue the key over a secure channel within one business hour.',
  },
  {
    q: 'What’s the response SLA?',
    a: 'Urgent (production down): under 30 minutes during business hours, under 2 hours outside. High: same business day. Normal: within 2 business days. Low: best effort.',
  },
  {
    q: 'How do I onboard a new client?',
    a: 'Use the Onboarding wizard in this admin (left nav → Onboarding). It walks the firm through intake, model selection, and provisioning. Stripe products are pre-wired for the four tier prices.',
  },
  {
    q: 'Where is billing handled?',
    a: 'Stripe (live mode). Subscriptions are managed under each client’s record on the Clients page. The Firmcraft tier prices live in the Stripe dashboard and were provisioned in the latest billing commit.',
  },
]

const DOCS: { title: string; description: string; href: string }[] = [
  {
    title: 'Architecture overview',
    description: 'How LiteLLM, Langfuse, and Hermes fit together.',
    href: 'https://github.com/doyledettro-maker/firmcraft-site/tree/main/docs',
  },
  {
    title: 'LiteLLM admin',
    description: 'Manage virtual keys, model routing, rate limits.',
    href: 'https://llm.firmcraft.ai/ui',
  },
  {
    title: 'Langfuse',
    description: 'Traces, evals, prompts, dashboards.',
    href: 'https://langfuse.firmcraft.ai',
  },
  {
    title: 'Hermes agent',
    description: 'The Firmcraft sales / intake agent.',
    href: 'https://firmcraft.firmcraft.ai',
  },
  {
    title: 'Public status page',
    description: 'Live operational status — share with clients.',
    href: '/status',
  },
]

export default function SupportPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <div className="eyebrow">Support center</div>
        <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
          We’re here to <em className="text-accent italic">help</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[600px] leading-relaxed">
          Service health, common questions, documentation, and a direct line to the Firmcraft team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: status + faq */}
        <div className="lg:col-span-2 grid gap-6">
          {/* Service status */}
          <Card>
            <div className="px-6 py-5 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-ink-2" />
                <div>
                  <div className="eyebrow">System status</div>
                  <h2 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">Firmcraft services</h2>
                </div>
              </div>
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
              >
                Public status
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardBody>
              <ServiceStatusList intervalMs={60_000} />
            </CardBody>
          </Card>

          {/* FAQ */}
          <Card>
            <div className="px-6 py-5 border-b border-line flex items-center gap-2.5">
              <LifeBuoy className="w-4 h-4 text-ink-2" />
              <div>
                <div className="eyebrow">Knowledge base</div>
                <h2 className="font-serif-warm text-[22px] tracking-[-0.01em] mt-1">Frequently asked</h2>
              </div>
            </div>
            <CardBody className="px-6 py-2">
              <ul className="divide-y divide-line">
                {FAQ.map((item) => (
                  <li key={item.q} className="py-4">
                    <details className="group">
                      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                        <span className="font-medium text-ink leading-snug">{item.q}</span>
                        <span className="font-mono-warm text-[12px] text-muted mt-0.5 group-open:rotate-180 transition-transform">
                          ▾
                        </span>
                      </summary>
                      <p className="text-[14.5px] text-ink-2 mt-3 leading-relaxed">{item.a}</p>
                    </details>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT: docs + contact */}
        <div className="grid gap-6 content-start">
          {/* Docs */}
          <Card>
            <div className="px-6 py-5 border-b border-line flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-ink-2" />
              <div>
                <div className="eyebrow">Documentation</div>
                <h2 className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1">Resources</h2>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {DOCS.map((doc) => {
                const external = doc.href.startsWith('http')
                const linkClass =
                  'flex items-start justify-between gap-3 px-6 py-4 hover:bg-paper-2 transition-colors'
                const inner = (
                  <>
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{doc.title}</div>
                      <div className="text-[12.5px] text-muted leading-snug mt-0.5">{doc.description}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted flex-none mt-1" />
                  </>
                )
                return (
                  <li key={doc.title}>
                    {external ? (
                      <a href={doc.href} target="_blank" rel="noreferrer" className={linkClass}>
                        {inner}
                      </a>
                    ) : (
                      <Link href={doc.href} className={linkClass}>
                        {inner}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Contact */}
          <Card>
            <div className="px-6 py-5 border-b border-line flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-ink-2" />
              <div>
                <div className="eyebrow">Direct line</div>
                <h2 className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1">Open a ticket</h2>
              </div>
            </div>
            <CardBody>
              <p className="text-[13.5px] text-ink-2 leading-relaxed mb-5">
                Talk to a Firmcraft operator. Submissions log to the console for now and will route to email + ticketing once
                wiring lands.
              </p>
              <SupportContactForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
