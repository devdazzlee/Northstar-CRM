'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { runLeadScoringApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { primary, shell } from './shared'

type ScoreRule = {
  id: string
  name?: string
  field?: string
  operator?: string
  value?: string
  points?: number
  active?: boolean
}

type ApprovalRow = {
  id: string
  name?: string
  entityType?: string
  active?: boolean
  steps?: unknown
}

export function ScoringApprovalsWorkspace({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState<'Scoring' | 'Approvals'>('Scoring')
  const scoreQuery = useCatalogListQuery('lead-score-rules')
  const approvalQuery = useCatalogListQuery('approval-workflows')
  const createScore = useCatalogCreateMutation('lead-score-rules')
  const updateScore = useCatalogUpdateMutation('lead-score-rules')
  const createApproval = useCatalogCreateMutation('approval-workflows')
  const scoreRules = (scoreQuery.data ?? []) as ScoreRule[]
  const approvals = (approvalQuery.data ?? []) as ApprovalRow[]
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [points, setPoints] = useState('10')

  const query = tab === 'Scoring' ? scoreQuery : approvalQuery

  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Automation"
        title="Scoring & approvals"
        description="Tune qualification and control sensitive commercial decisions."
        action="Add rule"
        onAction={() => setShowCreate(true)}
      />
      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {(['Scoring', 'Approvals'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-md px-3 py-2 text-xs font-semibold ${tab === item ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading rules…"
        isEmpty={!query.isLoading && (tab === 'Scoring' ? scoreRules.length === 0 : approvals.length === 0)}
        emptyTitle={tab === 'Scoring' ? 'No scoring rules' : 'No approval workflows'}
        emptyDescription="Create a rule to get started."
        emptyActionLabel="Add rule"
        onEmptyAction={() => setShowCreate(true)}
        className="p-0"
      >
        {tab === 'Scoring' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className={shell + ' divide-y divide-slate-100 dark:divide-slate-800'}>
              {scoreRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center gap-4 p-4">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{catalogRecordLabel(rule)}</p>
                    <p className="text-xs text-slate-500">
                      {rule.field || 'field'} {rule.operator || ''} {rule.value || ''}
                    </p>
                  </div>
                  <input
                    type="number"
                    defaultValue={rule.points ?? 10}
                    onBlur={(e) => {
                      void updateScore
                        .mutateAsync({ id: rule.id, body: { points: Number(e.target.value) || 0 } })
                        .then(() => notify('Points updated'))
                        .catch((error: unknown) =>
                          notify(error instanceof ApiError ? error.message : 'Update failed'),
                        )
                    }}
                    className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-right text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                  <span className="text-xs text-slate-500">points</span>
                </div>
              ))}
            </div>
            <div className={shell + ' p-5'}>
              <p className="text-sm font-semibold">Recompute scores</p>
              <p className="mt-2 text-xs text-slate-500">Runs the lead scoring engine against active rules.</p>
              <button
                type="button"
                className={primary + ' mt-5 w-full'}
                onClick={() => {
                  void runLeadScoringApi()
                    .then(() => notify('Lead scoring complete'))
                    .catch((error: unknown) =>
                      notify(error instanceof ApiError ? error.message : 'Scoring failed'),
                    )
                }}
              >
                Run scoring
              </button>
            </div>
          </div>
        ) : (
          <div className={shell + ' divide-y divide-slate-100 dark:divide-slate-800'}>
            {approvals.map((row) => (
              <div key={row.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{catalogRecordLabel(row)}</p>
                  <p className="text-xs text-slate-500">{row.entityType || 'deal'} · {row.active === false ? 'Paused' : 'Active'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryGate>
      {showCreate && (
        <Modal title={tab === 'Scoring' ? 'Add scoring rule' : 'Add approval workflow'} onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <label className="text-xs font-medium">
              Name
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            {tab === 'Scoring' && (
              <label className="text-xs font-medium">
                Points
                <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={points} onChange={(e) => setPoints(e.target.value)} />
              </label>
            )}
          </div>
          <button
            type="button"
            disabled={name.trim().length < 2}
            className={primary + ' mt-4 w-full'}
            onClick={async () => {
              try {
                if (tab === 'Scoring') {
                  await createScore.mutateAsync({
                    name: name.trim(),
                    field: 'source',
                    operator: 'equals',
                    value: 'Website',
                    points: Number(points) || 10,
                    active: true,
                  })
                } else {
                  await createApproval.mutateAsync({
                    name: name.trim(),
                    entityType: 'deal',
                    steps: ['Manager review'],
                    active: true,
                  })
                }
                setShowCreate(false)
                setName('')
                notify('Rule created')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
          >
            Create
          </button>
        </Modal>
      )}
    </div>
  )
}
