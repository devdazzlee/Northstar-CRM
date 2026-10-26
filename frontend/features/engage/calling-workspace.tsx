'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { useContactsQuery } from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { type Notify } from '@/lib/ui'
import { pill, Shell } from './shared'

type CallRow = {
  id: string
  contactName?: string | null
  phone?: string | null
  direction?: string
  durationSec?: number | null
  outcome?: string | null
  notes?: string | null
  occurredAt?: string
  createdAt?: string
}

export function CallingWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('call-logs')
  const create = useCatalogCreateMutation('call-logs')
  const contactsQuery = useContactsQuery()
  const rows = (query.data ?? []) as CallRow[]
  const [dialer, setDialer] = useState(false)
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [outcome, setOutcome] = useState('Connected')

  const todayCount = rows.filter((row) => {
    const stamp = row.occurredAt || row.createdAt
    if (!stamp) return false
    return new Date(stamp).toDateString() === new Date().toDateString()
  }).length

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Calling"
        description="Log calls, keep context close, and follow up faster."
        action="Click to call"
        onAction={() => setDialer(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading call log…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No calls logged"
        emptyDescription="Log your first call from the dialer."
        emptyActionLabel="New call"
        onEmptyAction={() => setDialer(true)}
        className="p-0"
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-slate-800">
              <p className="text-sm font-semibold">Call log</p>
              <button type="button" onClick={() => setDialer(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                New call
              </button>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 border-b p-4 last:border-0 dark:border-slate-800">
                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Phone className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{row.contactName || 'Unknown contact'}</p>
                  <p className="text-xs text-slate-400">
                    {row.outcome || 'Logged'} · {typeof row.durationSec === 'number' ? `${row.durationSec}s` : '—'} ·{' '}
                    {row.phone || row.direction || 'outbound'}
                  </p>
                </div>
                <span className={pill}>{row.direction || 'outbound'}</span>
              </div>
            ))}
          </div>
          <aside className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold">Today&apos;s calling</p>
            <div className="mt-4 text-center">
              <p className="text-4xl font-semibold">{todayCount}</p>
              <p className="text-xs text-slate-400">calls completed</p>
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.min(100, (todayCount / 27) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{todayCount} of 27 daily goal</p>
          </aside>
        </div>
      </QueryGate>
      {dialer && (
        <Modal title="Click-to-call" onClose={() => setDialer(false)}>
          <div className="space-y-3">
            <label className="text-xs font-medium">
              Contact
              <select
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value)
                  const match = (contactsQuery.data ?? []).find((c) => c.name === e.target.value)
                  if (match?.phone) setPhone(match.phone)
                }}
              >
                <option value="">Select contact</option>
                {(contactsQuery.data ?? []).map((contact) => (
                  <option key={contact.id || contact.email} value={contact.name}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              Or name
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Phone
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Outcome
              <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option>Connected</option>
                <option>No answer</option>
                <option>Left voicemail</option>
                <option>Wrong number</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={create.isPending || !contactName.trim()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={async () => {
              try {
                await create.mutateAsync({
                  contactName: contactName.trim(),
                  phone: phone || undefined,
                  direction: 'outbound',
                  durationSec: outcome === 'Connected' ? 180 : 0,
                  outcome,
                  notes: 'Logged from calling workspace',
                  occurredAt: new Date().toISOString(),
                })
                notify('Call logged')
                setDialer(false)
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Could not log call')
              }
            }}
          >
            <Phone className="size-4" />
            {create.isPending ? 'Saving…' : 'Log call'}
          </button>
        </Modal>
      )}
    </Shell>
  )
}
