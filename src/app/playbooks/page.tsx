import type { Metadata } from 'next'
import { PlaybooksClient } from './PlaybooksClient'

export const metadata: Metadata = {
  title: 'AI Playbooks for Small Business — 40 Live Automations',
  description:
    '40 production AI playbooks for trades, healthcare, professional firms, and B2B: certificate of insurance on demand, insurance claim submission, invoice chase, crew dispatch, Google reviews flywheel, and more. Custom playbooks built in week one.',
  alternates: { canonical: '/playbooks' },
}

export default function PlaybooksPage() {
  return <PlaybooksClient />
}
