'use client'

import { useMemo, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery, useCatalogUpdateMutation } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { type Notify } from '@/lib/ui'
import { avatar, pill, Shell } from './shared'

type InboxRow = {
  id: string
  channel?: string
  fromName?: string | null
  fromAddress?: string | null
  subject?: string
  body?: string | null
  read?: boolean
  createdAt?: string
}

export function InboxWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('inbox-messages')
  const create = useCatalogCreateMutation('inbox-messages')
  const update = useCatalogUpdateMutation('inbox-messages')
  const rows = (query.data ?? []) as InboxRow[]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [folder, setFolder] = useState('Inbox')
  const [compose, setCompose] = useState(false)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const visible = useMemo(() => {
    if (folder === 'Archive') return rows.filter((row) => row.read)
    if (folder === 'Assigned to me') return rows.filter((row) => !row.read)
    return rows
  }, [rows, folder])

  const selected = visible.find((row) => row.id === selectedId) ?? visible[0]

  return (
    <Shell>
      <PageHeader
        eyebrow="Engage"
        title="Inbox"
        description="One shared workspace for customer conversations."
        action="Compose"
        onAction={() => setCompose(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading inbox…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="Inbox is empty"
        emptyDescription="Compose a message or wait for inbound mail."
        emptyActionLabel="Compose"
        onEmptyAction={() => setCompose(true)}
        className="p-0"
      >
        <div className="grid min-h-[590px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[190px_300px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 p-3 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Folders</p>
            {['Inbox', 'Assigned to me', 'Archive'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFolder(item)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${folder === item ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-500'}`}
              >
                <Mail className="size-3.5" />
                {item}
                <span className="ml-auto text-[10px]">
                  {item === 'Assigned to me' ? rows.filter((r) => !r.read).length : rows.length}
                </span>
              </button>
            ))}
          </aside>
          <section className="border-b border-slate-200 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-100 p-3 text-xs font-semibold dark:border-slate-800">
              {visible.length} conversations
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {visible.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(thread.id)
                    if (!thread.read) {
                      void update.mutateAsync({ id: thread.id, body: { read: true } }).catch(() => undefined)
                    }
                  }}
                  className={`w-full border-b border-slate-100 p-3 text-left dark:border-slate-800 ${selected?.id === thread.id ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold dark:bg-slate-800">
                      {avatar(thread.fromName || thread.fromAddress || '?')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{thread.fromName || thread.fromAddress || 'Unknown'}</p>
                      <p className="truncate text-[11px] text-slate-500">{thread.subject}</p>
                    </div>
                    {!thread.read && <span className="size-2 rounded-full bg-indigo-500" />}
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="flex min-h-[420px] flex-col p-5">
            {selected ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{selected.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.fromName || selected.fromAddress} ·{' '}
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <span className={pill}>{selected.channel || 'email'}</span>
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950/40">
                  {selected.body || 'No body'}
                </div>
              </>
            ) : (
              <GlobalLoader variant="section" label="Select a conversation" />
            )}
          </section>
        </div>
      </QueryGate>
      {compose && (
        <Modal title="Compose message" onClose={() => setCompose(false)}>
          <div className="space-y-3">
            <label className="text-xs font-medium">
              To
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Subject
              <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Body
              <textarea className="mt-1.5 min-h-28 w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            disabled={create.isPending || !subject.trim()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={async () => {
              try {
                await create.mutateAsync({
                  channel: 'email',
                  fromName: 'You',
                  fromAddress: to || 'you@northstar.local',
                  subject: subject.trim(),
                  body: body.trim(),
                  read: true,
                })
                notify('Message saved to inbox')
                setCompose(false)
                setTo('')
                setSubject('')
                setBody('')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Send failed')
              }
            }}
          >
            <Send className="size-4" />
            {create.isPending ? 'Sending…' : 'Send'}
          </button>
        </Modal>
      )}
    </Shell>
  )
}
