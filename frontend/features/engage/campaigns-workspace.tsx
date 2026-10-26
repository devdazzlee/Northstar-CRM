'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { sendCampaignApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { pill, Shell } from './shared'

type CampaignRow = {
  id: string
  name?: string
  status?: string
  subject?: string | null
  audience?: string | null
  openRate?: number | null
  sentCount?: number | null
  scheduledAt?: string | null
}

export function CampaignsWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('email-campaigns')
  const create = useCatalogCreateMutation('email-campaigns')
  const rows = (query.data ?? []) as CampaignRow[]
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [audience, setAudience] = useState('')

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Email campaigns"
        description="Plan, send, and measure outbound campaigns."
        action="Create campaign"
        onAction={() => setShow(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading campaigns…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No campaigns yet"
        emptyDescription="Create a campaign draft to get started."
        emptyActionLabel="Create campaign"
        onEmptyAction={() => setShow(true)}
        className="p-0"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950">
              <tr>
                {['Campaign', 'Status', 'Audience', 'Open rate', 'Sent', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold">{catalogRecordLabel(row)}</td>
                  <td className="px-4 py-3">
                    <span className={pill}>{row.status || 'Draft'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.audience || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {typeof row.openRate === 'number' ? `${row.openRate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.sentCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600"
                      onClick={async () => {
                        try {
                          await sendCampaignApi(row.id, ['team@northstar.local'])
                          notify('Campaign send queued')
                          await query.refetch()
                        } catch (error) {
                          notify(error instanceof ApiError ? error.message : 'Send failed')
                        }
                      }}
                    >
                      Send
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryGate>
      {show && (
        <Modal title="Create campaign" onClose={() => setShow(false)}>
          <div className="space-y-3">
            <label className="text-xs font-medium">
              Name
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Subject
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Audience
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            disabled={create.isPending || name.trim().length < 2}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            onClick={async () => {
              try {
                await create.mutateAsync({
                  name: name.trim(),
                  subject: subject.trim() || name.trim(),
                  audience: audience.trim() || 'All leads',
                  status: 'Draft',
                  sentCount: 0,
                  openRate: 0,
                })
                notify('Campaign created')
                setShow(false)
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
          >
            {create.isPending ? 'Saving…' : 'Create campaign'}
          </button>
        </Modal>
      )}
    </Shell>
  )
}
