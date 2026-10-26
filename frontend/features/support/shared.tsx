'use client'

import { PageHeader } from '@/components/ui/page-header'

export type TicketItem = {
  id: string
  subject: string
  customer: string
  company: string
  status: 'Open' | 'Pending' | 'Resolved'
  priority: 'Urgent' | 'High' | 'Normal'
  agent: string
  sla: string
  channel: 'Email' | 'Chat' | 'Phone'
  minutes: number
  satisfaction?: number
}

export const stages = ['Open', 'Pending', 'Resolved'] as const

export const slaTone = (minutes: number, status: string) =>
  status === 'Resolved'
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
    : minutes < 120
      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30'
      : minutes < 300
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'

export const cx = (...items: Array<string | false | undefined>) => items.filter(Boolean).join(' ')

export function Shell({
  children,
  title,
  eyebrow = 'Support',
  action,
  onAction,
}: {
  children: React.ReactNode
  title: string
  eyebrow?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="min-h-full p-5 lg:p-8">
      <PageHeader eyebrow={eyebrow} title={title} action={action} onAction={onAction} />
      {children}
    </div>
  )
}

export function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={cx(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
        tone === 'rose'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
          : tone === 'amber'
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
            : tone === 'emerald'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {children}
    </span>
  )
}

export function TicketCard({ ticket, selected, onClick }: { ticket: TicketItem; selected: boolean; onClick: () => void }) {
  return (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData('ticket', ticket.id)}
      onClick={onClick}
      className={cx('mb-2 w-full rounded-lg border bg-white p-3 text-left shadow-sm dark:bg-slate-900', selected ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-800')}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400">{ticket.id}</p>
        <Pill tone={ticket.priority === 'Urgent' ? 'rose' : ticket.priority === 'High' ? 'amber' : 'slate'}>{ticket.priority}</Pill>
      </div>
      <p className="mt-2 text-xs font-semibold">{ticket.subject}</p>
      <p className="mt-1 text-[11px] text-slate-500">{ticket.customer}</p>
      <div className={cx('mt-3 text-[11px] font-semibold', slaTone(ticket.minutes, ticket.status))}>{ticket.sla}</div>
    </button>
  )
}
