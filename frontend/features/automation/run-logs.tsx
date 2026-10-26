'use client'

import { Filter } from 'lucide-react'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { runAutomationsApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { button, pill, shell } from './shared'

type LogRow = {
  id: string
  workflowName?: string
  status?: string
  startedAt?: string
  createdAt?: string
  durationMs?: number
  recordLabel?: string
}

export function RunLogs({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('workflow-logs')
  const runs = (query.data ?? []) as LogRow[]

  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading run logs…"
      isEmpty={!query.isLoading && runs.length === 0}
      emptyTitle="No workflow runs yet"
      emptyDescription="Executions will appear here after automations fire."
      className="p-0"
    >
      <div className={shell + ' overflow-hidden border-0 shadow-none'}>
        <div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
          <select className="h-8 rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700">
            <option>All statuses</option>
            <option>Success</option>
            <option>Failed</option>
          </select>
          <button type="button" onClick={() => void query.refetch()} className={button}>
            <Filter className="mr-1 inline size-3.5" />
            Refresh
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {runs.map((run) => {
            const ok = String(run.status || '').toLowerCase() !== 'failed'
            return (
              <div key={run.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className={`size-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{run.workflowName || catalogRecordLabel(run)}</p>
                  <p className="text-xs text-slate-500">
                    {run.recordLabel || '—'} ·{' '}
                    {run.startedAt || run.createdAt
                      ? new Date(run.startedAt || run.createdAt || '').toLocaleString()
                      : '—'}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {typeof run.durationMs === 'number' ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
                </span>
                <span className={`${pill} ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {run.status || 'Unknown'}
                </span>
                {!ok && (
                  <button
                    type="button"
                    onClick={() => {
                      void runAutomationsApi()
                        .then(() => {
                          notify('Automation engine re-queued')
                          void query.refetch()
                        })
                        .catch((error: unknown) =>
                          notify(error instanceof ApiError ? error.message : 'Retry failed'),
                        )
                    }}
                    className="text-xs font-semibold text-indigo-600"
                  >
                    Retry
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </QueryGate>
  )
}
