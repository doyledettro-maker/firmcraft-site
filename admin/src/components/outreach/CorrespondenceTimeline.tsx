'use client'

import {
  AlertCircle,
  Calendar,
  Mail,
  MailOpen,
  MousePointerClick,
  Phone,
  Reply,
  Send,
  StickyNote,
  UserX,
} from 'lucide-react'
import type { Correspondence, CorrespondenceType } from '@/lib/db/correspondence'

export const TIMELINE_META: Record<CorrespondenceType, { label: string; icon: React.ComponentType<{ className?: string }>; tint: string }> = {
  email_sent:         { label: 'Email sent',        icon: Send,               tint: 'text-blue-300' },
  email_opened:       { label: 'Email opened',      icon: MailOpen,           tint: 'text-blue-300' },
  email_clicked:      { label: 'Link clicked',      icon: MousePointerClick,  tint: 'text-emerald-300' },
  email_replied:      { label: 'Email reply',       icon: Reply,              tint: 'text-emerald-300' },
  email_bounced:      { label: 'Bounced',           icon: AlertCircle,        tint: 'text-rose-300' },
  email_unsubscribed: { label: 'Unsubscribed',      icon: UserX,              tint: 'text-rose-300' },
  call:               { label: 'Call',              icon: Phone,              tint: 'text-amber-300' },
  meeting:            { label: 'Meeting',           icon: Calendar,           tint: 'text-amber-300' },
  note:               { label: 'Note',              icon: StickyNote,         tint: 'text-muted' },
  sms:                { label: 'SMS',               icon: Mail,               tint: 'text-amber-300' },
}

export function TimelineRow({ entry }: { entry: Correspondence }) {
  const meta = TIMELINE_META[entry.type]
  const Icon = meta.icon
  const occurred = new Date(entry.occurredAt)
  return (
    <li className="relative">
      <span className="absolute -left-[30px] top-0.5 grid place-items-center w-6 h-6 rounded-full bg-paper border border-line">
        <Icon className={`w-3 h-3 ${meta.tint}`} />
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[13px] text-ink font-medium">{meta.label}</div>
        <div className="text-[11.5px] text-muted font-mono whitespace-nowrap">
          {occurred.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      {entry.subject ? (
        <div className="text-[13px] text-ink-2 mt-0.5">{entry.subject}</div>
      ) : null}
      {entry.body ? (
        <div className="text-[12.5px] text-ink-2 whitespace-pre-wrap mt-1 leading-relaxed">
          {entry.body}
        </div>
      ) : null}
      {Object.keys(entry.metadata).length > 0 && (entry.type === 'email_clicked' && entry.metadata.link_url) ? (
        <div className="text-[11.5px] text-muted font-mono mt-1 truncate">
          → {String(entry.metadata.link_url)}
        </div>
      ) : null}
    </li>
  )
}
