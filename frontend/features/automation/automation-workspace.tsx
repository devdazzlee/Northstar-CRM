'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, GitBranch, Play, Plus, Save, Search, Settings2, Zap } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { updateCatalogRecord } from '@/lib/api/catalog'
import { runAutomationsApi } from '@/lib/api/engines'
import { type Notify } from '@/lib/ui'
import { RunLogs } from './run-logs'
import { button, pill, primary, shell } from './shared'

type RuleRow = {
  id: string
  name?: string
  trigger?: string | null
  actions?: unknown
  active?: boolean
  updatedAt?: string
  createdAt?: string
}

function statusLabel(active?: boolean) {
  return active ? 'Active' : 'Paused'
}

function actionLabels(actions: unknown): string[] {
  if (Array.isArray(actions)) {
    return actions.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).slice(0, 6)
  }
  if (typeof actions === 'string' && actions.trim()) return [actions]
  return ['Send email', 'Assign owner']
}

export function AutomationWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('automation-rules')
  const create = useCatalogCreateMutation('automation-rules')
  const rules = (query.data ?? []) as RuleRow[]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<'Builder' | 'Runs'>('Builder')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [builderNodes, setBuilderNodes] = useState(['Record created', 'If lead score > 80', 'Assign owner', 'Send email'])
  const [selectedNode, setSelectedNode] = useState(1)
  const [nodeType, setNodeType] = useState('condition')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rules
    return rules.filter((row) => String(row.name ?? '').toLowerCase().includes(q))
  }, [rules, search])

  useEffect(() => {
    if (!selectedId && filtered[0]?.id) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  const current = filtered.find((row) => row.id === selectedId) ?? filtered[0]

  useEffect(() => {
    if (!current) return
    const nodes = [current.trigger || 'Record created', ...actionLabels(current.actions)]
    setBuilderNodes(nodes.length ? nodes : ['Record created', 'Assign owner'])
    setSelectedNode(0)
  }, [current?.id])

  const addNode = (value: string) => {
    setBuilderNodes((items) => [...items, value])
    notify(`${value} added`)
  }

  const save = async () => {
    if (!current) return
    setSaving(true)
    try {
      await updateCatalogRecord('automation-rules', current.id, {
        trigger: builderNodes[0] || 'Record created',
        actions: builderNodes.slice(1),
        active: current.active !== false,
      })
      await query.refetch()
      notify('Workflow saved')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Analyze"
        title="Workflow automation"
        description="Build repeatable processes that keep your revenue engine moving."
        action="Create workflow"
        onAction={() => setShowCreate(true)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading workflows…"
        isEmpty={!query.isLoading && rules.length === 0}
        emptyTitle="No workflows yet"
        emptyDescription="Create an automation rule to get started."
        emptyActionLabel="Create workflow"
        onEmptyAction={() => setShowCreate(true)}
        className="p-0"
      >
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {[
            ['Active workflows', rules.filter((x) => x.active !== false).length, 'Running automatically'],
            ['Total rules', rules.length, 'Loaded from API'],
            ['Selected', current?.name || '—', statusLabel(current?.active)],
          ].map(([label, value, sub]) => (
            <div key={String(label)} className={shell + ' p-4'}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-[11px] text-emerald-600">{sub}</p>
            </div>
          ))}
        </div>
        {!current ? (
          <GlobalLoader variant="section" label="Loading workflows…" />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
            <aside className={shell + ' overflow-hidden'}>
              <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold">Workflows</p>
                  <p className="text-xs text-slate-500">{filtered.length} automations</p>
                </div>
                <button type="button" onClick={() => setShowCreate(true)} className="rounded-md bg-indigo-600 p-2 text-white">
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                  <input
                    placeholder="Search workflows"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 pl-8 text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((workflow) => (
                  <button
                    key={workflow.id}
                    type="button"
                    onClick={() => setSelectedId(workflow.id)}
                    className={`w-full p-4 text-left ${selectedId === workflow.id ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">{workflow.name || 'Untitled'}</span>
                      <span
                        className={`size-2 rounded-full ${workflow.active !== false ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{workflow.trigger || 'No trigger'}</p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Updated {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : '—'}
                    </p>
                  </button>
                ))}
              </div>
            </aside>
            <section className={shell + ' min-w-0 overflow-hidden'}>
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium text-indigo-600">Visual builder</p>
                  <h2 className="text-lg font-semibold">{current.name}</h2>
                </div>
                <span className={pill + ' ml-auto'}>{statusLabel(current.active)}</span>
                <button
                  type="button"
                  onClick={() => {
                    void runAutomationsApi()
                      .then(() => notify('Automation engine queued'))
                      .catch((error: unknown) =>
                        notify(error instanceof ApiError ? error.message : 'Automation run failed'),
                      )
                  }}
                  className={button}
                >
                  <Play className="mr-1 inline size-3.5" />
                  Test run
                </button>
                <button type="button" onClick={() => void save()} disabled={saving} className={primary}>
                  <Save className="mr-1 inline size-3.5" />
                  {saving ? 'Saving…' : 'Save version'}
                </button>
              </div>
              <div className="flex border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTab('Builder')}
                  className={`px-4 py-3 text-xs font-semibold ${tab === 'Builder' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                >
                  Builder
                </button>
                <button
                  type="button"
                  onClick={() => setTab('Runs')}
                  className={`px-4 py-3 text-xs font-semibold ${tab === 'Runs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                >
                  Run logs
                </button>
              </div>
              {tab === 'Runs' ? (
                <RunLogs notify={notify} />
              ) : (
                <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_270px]">
                  <div className="relative overflow-hidden bg-slate-50/70 p-8 dark:bg-slate-950/40">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                      }}
                    />
                    <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
                      {builderNodes.map((node, index) => (
                        <div key={`${node}-${index}`} className="flex w-full flex-col items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNode(index)
                              setNodeType(index === 1 ? 'condition' : index === 0 ? 'trigger' : 'action')
                            }}
                            className={`w-full rounded-xl border-2 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:bg-slate-900 ${selectedNode === index ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex size-8 items-center justify-center rounded-lg ${index === 0 ? 'bg-indigo-100 text-indigo-600' : index === 1 ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}
                              >
                                {index === 0 ? (
                                  <Zap className="size-4" />
                                ) : index === 1 ? (
                                  <GitBranch className="size-4" />
                                ) : (
                                  <Activity className="size-4" />
                                )}
                              </span>
                              <span>
                                <span className="block text-sm font-semibold">{node}</span>
                                <span className="block text-[11px] text-slate-500">
                                  {index === 0
                                    ? 'Choose a record event'
                                    : index === 1
                                      ? 'Branch based on record fields'
                                      : 'Execute an automation action'}
                                </span>
                              </span>
                            </div>
                          </button>
                          {index < builderNodes.length - 1 && (
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNodeType('action')}
                        className="rounded-full border border-dashed border-indigo-300 px-4 py-2 text-xs font-semibold text-indigo-600"
                      >
                        + Add node
                      </button>
                    </div>
                  </div>
                  <aside className="border-l border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Node configuration</p>
                        <p className="text-[11px] text-slate-500">Selected: {builderNodes[selectedNode]}</p>
                      </div>
                      <Settings2 className="size-4 text-slate-400" />
                    </div>
                    <label className="mt-5 block text-xs font-medium">
                      Node type
                      <select
                        value={nodeType}
                        onChange={(e) => setNodeType(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option>trigger</option>
                        <option>condition</option>
                        <option>action</option>
                      </select>
                    </label>
                    <label className="mt-4 block text-xs font-medium">
                      Configuration
                      <input
                        key={`${current.id}-${selectedNode}`}
                        defaultValue={builderNodes[selectedNode]}
                        onBlur={(e) =>
                          setBuilderNodes((items) =>
                            items.map((item, i) => (i === selectedNode ? e.target.value : item)),
                          )
                        }
                        className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                    <div className="mt-5 grid gap-2">
                      {(nodeType === 'trigger'
                        ? ['Record created', 'Field changed', 'Form submitted', 'Deal stage changed', 'Schedule']
                        : nodeType === 'condition'
                          ? ['If score > 80', 'If owner is assigned', 'If value exceeds $50k', 'Else branch']
                          : [
                              'Send email',
                              'Create task',
                              'Update field',
                              'Assign owner',
                              'Notify Slack',
                              'Call webhook',
                              'Wait',
                              'Add to sequence',
                            ]
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => addNode(option)}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-left text-xs hover:border-indigo-300 dark:border-slate-700"
                        >
                          <span>{option}</span>
                          <Plus className="size-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
              )}
            </section>
          </div>
        )}
      </QueryGate>
      {showCreate && (
        <Modal title="Create workflow" onClose={() => setShowCreate(false)}>
          <label className="text-xs font-medium">
            Workflow name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. Route enterprise leads"
            />
          </label>
          <button
            type="button"
            disabled={create.isPending || name.trim().length < 2}
            onClick={async () => {
              try {
                const row = await create.mutateAsync({
                  name: name.trim(),
                  trigger: 'Record created',
                  actions: ['Assign owner', 'Send email'],
                  active: true,
                })
                setSelectedId(String(row.id ?? ''))
                setName('')
                setShowCreate(false)
                notify('Workflow created')
              } catch (error) {
                notify(error instanceof ApiError ? error.message : 'Create failed')
              }
            }}
            className={primary + ' mt-4 w-full'}
          >
            {create.isPending ? 'Creating…' : 'Create workflow'}
          </button>
        </Modal>
      )}
    </div>
  )
}
