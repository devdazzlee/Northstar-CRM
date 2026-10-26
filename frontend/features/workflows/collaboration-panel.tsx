'use client'

import { useMemo, useState } from 'react'
import { AtSign, MessageSquare, Send } from 'lucide-react'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { type Notify } from '@/lib/ui'

type ActivityRow = {
  id: string
  type?: string
  subject?: string
  body?: string | null
  actorName?: string | null
  createdAt?: string
  occurredAt?: string
  relatedId?: string | null
}

export function CollaborationPanel({
  entityLabel,
  entityId,
  notify,
}: {
  entityLabel?: string
  entityId?: string
  notify: Notify
}) {
  const label = entityLabel || 'this record'
  const [draft, setDraft] = useState('')
  const activitiesQuery = useCatalogListQuery('activities')
  const createActivity = useCatalogCreateMutation('activities')

  const comments = useMemo(() => {
    const rows = (activitiesQuery.data ?? []) as ActivityRow[]
    const filtered = entityId
      ? rows.filter(
          (row) =>
            row.relatedId === entityId ||
            row.subject?.includes(entityId) ||
            row.body?.includes(label),
        )
      : rows
    return filtered.slice(0, 30)
  }, [activitiesQuery.data, entityId, label])

  const post = async () => {
    if (!draft.trim()) return
    try {
      await createActivity.mutateAsync({
        type: 'note',
        subject: entityId ? `Note on ${entityId}` : `Note on ${label}`,
        body: draft.trim(),
        relatedType: entityId ? 'record' : undefined,
        relatedId: entityId,
        actorName: 'You',
        occurredAt: new Date().toISOString(),
      })
      setDraft('')
      notify('Comment posted')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Could not post comment')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <MessageSquare className="size-4 text-indigo-500" />
        <h3 className="text-sm font-semibold">Collaboration</h3>
        <span className="ml-auto text-[11px] text-slate-400">{label}</span>
      </div>
      <QueryGate
        isLoading={activitiesQuery.isLoading}
        isError={activitiesQuery.isError}
        error={activitiesQuery.error}
        onRetry={() => void activitiesQuery.refetch()}
        loadingLabel="Loading comments…"
        isEmpty={!activitiesQuery.isLoading && comments.length === 0}
        emptyTitle="No comments yet"
        emptyDescription="Be the first to leave a note on this record."
        className="p-4"
      >
        <div className="max-h-64 space-y-3 overflow-y-auto p-4">
          {comments.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <AtSign className="size-3" />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {item.actorName || 'Teammate'}
                </span>
                <span className="ml-auto">{formatWhen(item.occurredAt || item.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm">{item.body || item.subject}</p>
            </div>
          ))}
        </div>
      </QueryGate>
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950"
            placeholder={`Comment on ${label}…`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void post()
            }}
          />
          <button
            type="button"
            disabled={createActivity.isPending || !draft.trim()}
            onClick={() => void post()}
            className="grid size-10 place-items-center rounded-lg bg-indigo-600 text-white disabled:opacity-60"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatWhen(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
