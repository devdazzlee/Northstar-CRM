'use client'

import { useState } from 'react'
import { FileText, Mail, MoreHorizontal } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { type Notify } from '@/lib/ui'
import { pill, Shell } from './shared'

type TemplateRow = {
  id: string
  name?: string
  subject?: string
  body?: string | null
  category?: string | null
  updatedAt?: string
}

export function TemplatesWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('email-templates')
  const create = useCatalogCreateMutation('email-templates')
  const update = useCatalogUpdateMutation('email-templates')
  const rows = (query.data ?? []) as TemplateRow[]
  const [editor, setEditor] = useState<TemplateRow | 'new' | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Sales')

  const openNew = () => {
    setEditor('new')
    setName('')
    setSubject('')
    setBody('')
    setCategory('Sales')
  }

  const openEdit = (row: TemplateRow) => {
    setEditor(row)
    setName(row.name || '')
    setSubject(row.subject || '')
    setBody(row.body || '')
    setCategory(row.category || 'Sales')
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Email templates"
        description="Reusable messages for every customer moment."
        action="New template"
        onAction={openNew}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading templates…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No templates yet"
        emptyDescription="Create your first reusable email template."
        emptyActionLabel="New template"
        onEmptyAction={openNew}
        className="p-0"
      >
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Folders</p>
            {['All templates', 'Sales', 'Customer success', 'Personal'].map((item) => (
              <button key={item} type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-500">
                <FileText className="size-3.5" />
                {item}
              </button>
            ))}
          </aside>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => openEdit(template)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40">
                    <Mail className="size-4" />
                  </span>
                  <MoreHorizontal className="size-4 text-slate-400" />
                </div>
                <p className="text-sm font-semibold">{catalogRecordLabel(template)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {template.subject || 'No subject'} ·{' '}
                  {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : '—'}
                </p>
                <div className="mt-4 flex gap-1">
                  <span className={pill}>{template.category || 'General'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </QueryGate>
      {editor && (
        <Modal title={editor === 'new' ? 'New template' : catalogRecordLabel(editor)} onClose={() => setEditor(null)}>
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
              Category
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Body
              <textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            disabled={create.isPending || update.isPending || name.trim().length < 2}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={async () => {
              try {
                const payload = { name: name.trim(), subject: subject.trim(), body, category }
                if (editor === 'new') await create.mutateAsync(payload)
                else await update.mutateAsync({ id: editor.id, body: payload })
                notify('Template saved')
                setEditor(null)
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Save failed')
              }
            }}
          >
            {create.isPending || update.isPending ? <GlobalLoader variant="inline" label="Saving…" /> : 'Save template'}
          </button>
        </Modal>
      )}
    </Shell>
  )
}
