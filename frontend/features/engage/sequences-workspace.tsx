'use client'

import { useEffect, useMemo, useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { useLeadsQuery } from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { enrollSequenceApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { pill, Shell } from './shared'

type SequenceRow = {
  id: string
  name?: string
  status?: string
  steps?: unknown
  enrolledCount?: number
}

function parseSteps(steps: unknown): Array<{ type: string; title: string }> {
  if (Array.isArray(steps)) {
    return steps.map((step, index) => {
      if (typeof step === 'string') return { type: 'Step', title: step }
      if (step && typeof step === 'object') {
        const obj = step as Record<string, unknown>
        return {
          type: String(obj.type ?? 'Step'),
          title: String(obj.title ?? obj.name ?? `Step ${index + 1}`),
        }
      }
      return { type: 'Step', title: `Step ${index + 1}` }
    })
  }
  return [
    { type: 'Email', title: 'Send welcome email' },
    { type: 'Wait', title: 'Wait 2 business days' },
    { type: 'Call task', title: 'Create call task' },
  ]
}

export function SequencesWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('sequences')
  const create = useCatalogCreateMutation('sequences')
  const update = useCatalogUpdateMutation('sequences')
  const leadsQuery = useLeadsQuery()
  const rows = (query.data ?? []) as SequenceRow[]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [enroll, setEnroll] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id)
  }, [rows, selectedId])

  const current = rows.find((row) => row.id === selectedId) ?? rows[0]
  const steps = useMemo(() => parseSteps(current?.steps), [current?.steps])

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Sequences"
        description="Build thoughtful multi-step outreach with clear exit conditions."
        action="Enroll contacts"
        onAction={() => setEnroll(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading sequences…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No sequences yet"
        emptyDescription="Create a sequence to start multi-step outreach."
        emptyActionLabel="Create sequence"
        onEmptyAction={() => setShowCreate(true)}
        className="p-0"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedId === row.id ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-500 dark:border-slate-700'}`}
            >
              {catalogRecordLabel(row)}
            </button>
          ))}
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700">
            + New
          </button>
        </div>
        {current && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={pill}>{step.type}</span>
                      <p className="text-sm font-semibold">{step.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{current.enrolledCount ?? 0} enrolled</p>
                  </div>
                  <MoreHorizontal className="size-4 text-slate-400" />
                </div>
              ))}
              <button
                type="button"
                onClick={async () => {
                  const next = [...steps, { type: 'Email', title: 'Follow-up email' }]
                  try {
                    await update.mutateAsync({ id: current.id, body: { steps: next } })
                    notify('Sequence step added')
                  } catch (error) {
                    notify(error instanceof ApiError ? error.message : 'Could not add step')
                  }
                }}
                className="w-full rounded-xl border border-dashed border-slate-300 p-4 text-xs font-semibold text-slate-500 dark:border-slate-700"
              >
                <Plus className="mr-2 inline size-4" />
                Add step
              </button>
            </div>
            <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold">{catalogRecordLabel(current)}</p>
              <p className="text-xs text-slate-500">Status: {current.status || 'Active'}</p>
              <p className="text-xs text-slate-500">Enrolled: {current.enrolledCount ?? 0}</p>
            </aside>
          </div>
        )}
      </QueryGate>
      {showCreate && (
        <Modal title="Create sequence" onClose={() => setShowCreate(false)}>
          <label className="text-xs font-medium">
            Name
            <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button
            type="button"
            disabled={create.isPending || name.trim().length < 2}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            onClick={async () => {
              try {
                const row = await create.mutateAsync({
                  name: name.trim(),
                  status: 'Active',
                  steps: parseSteps(undefined),
                  enrolledCount: 0,
                })
                setSelectedId(String(row.id ?? ''))
                setShowCreate(false)
                setName('')
                notify('Sequence created')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
          >
            Create
          </button>
        </Modal>
      )}
      {enroll && current && (
        <Modal title="Enroll contacts" onClose={() => setEnroll(false)}>
          <p className="text-sm text-slate-500">Select a lead to enroll in {catalogRecordLabel(current)}.</p>
          <select className="mt-4 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">Select lead</option>
            {(leadsQuery.data ?? []).map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} · {lead.company}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!leadId}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={async () => {
              try {
                await enrollSequenceApi({ sequenceId: current.id, leadId })
                await query.refetch()
                notify('Lead enrolled')
                setEnroll(false)
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Enrollment failed')
              }
            }}
          >
            Enroll
          </button>
        </Modal>
      )}
    </Shell>
  )
}
