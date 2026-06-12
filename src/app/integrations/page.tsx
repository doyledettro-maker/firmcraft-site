import type { Metadata } from 'next'
import { IntegrationsClient } from './IntegrationsClient'

export const metadata: Metadata = {
  title: 'Integrations — 112 Tools Your AI Operator Can Drive',
  description:
    'Firmcraft connects AI to the tools small businesses already use: QuickBooks, NetSuite, Eaglesoft, Dentrix, Clio, HubSpot, Salesforce, Jobber, ServiceTitan, Slack, Teams, and 100+ more. Custom connectors built in week one — API, REST shim, or browser-driven.',
  alternates: { canonical: '/integrations' },
}

export default function IntegrationsPage() {
  return <IntegrationsClient />
}
