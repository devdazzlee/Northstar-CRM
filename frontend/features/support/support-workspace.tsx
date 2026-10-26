'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, ExternalLink, MoreHorizontal, Ticket } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { updateCatalogRecord } from '@/lib/api/catalog'
import { ui, type Notify } from '@/lib/ui'
import { cx, Pill, Shell, slaTone, stages, TicketCard, type TicketItem } from './shared'

type ApiTicket = {
  id: string
  number?: string
  subject?: string
  customerName?: string | null
  status?: string
  priority?: string
  channel?: string
  agentName?: string | null
  slaMinutesLeft?: number | null
  satisfaction?: number | null
  body?: string | null
  companyId?: string | null
}

function mapTicket(row: ApiTicket): TicketItem {
  const statusRaw = String(row.status || 'OPEN').toUpperCase()
  const status =
    statusRaw === 'RESOLVED' ? 'Resolved' : statusRaw === 'PENDING' ? 'Pending' : ('Open' as const)
  const priorityRaw = String(row.priority || 'NORMAL').toUpperCase()
  const priority =
    priorityRaw === 'URGENT' ? 'Urgent' : priorityRaw === 'HIGH' ? 'High' : ('Normal' as const)
  const channelRaw = String(row.channel || 'EMAIL').toUpperCase()
  const channel =
    channelRaw === 'CHAT' ? 'Chat' : channelRaw === 'PHONE' ? 'Phone' : ('Email' as const)
  const minutes = row.slaMinutesLeft ?? 0
  return {
    id: row.number || row.id.slice(0, 8),
    subject: row.subject || 'Untitled ticket',
    customer: row.customerName || 'Unknown',
    company: row.companyId ? 'Linked company' : '—',
    status,
    priority,
    agent: (row.agentName || '—').slice(0, 2).toUpperCase(),
    sla: status === 'Resolved' ? 'Resolved' : minutes > 0 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m left` : 'Due',
    channel,
    minutes,
    satisfaction: row.satisfaction ?? undefined,
  }
}

function toApiStatus(status: TicketItem['status']) {
  return status === 'Resolved' ? 'RESOLVED' : status === 'Pending' ? 'PENDING' : 'OPEN'
}

export function SupportWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('support-tickets')
  const create = useCatalogCreateMutation('support-tickets')
  const apiRows = (query.data ?? []) as ApiTicket[]
  const tickets = useMemo(() => apiRows.map(mapTicket), [apiRows])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'List' | 'Board'>('List')
  const [status, setStatus] = useState('All')
  const [note, setNote] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!selectedId && tickets[0]) setSelectedId(apiRows[0]?.id ?? null)
  }, [tickets, selectedId, apiRows])

  const selectedApi = apiRows.find((row) => row.id === selectedId) ?? apiRows[0]
  const selected = selectedApi ? mapTicket(selectedApi) : tickets[0]
  const visible = tickets.filter((t) => status === 'All' || t.status === status)

  const openCount = tickets.filter((t) => t.status === 'Open').length
  const atRisk = tickets.filter((t) => t.status !== 'Resolved' && t.minutes < 120).length
  const backlog = tickets.filter((t) => t.status !== 'Resolved').length
  const csat =
    tickets.filter((t) => typeof t.satisfaction === 'number').reduce((sum, t) => sum + (t.satisfaction || 0), 0) /
      Math.max(1, tickets.filter((t) => typeof t.satisfaction === 'number').length) || 0

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || !selectedApi) return
    try {
      await updateCatalogRecord('support-tickets', selectedApi.id, {
        body: [selectedApi.body, `Internal note: ${note.trim()}`].filter(Boolean).join('\n\n'),
      })
      await query.refetch()
      notify('Internal note added')
      setNote('')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Could not save note')
    }
  }

  return (
    <Shell title="Support tickets" action="Create ticket" onAction={() => setShowCreate(true)}>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ['Open tickets', String(openCount), 'Needs attention'],
          ['SLA at risk', String(atRisk), 'Next 2 hours'],
          ['Backlog', String(backlog), 'Open + pending'],
          ['CSAT', csat ? `${csat.toFixed(1)} / 5` : '—', 'From resolved tickets'],
        ].map(([a, b, c]) => (
          <div
            key={a}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500">{a}</p>
            <p className="mt-2 text-2xl font-semibold">{b}</p>
            <p className="mt-1 text-[11px] text-emerald-600">{c}</p>
          </div>
        ))}
      </div>
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading tickets…"
        isEmpty={!query.isLoading && tickets.length === 0}
        emptyTitle="No support tickets"
        emptyDescription="Create a ticket to start the support queue."
        emptyActionLabel="Create ticket"
        onEmptyAction={() => setShowCreate(true)}
        className="p-0"
      >
        {!selected ? (
          <GlobalLoader variant="section" label="Loading tickets…" />
        ) : (
          <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_380px]">
            <section className="min-w-0 border-r border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {['All', ...stages].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStatus(item)}
                      className={cx(
                        'rounded-md px-3 py-1.5 text-xs font-medium',
                        status === item ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500',
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {(['List', 'Board'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={cx(
                        'rounded-md px-3 py-1.5 text-xs font-medium',
                        mode === item ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500',
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              {mode === 'Board' ? (
                <div className="grid gap-3 p-4 md:grid-cols-3">
                  {stages.map((stage) => (
                    <div key={stage} className="min-h-80 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold">{stage}</p>
                        <Pill>{visible.filter((t) => t.status === stage).length}</Pill>
                      </div>
                      {visible
                        .filter((t) => t.status === stage)
                        .map((ticket) => {
                          const api = apiRows.find((row) => (row.number || row.id.slice(0, 8)) === ticket.id)
                          return (
                            <TicketCard
                              key={ticket.id}
                              ticket={ticket}
                              selected={selected.id === ticket.id}
                              onClick={() => setSelectedId(api?.id ?? null)}
                            />
                          )
                        })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visible.map((ticket) => {
                    const api = apiRows.find((row) => (row.number || row.id.slice(0, 8)) === ticket.id)
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setSelectedId(api?.id ?? null)}
                        className={cx(
                          'flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          selected.id === ticket.id && 'bg-indigo-50/60 dark:bg-indigo-950/20',
                        )}
                      >
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <Ticket className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">{ticket.id}</span>
                            <Pill
                              tone={
                                ticket.priority === 'Urgent' ? 'rose' : ticket.priority === 'High' ? 'amber' : 'slate'
                              }
                            >
                              {ticket.priority}
                            </Pill>
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {ticket.customer} · {ticket.company} · {ticket.channel}
                          </p>
                        </div>
                        <div
                          className={cx(
                            'rounded-md px-2 py-1 text-[11px] font-semibold',
                            slaTone(ticket.minutes, ticket.status),
                          )}
                        >
                          <Clock3 className="mr-1 inline size-3" />
                          {ticket.sla}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
            <aside className="flex min-w-0 flex-col">
              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">{selected.id}</p>
                    <h2 className="mt-1 text-lg font-semibold">{selected.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.customer} · {selected.company}
                    </p>
                  </div>
                  <button type="button" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone={selected.priority === 'Urgent' ? 'rose' : 'amber'}>{selected.priority} priority</Pill>
                  <Pill>{selected.channel}</Pill>
                  <Pill tone="emerald">{selected.status}</Pill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      className={ui.button}
                      onClick={async () => {
                        if (!selectedApi) return
                        try {
                          await updateCatalogRecord('support-tickets', selectedApi.id, {
                            status: toApiStatus(stage),
                          })
                          await query.refetch()
                          notify(`Ticket marked ${stage}`)
                        } catch (error) {
                          notify(error instanceof ApiError ? error.message : 'Update failed')
                        }
                      }}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-auto p-5">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50">
                  <p className="text-xs font-semibold">{selected.customer}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedApi?.body || 'No description yet.'}
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Linked CRM records</p>
                  <div className="mt-3 space-y-2 text-xs">
                    <p>
                      Contact · {selected.customer} <ExternalLink className="ml-1 inline size-3" />
                    </p>
                    <p>
                      Company · {selected.company} <ExternalLink className="ml-1 inline size-3" />
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={(e) => void addNote(e)} className="border-t border-slate-200 p-4 dark:border-slate-800">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note..."
                  className="min-h-20 w-full rounded-lg border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700"
                />
                <button type="submit" className="mt-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                  Add internal note
                </button>
              </form>
            </aside>
          </div>
        )}
      </QueryGate>
      {showCreate && (
        <TicketModal
          onClose={() => setShowCreate(false)}
          notify={notify}
          onCreate={async (input) => {
            await create.mutateAsync(input)
            notify('Ticket created')
            setShowCreate(false)
          }}
          busy={create.isPending}
        />
      )}
    </Shell>
  )
}

function TicketModal({
  onClose,
  notify,
  onCreate,
  busy,
}: {
  onClose: () => void
  notify: Notify
  busy: boolean
  onCreate: (input: Record<string, unknown>) => Promise<void>
}) {
  const [subject, setSubject] = useState('')
  const [customer, setCustomer] = useState('')
  const [priority, setPriority] = useState('NORMAL')

  return (
    <Modal title="Create ticket" onClose={onClose}>
      <div className="grid gap-4">
        <label className="text-xs font-medium">
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`${ui.input} mt-1.5 w-full`}
          />
        </label>
        <label className="text-xs font-medium">
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Customer name"
            className={`${ui.input} mt-1.5 w-full`}
          />
        </label>
        <label className="text-xs font-medium">
          Priority
          <select
            className={`${ui.input} mt-1.5 w-full`}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={ui.button}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || subject.trim().length < 3}
          className={ui.buttonPrimary}
          onClick={async () => {
            try {
              await onCreate({
                number: `SUP-${Date.now().toString().slice(-4)}`,
                subject: subject.trim(),
                customerName: customer.trim() || 'Unknown',
                status: 'OPEN',
                priority,
                channel: 'EMAIL',
                slaMinutesLeft: 240,
                body: '',
              })
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Create failed')
            }
          }}
        >
          {busy ? <GlobalLoader variant="inline" label="Saving…" /> : 'Create ticket'}
        </button>
      </div>
    </Modal>
  )
}
