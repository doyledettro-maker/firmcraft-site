import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Card, CardBody, FieldGroup, Field, Input, Label, Select } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { getClient, mockClients } from '@/lib/mock-clients'

export function generateStaticParams() {
  return mockClients.map((c) => ({ id: c.id }))
}

export default function ClientSettingsPage({ params }: { params: { id: string } }) {
  const client = getClient(params.id)
  if (!client) notFound()

  return (
    <AppShell>
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> {client.name}
      </Link>

      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <div className="eyebrow">Client settings</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            {client.name} <em className="text-accent italic">/ settings</em>
          </h1>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="grid gap-6 max-w-[800px]">
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em]">General</h3>
            <p className="text-[13px] text-muted mt-1">Tenant identity and contacts.</p>
          </div>
          <CardBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Display name</Label>
                <Input id="name" defaultValue={client.name} />
              </Field>
              <Field>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" defaultValue={client.industry} />
              </Field>
              <Field>
                <Label htmlFor="contactName">Primary contact</Label>
                <Input id="contactName" defaultValue={client.contactName} />
              </Field>
              <Field>
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input id="contactEmail" type="email" defaultValue={client.contactEmail} />
              </Field>
            </FieldGroup>
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em]">Subscription</h3>
            <p className="text-[13px] text-muted mt-1">Plan, billing, and limits.</p>
          </div>
          <CardBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="plan">Plan tier</Label>
                <Select id="plan" defaultValue={client.planTier}>
                  <option value="spark">Spark — $399/mo</option>
                  <option value="flow">Flow — $799/mo</option>
                  <option value="forge">Forge — $1,499/mo</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="status">Account status</Label>
                <Select id="status" defaultValue={client.status}>
                  <option value="onboarding">Onboarding</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="seats">Seat limit</Label>
                <Input id="seats" type="number" defaultValue={client.usage.seats} />
              </Field>
              <Field>
                <Label htmlFor="callLimit">AI call limit / mo</Label>
                <Input id="callLimit" type="number" defaultValue={client.usage.aiCallsLimit} />
              </Field>
            </FieldGroup>
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif-warm text-[22px] tracking-[-0.01em]">Tenant configuration</h3>
            <p className="text-[13px] text-muted mt-1">
              Slack workspace, model routing, integrations. (Stubbed — wiring lands when LiteLLM + Stripe are connected.)
            </p>
          </div>
          <CardBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="slackWorkspace">Slack workspace ID</Label>
                <Input id="slackWorkspace" placeholder="T01234567" />
              </Field>
              <Field>
                <Label htmlFor="modelRouting">Default model</Label>
                <Select id="modelRouting" defaultValue="claude-sonnet-4-6">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-opus-4-7">Claude Opus 4.7</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="region">Data region</Label>
                <Select id="region" defaultValue="us">
                  <option value="us">United States</option>
                  <option value="eu">European Union</option>
                  <option value="apac">Asia-Pacific</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="auditLog">Audit log retention</Label>
                <Select id="auditLog" defaultValue="90">
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">365 days</option>
                </Select>
              </Field>
            </FieldGroup>
          </CardBody>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted">Changes are local to this prototype — backend wiring lands later.</p>
          <div className="flex gap-3">
            <Link href={`/clients/${client.id}`}><Button variant="ghost">Cancel</Button></Link>
            <Button>Save changes</Button>
          </div>
        </div>

        <Card className="border-[#A23B1F]/30">
          <div className="px-6 py-5 border-b border-[#A23B1F]/20">
            <h3 className="font-serif-warm text-[20px] text-[#A23B1F] tracking-[-0.01em]">Danger zone</h3>
            <p className="text-[13px] text-ink-2 mt-1">
              Irreversible actions. Confirmation will be required when wired up.
            </p>
          </div>
          <CardBody className="grid gap-3 sm:grid-cols-2">
            <Button variant="danger" className="justify-start">Suspend tenant</Button>
            <Button variant="danger" className="justify-start">Delete tenant + data</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
