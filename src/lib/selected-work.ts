/**
 * Selected work, shared by /work and the homepage section.
 * Every fact here was confirmed by Doyle (Nov 26, 2026), including permission
 * to name each client. Do not add details that have not been confirmed.
 */
export type WorkEntry = {
  id: string
  kind: string
  title: string
  place?: string
  summary: string
  body: string[]
  link?: { href: string; label: string }
}

export const selectedWork: WorkEntry[] = [
  {
    id: 'rumble-bee-tree-service',
    kind: 'Client engagement',
    title: 'Rumble Bee Tree Service',
    place: 'Springfield, Illinois',
    summary:
      'A tree service business moved from paper to an AI agent the owner runs from his phone, and its capacity has tripled.',
    body: [
      'Before working with Firmcraft, the owner, Mike Carr, divided his time roughly equally among three things: tree work, administration, and hand-delivering contracts to customers. Most of the business ran on paper.',
      'Firmcraft mapped the administrative work and set up an AI agent for the business, hosted on a dedicated server and managed by Firmcraft, which the owner uses from his phone. Quotes, contracts, and invoicing now run electronically.',
      'The owner now works on the business full time and reports that the company’s capacity has tripled.',
    ],
  },
  {
    id: 'dental-practice',
    kind: 'Capability building',
    title: 'Dr. Sarah Carlson, dental practice',
    place: 'Burlington, Illinois',
    summary:
      'A dentist and practice partner who now automates a substantial share of her practice’s work herself.',
    body: [
      'Not every engagement ends with Firmcraft delivering a system. Dr. Sarah Carlson is a dentist and the primary partner of her practice. Firmcraft introduced her to the practical use of artificial intelligence, and she now automates a substantial share of the practice’s work herself.',
    ],
  },
  {
    id: 'ai-psm',
    kind: 'Platform architecture and build',
    title: 'AI-PSM',
    summary:
      'An agentic AI platform for process safety and asset integrity at oil refineries, designed and built by Doyle Dettro as Chief Technology Officer.',
    body: [
      'Doyle Dettro is Chief Technology Officer of AI-PSM, an agentic artificial intelligence platform for process safety and asset integrity at oil refineries. He designed and built the platform with Mike Marshall, PE, who brings the process safety expertise.',
      'The platform’s scoring runs on a deterministic rules engine that is checked against independent reference calculations. Its AI agents draft recommendations that a qualified person approves, and every action is recorded in an audit trail. The same controls carry into Firmcraft’s own deployments.',
    ],
    link: { href: 'https://ai-psm.com', label: 'ai-psm.com' },
  },
  {
    id: 'predictium',
    kind: 'Venture',
    title: 'Predictium',
    summary: 'A software-as-a-service business built on machine learning and operated with full automation.',
    body: [
      'Doyle Dettro founded Predictium, a software-as-a-service business built on machine learning and operated with full automation.',
    ],
  },
]
