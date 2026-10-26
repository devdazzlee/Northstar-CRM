'use client'

import { ExternalLink, Pencil, Trash2, Layers3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { GlobalLoader } from '@/components/ui/global-loader'
import {
  catalogRecordLabel,
  catalogRecordOwner,
  catalogRecordStatus,
  catalogRecordValue,
  type CatalogRecord,
} from '@/lib/api/catalog'
import { ui } from '@/lib/ui'

type ApiRecordsPanelProps = {
  title: string
  rows: CatalogRecord[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  onOpen?: (row: CatalogRecord) => void
  onEdit?: (row: CatalogRecord) => void
  onDelete?: (row: CatalogRecord) => void
  emptyTitle?: string
  emptyDescription?: string
}

export function ApiRecordsPanel({
  title,
  rows,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onOpen,
  onEdit,
  onDelete,
  emptyTitle = 'No records yet',
  emptyDescription = 'Create a record or wait for synced data from the API.',
}: ApiRecordsPanelProps) {
  if (isLoading) return <GlobalLoader label="Loading records…" variant="section" />
  if (isError) {
    return (
      <EmptyState
        icon={Layers3}
        title="Could not load records"
        description={errorMessage || 'Try again in a moment.'}
        actionLabel={onRetry ? 'Retry' : undefined}
        onAction={onRetry}
      />
    )
  }
  if (rows.length === 0) {
    return <EmptyState icon={Layers3} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <section className={`${ui.shell} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{rows.length} records from API</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const key = String(row.id ?? `${catalogRecordLabel(row)}-${index}`)
              return (
                <tr key={key} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold">{catalogRecordLabel(row)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                      {catalogRecordStatus(row)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{catalogRecordOwner(row)}</td>
                  <td className="px-4 py-3">{catalogRecordValue(row)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-indigo-600"
                        onClick={() => onOpen?.(row)}
                        aria-label={`Open ${catalogRecordLabel(row)}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </button>
                      {onEdit && row.id && (
                        <button
                          type="button"
                          className="text-slate-500 hover:text-indigo-600"
                          onClick={() => onEdit(row)}
                          aria-label={`Edit ${catalogRecordLabel(row)}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      {onDelete && row.id && (
                        <button
                          type="button"
                          className="text-slate-500 hover:text-rose-600"
                          onClick={() => onDelete(row)}
                          aria-label={`Delete ${catalogRecordLabel(row)}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
