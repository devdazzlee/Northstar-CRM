'use client'

import { useEffect, useState } from 'react'
import { MoreHorizontal, Plus, Settings2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { type Notify } from '@/lib/ui'
import { pill, Shell } from './shared'

type FormRow = {
  id: string
  name?: string
  status?: string
  fields?: unknown
  submissions?: number | null
  embedCode?: string | null
}

function asFields(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return ['Name', 'Email', 'Company']
}

export function FormsWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('lead-forms')
  const create = useCatalogCreateMutation('lead-forms')
  const update = useCatalogUpdateMutation('lead-forms')
  const rows = (query.data ?? []) as FormRow[]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id)
  }, [rows, selectedId])

  const current = rows.find((row) => row.id === selectedId) ?? rows[0]
  const fields = asFields(current?.fields)

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Lead capture forms"
        description="Build conversion-ready forms and send submissions into your CRM."
        action="Publish form"
        onAction={async () => {
          if (!current) return setShowCreate(true)
          try {
            await update.mutateAsync({ id: current.id, body: { status: 'Active' } })
            notify('Form published')
          } catch (error) {
            notify(error instanceof ApiError ? error.message : 'Publish failed')
          }
        }}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading forms…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No forms yet"
        emptyDescription="Create a lead capture form."
        emptyActionLabel="Create form"
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
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-lg border border-dashed px-3 py-2 text-xs font-semibold text-slate-500">
            + New
          </button>
        </div>
        {current && (
          <div className="grid gap-5 xl:grid-cols-[180px_minmax(0,1fr)_320px]">
            <aside className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-3 text-xs font-semibold">Field library</p>
              {['Name', 'Email', 'Phone', 'Company', 'Message', 'Dropdown', 'Consent'].map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={async () => {
                    try {
                      await update.mutateAsync({ id: current.id, body: { fields: [...fields, field] } })
                      notify('Field added')
                    } catch (error) {
                      notify(error instanceof ApiError ? error.message : 'Update failed')
                    }
                  }}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed p-2.5 text-left text-xs dark:border-slate-700"
                >
                  <Plus className="size-3.5 text-indigo-600" />
                  {field}
                </button>
              ))}
            </aside>
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{catalogRecordLabel(current)}</p>
                  <p className="text-xs text-slate-400">{current.submissions ?? 0} submissions · {current.status}</p>
                </div>
                <span className={pill}>
                  <Settings2 className="mr-1 inline size-3" />
                  Builder
                </span>
              </div>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                {fields.map((field, index) => (
                  <div key={`${field}-${index}`} className="flex items-center gap-3 rounded-lg border bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
                    <span className="font-medium">{field}</span>
                    <MoreHorizontal className="ml-auto size-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </section>
            <aside className="rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="font-semibold">Embed code</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                {current.embedCode || `<iframe src="/forms/${current.id}"></iframe>`}
              </pre>
            </aside>
          </div>
        )}
      </QueryGate>
      {showCreate && (
        <Modal title="Create form" onClose={() => setShowCreate(false)}>
          <label className="text-xs font-medium">
            Form name
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
                  status: 'Draft',
                  fields: ['Name', 'Email', 'Company'],
                  submissions: 0,
                  embedCode: '',
                })
                setSelectedId(String(row.id ?? ''))
                setShowCreate(false)
                setName('')
                notify('Form created')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
          >
            Create
          </button>
        </Modal>
      )}
    </Shell>
  )
}
