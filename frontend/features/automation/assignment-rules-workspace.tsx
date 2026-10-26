'use client'

import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { runAssignmentApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { pill, primary, shell } from './shared'

type RuleRow = {
  id: string
  name?: string
  entityType?: string | null
  conditions?: unknown
  assignTo?: string | null
  active?: boolean
}

export function AssignmentRulesWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('assignment-rules')
  const create = useCatalogCreateMutation('assignment-rules')
  const update = useCatalogUpdateMutation('assignment-rules')
  const rows = (query.data ?? []) as RuleRow[]
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [assignTo, setAssignTo] = useState('Round robin')

  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Automation"
        title="Lead assignment rules"
        description="Route new demand fairly and predictably."
        action="Add rule"
        onAction={() => setShowCreate(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading assignment rules…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No assignment rules"
        emptyDescription="Create a rule to auto-route leads."
        emptyActionLabel="Add rule"
        onEmptyAction={() => setShowCreate(true)}
        className="p-0"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className={shell + ' overflow-hidden'}>
            <div className="border-b border-slate-100 p-4 text-sm font-semibold dark:border-slate-800">
              Priority order · {rows.length} rules
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((rule, index) => (
                <div key={rule.id} className="flex items-center gap-3 p-4">
                  <GripVertical className="size-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{catalogRecordLabel(rule)}</p>
                    <p className="text-xs text-slate-500">
                      {rule.entityType || 'lead'} · {rule.assignTo || 'Unassigned'} · Priority {index + 1}
                    </p>
                  </div>
                  <span className={pill}>{rule.active === false ? 'Paused' : 'Active'}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600"
                    onClick={async () => {
                      try {
                        await update.mutateAsync({ id: rule.id, body: { active: rule.active === false } })
                        notify(rule.active === false ? 'Rule activated' : 'Rule paused')
                      } catch (error) {
                        notify(error instanceof ApiError ? error.message : 'Update failed')
                      }
                    }}
                  >
                    Toggle
                  </button>
                </div>
              ))}
            </div>
          </div>
          <aside className={shell + ' p-5'}>
            <p className="text-sm font-semibold">Run assignment engine</p>
            <p className="mt-2 text-xs text-slate-500">Applies active rules to unassigned leads.</p>
            <button
              type="button"
              className={primary + ' mt-4 w-full'}
              onClick={() => {
                void runAssignmentApi('lead')
                  .then(() => notify('Assignment engine completed'))
                  .catch((error: unknown) =>
                    notify(error instanceof ApiError ? error.message : 'Assignment run failed'),
                  )
              }}
            >
              Run now
            </button>
          </aside>
        </div>
      </QueryGate>
      {showCreate && (
        <Modal title="Add assignment rule" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <label className="text-xs font-medium">
              Name
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Assign to
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            disabled={create.isPending || name.trim().length < 2}
            className={primary + ' mt-4 w-full'}
            onClick={async () => {
              try {
                await create.mutateAsync({
                  name: name.trim(),
                  entityType: 'lead',
                  assignTo: assignTo.trim() || 'Round robin',
                  conditions: {},
                  active: true,
                })
                setShowCreate(false)
                setName('')
                notify('Assignment rule created')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
          >
            {create.isPending ? 'Saving…' : 'Create rule'}
          </button>
        </Modal>
      )}
    </div>
  )
}
