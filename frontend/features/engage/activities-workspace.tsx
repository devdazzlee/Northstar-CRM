'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Mail, Phone, StickyNote, Tag } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogListQuery } from '@/hooks/use-catalog-query'
import { type Notify } from '@/lib/ui'
import { Shell } from './shared'

type ActivityRow = {
  id: string
  type?: string
  subject?: string
  body?: string | null
  actorName?: string | null
  occurredAt?: string
  createdAt?: string
}

function iconFor(type?: string) {
  const t = String(type || '').toLowerCase()
  if (t.includes('email')) return Mail
  if (t.includes('call')) return Phone
  if (t.includes('meeting')) return CalendarDays
  if (t.includes('stage')) return Tag
  return StickyNote
}

export function ActivitiesWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('activities')
  const [type, setType] = useState('All activity')
  const rows = (query.data ?? []) as ActivityRow[]

  const visible = useMemo(() => {
    if (type === 'All activity') return rows
    return rows.filter((row) => String(row.type || '').toLowerCase() === type.toLowerCase())
  }, [rows, type])

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Activities"
        description="A global feed of customer-facing and internal activity."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {['All activity', 'email', 'call', 'meeting', 'note'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item === 'All activity' ? 'All activity' : item)}
            className={`${
              type === item
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 text-slate-500 dark:border-slate-700'
            } rounded-full px-3 py-1.5 text-xs font-semibold`}
          >
            {item}
          </button>
        ))}
        <button type="button" onClick={() => void query.refetch()} className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
          Refresh
        </button>
      </div>
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading activities…"
        isEmpty={!query.isLoading && visible.length === 0}
        emptyTitle="No activity yet"
        emptyDescription="Activity notes and calls will show here."
        className="p-0"
      >
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {visible.map((row) => {
            const Icon = iconFor(row.type)
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => notify(row.subject || 'Activity opened')}
                className="flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left last:border-0 dark:border-slate-800"
              >
                <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{row.subject || row.type || 'Activity'}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.body || row.actorName || '—'}</p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {row.occurredAt || row.createdAt ? new Date(row.occurredAt || row.createdAt || '').toLocaleString() : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </QueryGate>
    </Shell>
  )
}
