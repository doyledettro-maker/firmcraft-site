import type { LucideIcon } from 'lucide-react'
import { Phone, CalendarClock, ReceiptText, Globe, LayoutDashboard } from 'lucide-react'

/** A single Firmcraft module the rep can toggle in the pricing calculator. */
export type Module = {
  id: string
  name: string
  price: number
  icon: LucideIcon
  tagline: string
  /** Short label of the category it replaces. */
  replaces: string
  /** Named legacy tools in that category. */
  replacesTools: string
  /** Low/high monthly $ a contractor typically pays for the legacy stack it replaces. */
  legacyLow: number
  legacyHigh: number
  /** What the AI agent does once this capability is connected. */
  agentDoes: string
}

export const MODULES: Module[] = [
  {
    id: 'receptionist',
    name: 'AI Receptionist',
    price: 199,
    icon: Phone,
    tagline: 'Answers every call, 24/7 — and books the job instead of taking a message.',
    replaces: 'Live answering service',
    replacesTools: 'Ruby Receptionists, PATLive, Smith.ai, AnswerConnect',
    legacyLow: 200,
    legacyHigh: 500,
    agentDoes: 'Hermes picks up, qualifies the lead, checks the crew’s availability, and books the appointment on the spot.',
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Dispatch',
    price: 149,
    icon: CalendarClock,
    tagline: 'Auto-assigns jobs to the right crew. No manual dispatching.',
    replaces: 'Scheduling / dispatch software',
    replacesTools: 'Jobber, Housecall Pro, ServiceTitan, FieldEdge',
    legacyLow: 65,
    legacyHigh: 300,
    agentDoes: 'Hermes routes new jobs to open slots, reshuffles when a crew runs late, and texts the customer a heads-up.',
  },
  {
    id: 'invoicing',
    name: 'Invoicing & Payments',
    price: 99,
    icon: ReceiptText,
    tagline: 'Invoices go out the moment the job closes — and get paid faster.',
    replaces: 'Invoicing tools',
    replacesTools: 'QuickBooks Online, FreshBooks, Wave',
    legacyLow: 30,
    legacyHigh: 80,
    agentDoes: 'Hermes generates the invoice from the completed job, sends it, and chases the payment so nobody’s doing it at 9 PM.',
  },
  {
    id: 'portal',
    name: 'Customer Portal & Booking',
    price: 79,
    icon: Globe,
    tagline: 'A branded booking page customers actually use.',
    replaces: 'Booking tools',
    replacesTools: 'Calendly, Square Appointments, Thumbtack',
    legacyLow: 0,
    legacyHigh: 70,
    agentDoes: 'Hermes turns online requests into booked jobs and keeps the customer updated through completion.',
  },
  {
    id: 'dashboard',
    name: 'Office Dashboard',
    price: 49,
    icon: LayoutDashboard,
    tagline: 'See the whole operation at a glance — no spreadsheets.',
    replaces: 'Spreadsheets / manual reporting',
    replacesTools: 'Excel, Google Sheets, or nothing at all',
    legacyLow: 0,
    legacyHigh: 50,
    agentDoes: 'Hermes surfaces what needs attention — unbooked leads, overdue invoices, idle crews — before the owner has to ask.',
  },
]

export const SETUP_NOTE =
  'One-time setup: $500 per module, or $1,500 flat for three or more. Covers onboarding, configuration, phone number porting, data migration, and training.'

/* ---------- Pitch content ---------- */

export const ONE_LINERS: { angle: string; line: string }[] = [
  { angle: 'Cost', line: 'You’re paying for 5 different tools that don’t talk to each other — we replace them all for less.' },
  { angle: 'Pain', line: 'Your answering service takes a message. Ours books the job.' },
  { angle: 'Missed revenue', line: 'Every missed call is a lost job. Our AI picks up every time, 24/7.' },
  { angle: 'Simplicity', line: 'One platform instead of five apps. Everything your office needs in one place.' },
  { angle: 'AI', line: 'It’s like hiring an office manager for your business — except it’s $199 a month and it never calls in sick.' },
]

export const ELEVATOR_PITCH = `Hey [Name], this is Robert from Firmcraft. We work with contractors here in Houston. Most of the guys I talk to are paying $500 to $800 a month across four or five different tools — an answering service, Jobber or Housecall Pro, QuickBooks, maybe a booking page. None of it talks to each other. We built one AI-powered platform that replaces all of it — answers the phone, books the job, dispatches the crew, sends the invoice — for less than what they’re paying now. Can I show you a 15-minute demo?`

export const COLD_CALL_SCRIPT = `OPENING
"Hey [Name], this is Robert from Firmcraft. We're a tech company here in Houston that builds AI-powered tools for contractors. I'm not trying to sell you anything on this call — I just want to ask you a quick question."

QUESTION
"What are you using right now to manage your calls and scheduling? Do you have an answering service, or is it all going to your cell phone?"

(Listen. Whatever they say, acknowledge it. Then:)

PIVOT
"Got it. So what we built is basically one platform that handles all of that — answers the phone, books the job, sends the invoice — and it's less than what most guys are paying for just the answering service. Could I show you a quick demo? It's about 15 minutes."

IF THEY PUSH BACK
"Totally understand. Can I send you a quick email with the details so you have it when you're ready?"`

export type EmailTemplate = { id: string; name: string; subject: string; body: string }

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'replacement',
    name: 'The replacement pitch',
    subject: 'Quick question about your office tools, [First Name]',
    body: `Hey [First Name],

I work with contractors in Houston and I have a quick question — how many different apps does your office run on right now?

Most of the guys I talk to are paying for an answering service, scheduling software, invoicing, and a booking page. That's four or five bills a month for tools that don't even talk to each other.

We built Firmcraft to replace all of that with one platform. AI answers your phones and books the job. Scheduling and dispatch are automatic. Invoices go out when the job closes. And it all costs less than what you're paying now.

Worth a 15-minute look?

Robert Ayodele
Firmcraft | Client Operations
firmcraft.ai`,
  },
  {
    id: 'missed-call',
    name: 'The missed-call pitch',
    subject: 'What happens when you miss a call?',
    body: `Hey [First Name],

Every missed call is a job that goes to the next contractor on the list. And answering services just take a message — they can't book the job.

Firmcraft's AI answers your phone 24/7. It qualifies the lead, checks your crew's availability, and books the appointment on the spot. No hold times, no missed calls, no messages to return.

And it's $199/month — less than most answering services charge.

I can show you exactly how it works in 15 minutes.

Robert Ayodele
Firmcraft | Client Operations
firmcraft.ai`,
  },
  {
    id: 'follow-up',
    name: 'The short follow-up',
    subject: 'Re: [previous subject line]',
    body: `Hey [First Name],

Just circling back. We're working with a few contractors in Houston right now and I'd like to show you what we built.

15 minutes — I'll show you the AI phone system, the scheduling, and how it all connects. If it's not a fit, no hard feelings.

Robert Ayodele
Firmcraft | Client Operations
firmcraft.ai`,
  },
]

export const OBJECTIONS: { q: string; a: string }[] = [
  {
    q: 'I already have an answering service.',
    a: 'That’s actually perfect — that means you already know the value of never missing a call. The difference is, your answering service takes a message and you still have to call back. Ours books the job on the spot. And it’s probably cheaper than what you’re paying them.',
  },
  {
    q: 'I’m not a tech person.',
    a: 'Neither are most of our clients. We set everything up for you. Once it’s running, it’s simpler than what you have now — one app instead of five.',
  },
  {
    q: 'How does AI answer my phone?',
    a: 'It sounds like a real person. It knows your services, your hours, your pricing. It asks the right questions, checks your schedule, and books the appointment. If something’s too complex, it transfers to you or your office.',
  },
  {
    q: 'I don’t want to be locked in.',
    a: 'Month to month. No contracts. Cancel anytime. We keep your business by being worth it, not by locking you in.',
  },
  {
    q: 'It’s too expensive.',
    a: 'What are you paying right now for your answering service, scheduling, and invoicing? Add those up. We’re usually less — and you get an AI running the whole thing.',
  },
  {
    q: 'I need to think about it.',
    a: 'Totally fair. Can I send you a quick summary so you have the details? And I’ll check back in a week.',
  },
  {
    q: 'What if it doesn’t work?',
    a: 'We set it up, test it with you, and make sure it’s handling calls the way you want before we go live. And it’s month to month, so there’s no risk.',
  },
]

export const TARGET_TYPES: { type: string; note: string }[] = [
  { type: 'HVAC', note: 'High call volume, seasonal urgency, expensive answering services. Best fit for AI Receptionist.' },
  { type: 'Plumbers', note: 'Emergency calls 24/7, need fast dispatch. Huge pain if they miss a call at 2 AM.' },
  { type: 'Electricians', note: 'Mix of scheduled and emergency work. Scheduling + dispatch is a strong fit.' },
  { type: 'Roofers', note: 'Seasonal, project-based. Portal + booking helps them manage estimate requests.' },
  { type: 'General contractors', note: 'Multi-trade coordination. Dashboard + scheduling are the hooks.' },
  { type: 'Pest / landscaping / garage / pool', note: 'All qualify if they’re in Houston with 1–10 people.' },
]

export const IDEAL_SIGNALS: string[] = [
  'Google Business profile with a phone number (they get inbound calls)',
  'Reviews mention “hard to reach” or “didn’t return my call” (pain signal)',
  'Advertise on Thumbtack, Angi, or HomeAdvisor (paying for leads they might miss)',
  'Has a website but no online booking (gap Firmcraft fills)',
  '2–10 person operation (big enough to need tools, small enough to move fast)',
  'Already on Jobber, Housecall Pro, or similar (already paying for software)',
]

export const AVOID_SIGNALS: string[] = [
  'One-person operation with no phone volume (not enough pain)',
  '20+ employees with full office staff (likely on ServiceTitan, won’t switch)',
  'Outside the Houston metro area (we’re geo-focused for now)',
  'Non-trade businesses — no dental, medical, legal, or retail',
]
