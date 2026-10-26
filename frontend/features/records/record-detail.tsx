'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Target,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import {
  useCreateTaskMutation,
  useTasksQuery,
  useUpdateContactStageMutation,
  useUpdateDealStageMutation,
  useUpdateLeadStatusMutation,
} from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import type { Company, Contact, Lead } from '@/lib/types'
import type { UiDeal } from '@/lib/api/mappers'

type RecordData = Contact | Company | Lead | UiDeal
export type RecordType = 'contact' | 'company' | 'lead' | 'deal'

type ActivityRow = {
  id: string
  type?: string
  subject?: string
  body?: string | null
  actorName?: string | null
  occurredAt?: string
  createdAt?: string
  relatedId?: string | null
  relatedType?: string | null
}

const TABS = ['Overview', 'Activity timeline', 'Notes', 'Tasks'] as const

function getName(record: RecordData) {
  return record.name
}

function getEmail(record: RecordData, type: RecordType) {
  if (type === 'company') return (record as Company).website || '—'
  return 'email' in record ? record.email || '—' : '—'
}

function getOwner(record: RecordData) {
  return 'owner' in record ? record.owner : '—'
}

function getStatus(record: RecordData, type: RecordType) {
  if (type === 'contact') return (record as Contact).stage
  if (type === 'deal') return (record as UiDeal).stage
  if (type === 'company') return 'Customer'
  return (record as Lead).status
}

function recordId(record: RecordData) {
  return 'id' in record && record.id ? String(record.id) : ''
}

export function RecordDetailDrawer({
  record,
  type,
  onClose,
  onOpenFull,
  onNotify,
  onConvert,
}: {
  record?: RecordData
  type: RecordType
  onClose: () => void
  onOpenFull: () => void
  onNotify: (message: string) => void
  onConvert?: (lead: Lead) => void
}) {
  if (!record) return null
  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <DetailHeader
          record={record}
          type={type}
          onClose={onClose}
          onOpenFull={onOpenFull}
          onNotify={onNotify}
          onConvert={onConvert}
          compact
        />
        <RecordBody record={record} type={type} onNotify={onNotify} />
      </aside>
    </div>
  )
}

export function RecordDetailPage({
  record,
  type,
  onBack,
  onNotify,
  onConvert,
}: {
  record?: RecordData
  type: RecordType
  onBack: () => void
  onNotify: (message: string) => void
  onConvert?: (lead: Lead) => void
}) {
  if (!record) {
    return (
      <div className="p-8">
        <EmptyRecord onBack={onBack} />
      </div>
    )
  }
  return (
    <div className="min-h-full p-5 lg:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="size-3.5" />
          Back to {type === 'company' ? 'companies' : `${type}s`}
        </button>
        <span>/</span>
        <span>{getName(record)}</span>
      </div>
      <DetailHeader
        record={record}
        type={type}
        onClose={onBack}
        onOpenFull={() => undefined}
        onNotify={onNotify}
        onConvert={onConvert}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_250px]">
        <ProfileCard record={record} type={type} onNotify={onNotify} />
        <RecordBody record={record} type={type} onNotify={onNotify} />
        <AsideCards record={record} type={type} onNotify={onNotify} />
      </div>
    </div>
  )
}

function DetailHeader({
  record,
  type,
  onClose,
  onOpenFull,
  onNotify,
  onConvert,
  compact,
}: {
  record: RecordData
  type: RecordType
  onClose: () => void
  onOpenFull: () => void
  onNotify: (message: string) => void
  onConvert?: (lead: Lead) => void
  compact?: boolean
}) {
  const createActivity = useCatalogCreateMutation('activities')
  const createCall = useCatalogCreateMutation('call-logs')
  const updateDeal = useUpdateDealStageMutation()
  const id = recordId(record)

  const logCall = async () => {
    try {
      await createCall.mutateAsync({
        contactName: getName(record),
        direction: 'outbound',
        durationSec: 0,
        outcome: 'Logged from record',
        notes: `Call started for ${getName(record)}`,
      })
      await createActivity.mutateAsync({
        type: 'call',
        subject: `Call · ${getName(record)}`,
        body: 'Outbound call logged from record detail',
        relatedType: type,
        relatedId: id || undefined,
        actorName: 'You',
        occurredAt: new Date().toISOString(),
      })
      onNotify('Call logged')
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Could not log call')
    }
  }

  const logEmail = async () => {
    try {
      await createActivity.mutateAsync({
        type: 'email',
        subject: `Email · ${getName(record)}`,
        body: `Email composer opened for ${getEmail(record, type)}`,
        relatedType: type,
        relatedId: id || undefined,
        actorName: 'You',
        occurredAt: new Date().toISOString(),
      })
      onNotify('Email activity logged')
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Could not log email')
    }
  }

  const winOrConvert = async () => {
    if (type === 'deal' && id) {
      try {
        await updateDeal.mutateAsync({ id, stage: 'Won' })
        onNotify('Deal marked as won')
      } catch (error) {
        onNotify(error instanceof ApiError ? error.message : 'Could not update deal')
      }
      return
    }
    if (type === 'lead' && onConvert) {
      onConvert(record as Lead)
      return
    }
    onNotify('Open Leads to convert this record')
  }

  return (
    <div
      className={`border-b border-slate-100 p-5 dark:border-slate-800 ${compact ? '' : 'rounded-xl border bg-white shadow-sm dark:bg-slate-900'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {type === 'company' ? (
            <Users className="size-5" />
          ) : type === 'deal' ? (
            <Target className="size-5" />
          ) : (
            <UserRound className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{getName(record)}</h1>
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {getStatus(record, type)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">
            {type === 'company'
              ? `${(record as Company).industry} · ${(record as Company).location}`
              : `${getEmail(record, type)} · Owner ${getOwner(record)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void logCall()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium dark:border-slate-700"
        >
          <Phone className="size-3.5" />
          Call
        </button>
        <button
          type="button"
          onClick={() => void logEmail()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium dark:border-slate-700"
        >
          <Mail className="size-3.5" />
          Email
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await createActivity.mutateAsync({
                type: 'meeting',
                subject: `Meeting · ${getName(record)}`,
                body: 'Meeting scheduled from record detail',
                relatedType: type,
                relatedId: id || undefined,
                actorName: 'You',
                occurredAt: new Date().toISOString(),
              })
              onNotify('Meeting logged')
            } catch (error) {
              onNotify(error instanceof ApiError ? error.message : 'Could not log meeting')
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium dark:border-slate-700"
        >
          <CalendarDays className="size-3.5" />
          Meeting
        </button>
        {!compact && (type === 'deal' || type === 'lead') && (
          <button
            type="button"
            onClick={() => void winOrConvert()}
            className="rounded-lg bg-indigo-600 px-2.5 py-2 text-xs font-semibold text-white"
          >
            {type === 'deal' ? 'Win deal' : 'Convert'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onNotify('More actions')}
          aria-label="More record actions"
          className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        {compact && (
          <button
            type="button"
            onClick={onOpenFull}
            className="ml-auto rounded-lg bg-indigo-600 px-2.5 py-2 text-xs font-semibold text-white"
          >
            Open full page
          </button>
        )}
      </div>
    </div>
  )
}

function ProfileCard({
  record,
  type,
  onNotify,
}: {
  record: RecordData
  type: RecordType
  onNotify: (message: string) => void
}) {
  const [status, setStatus] = useState(getStatus(record, type))
  const updateContact = useUpdateContactStageMutation()
  const updateLead = useUpdateLeadStatusMutation()
  const updateDeal = useUpdateDealStageMutation()
  const id = recordId(record)
  const busy = updateContact.isPending || updateLead.isPending || updateDeal.isPending

  const options =
    type === 'deal'
      ? ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']
      : type === 'lead'
        ? ['New', 'Working', 'Qualified', 'Hot', 'Converted', 'Unqualified']
        : ['Lead', 'Working', 'Qualified', 'Customer', 'Churned']

  const saveStatus = async (next: string) => {
    setStatus(next)
    if (!id) {
      onNotify('Missing record id')
      return
    }
    try {
      if (type === 'contact') await updateContact.mutateAsync({ id, stage: next })
      else if (type === 'lead') await updateLead.mutateAsync({ id, status: next })
      else if (type === 'deal') await updateDeal.mutateAsync({ id, stage: next })
      else {
        onNotify('Company status is derived')
        return
      }
      onNotify('Status updated')
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Status update failed')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Profile</p>
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {getName(record)
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{getName(record)}</p>
          <p className="truncate text-xs text-slate-500">
            {type === 'company'
              ? (record as Company).industry
              : 'title' in record
                ? (record as Contact).title || 'Revenue contact'
                : 'Revenue record'}
          </p>
        </div>
      </div>
      <label className="mt-4 block text-xs font-medium text-slate-500">
        Status
        <select
          value={status}
          disabled={busy || type === 'company'}
          onChange={(event) => void saveStatus(event.target.value)}
          className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"
        >
          {options.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
          <p className="text-[10px] text-slate-400">Owner</p>
          <p className="mt-1 text-xs font-semibold">{getOwner(record)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
          <p className="text-[10px] text-slate-400">Score</p>
          <p className="mt-1 text-xs font-semibold">
            {'score' in record
              ? `${(record as Lead).score}/100`
              : type === 'deal'
                ? `${(record as UiDeal).probability}%`
                : '—'}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contact info</p>
        <InfoRow icon={Mail} text={getEmail(record, type)} />
        <InfoRow
          icon={Phone}
          text={'phone' in record ? (record as Contact | Lead).phone || '—' : '—'}
        />
      </div>
    </section>
  )
}

function InfoRow({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
      <Icon className="size-3.5 text-slate-400" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <button type="button" aria-label={`Copy ${text}`} className="text-slate-400 hover:text-indigo-600">
        <Copy className="size-3" />
      </button>
    </div>
  )
}

function RecordBody({
  record,
  type,
  onNotify,
}: {
  record: RecordData
  type: RecordType
  onNotify: (message: string) => void
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [filter, setFilter] = useState('All')
  const [entry, setEntry] = useState('')
  const id = recordId(record)
  const activitiesQuery = useCatalogListQuery('activities')
  const createActivity = useCatalogCreateMutation('activities')
  const tasksQuery = useTasksQuery()

  const activities = useMemo(() => {
    const rows = (activitiesQuery.data ?? []) as ActivityRow[]
    return rows
      .filter((row) => {
        if (!id) return true
        return row.relatedId === id || row.subject?.includes(getName(record)) || row.body?.includes(getName(record))
      })
      .filter((row) => filter === 'All' || String(row.type || '').toLowerCase() === filter.toLowerCase())
  }, [activitiesQuery.data, filter, id, record])

  const tasks = useMemo(() => {
    const rows = tasksQuery.data ?? []
    const name = getName(record).toLowerCase()
    return rows.filter((task) => !name || task.record?.toLowerCase().includes(name) || task.title.toLowerCase().includes(name)).slice(0, 8)
  }, [tasksQuery.data, record])

  const logActivity = async () => {
    if (!entry.trim()) {
      onNotify('Write an update first')
      return
    }
    try {
      await createActivity.mutateAsync({
        type: 'note',
        subject: `Note on ${getName(record)}`,
        body: entry.trim(),
        relatedType: type,
        relatedId: id || undefined,
        actorName: 'You',
        occurredAt: new Date().toISOString(),
      })
      setEntry('')
      onNotify('Activity logged')
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'Could not log activity')
    }
  }

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3 dark:border-slate-800">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium ${tab === item ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {type === 'deal' && <DealSummary record={record as UiDeal} />}
      {type === 'company' && <CompanySummary record={record as Company} />}
      {tab === 'Overview' ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <MiniCard title="Activities" value={`${activities.length} linked`} icon={Sparkles} />
          <MiniCard
            title="Last activity"
            value={
              activities[0]
                ? `${activities[0].type || 'Note'} · ${formatWhen(activities[0].occurredAt || activities[0].createdAt)}`
                : 'None yet'
            }
            icon={Mail}
          />
          <MiniCard title="Open tasks" value={`${tasks.length} tasks`} icon={Users} />
          <MiniCard title="Record id" value={id ? id.slice(0, 8) : '—'} icon={Check} />
        </div>
      ) : tab === 'Tasks' ? (
        <div className="space-y-3 p-5">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500">No related tasks from the API.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 text-slate-500">
                  {task.status} · {task.due} · {task.assignee}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-5">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {['All', 'email', 'call', 'meeting', 'note'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item === 'All' ? 'All' : item)}
                className={`rounded-full px-2.5 py-1 text-[11px] ${filter === item || (item !== 'All' && filter === item) ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mb-5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <StickyNote className="mt-1 size-4 text-indigo-600" />
              <textarea
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
                placeholder="Log a note, call, or email…"
                className="min-h-16 flex-1 resize-none bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEntry('')} className="rounded-md px-2.5 py-1.5 text-xs text-slate-500">
                Cancel
              </button>
              <button
                type="button"
                disabled={createActivity.isPending}
                onClick={() => void logActivity()}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                {createActivity.isPending ? (
                  <GlobalLoader variant="inline" label="Saving…" />
                ) : (
                  <>
                    <Send className="size-3" />
                    Log activity
                  </>
                )}
              </button>
            </div>
          </div>
          <QueryGate
            isLoading={activitiesQuery.isLoading}
            isError={activitiesQuery.isError}
            error={activitiesQuery.error}
            onRetry={() => void activitiesQuery.refetch()}
            loadingLabel="Loading activity…"
            isEmpty={!activitiesQuery.isLoading && activities.length === 0}
            emptyTitle="No activity yet"
            emptyDescription="Log the first note on this record."
            className="p-0"
          >
            <div className="flex flex-col gap-5">
              {activities.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.subject || item.type || 'Activity'}</p>
                      <span className="text-[11px] text-slate-400">
                        {formatWhen(item.occurredAt || item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.body || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </QueryGate>
        </div>
      )}
    </section>
  )
}

function AsideCards({
  record,
  type,
  onNotify,
}: {
  record: RecordData
  type: RecordType
  onNotify: (message: string) => void
}) {
  const createTask = useCreateTaskMutation()
  const relatedCompany =
    type === 'company' ? getName(record) : 'company' in record ? String((record as Contact | Lead | UiDeal).company || '—') : '—'

  return (
    <aside className="flex flex-col gap-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <Sparkles className="size-4" />
          <p className="text-xs font-semibold">AI summary</p>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {getName(record)} ({getStatus(record, type)}) — next step is confirm timeline and send a tailored follow-up.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold">Quick task</p>
        <button
          type="button"
          disabled={createTask.isPending}
          onClick={async () => {
            try {
              await createTask.mutateAsync({
                title: `Follow up · ${getName(record)}`,
                due: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                assignee: getOwner(record) || 'You',
                record: getName(record),
                priority: 'Medium',
              })
              onNotify('Task created')
            } catch (error) {
              onNotify(error instanceof ApiError ? error.message : 'Could not create task')
            }
          }}
          className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600"
        >
          <Plus className="size-3.5" />
          {createTask.isPending ? 'Saving…' : 'Add follow-up task'}
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold">Related</p>
        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">
          <p>Company · {relatedCompany}</p>
          <p>Type · {type}</p>
          <p>Id · {recordId(record).slice(0, 8) || '—'}</p>
        </div>
      </div>
    </aside>
  )
}

function MiniCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Check }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <Icon className="size-4 text-indigo-600" />
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function DealSummary({ record }: { record: UiDeal }) {
  return (
    <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-4 dark:border-slate-800">
      <MiniStat label="Value" value={record.amount} />
      <MiniStat label="Probability" value={`${record.probability}%`} />
      <MiniStat label="Expected close" value={record.closeDate || '—'} />
      <MiniStat label="Product" value={record.product || '—'} />
    </div>
  )
}

function CompanySummary({ record }: { record: Company }) {
  return (
    <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-4 dark:border-slate-800">
      <MiniStat label="Employees" value={record.size} />
      <MiniStat label="Revenue" value={record.revenue} />
      <MiniStat label="Contacts" value={String(record.contacts)} />
      <MiniStat label="Deals" value={String(record.deals)} />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function EmptyRecord({ onBack }: { onBack: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <FileText className="mx-auto size-8 text-slate-400" />
      <h1 className="mt-3 text-base font-semibold">Record not found</h1>
      <p className="mt-1 text-sm text-slate-500">This record may have been removed or is not in the current cache.</p>
      <button type="button" onClick={onBack} className="mt-5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
        Back to records
      </button>
    </div>
  )
}

function formatWhen(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
