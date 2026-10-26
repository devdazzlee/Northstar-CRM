'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { CalendarDays, ChevronDown, GripVertical, List, Plus, Settings2, SlidersHorizontal, Target, Trophy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { QueryGate } from '@/components/ui/query-gate'
import { useCreateDealMutation, useDealsQuery, useUpdateDealStageMutation } from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { createCatalogRecord } from '@/lib/api/catalog'
import { fetchSettings, updateSettingsApi } from '@/lib/api/ops'
import { ui } from '@/lib/ui'
import { dealFormSchema, type DealFormValues } from '@/lib/validators/deal'
import { type Deal, money, pipelines } from './shared'

type PipelineKey = keyof typeof pipelines
type PipelineMap = Record<string, string[]>
type StageMeta = { winPercent: number; days: number }
type PipelineStageMeta = Record<string, Record<string, StageMeta>>

function defaultStageMeta(stages: string[]): Record<string, StageMeta> {
  return Object.fromEntries(
    stages.map((stage, index) => [
      stage,
      {
        winPercent: index === 0 ? 25 : index === 1 ? 45 : index === 2 ? 70 : 85,
        days: index === 0 ? 14 : 30,
      },
    ]),
  )
}

export function DealsWorkspace({ notify, onOpen }: { notify: (message: string) => void; onOpen: (id: string) => void }) {
  const dealsQuery = useDealsQuery()
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: fetchSettings })
  const createDeal = useCreateDealMutation()
  const updateStage = useUpdateDealStageMutation()
  const deals = dealsQuery.data ?? []
  const [pipeline, setPipeline] = useState<PipelineKey>('Sales')
  const [pipelineMap, setPipelineMap] = useState<PipelineMap>(pipelines)
  const [stageMetaMap, setStageMetaMap] = useState<PipelineStageMeta>({})
  const [mode, setMode] = useState<'Kanban' | 'List' | 'Forecast'>('Kanban')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [decision, setDecision] = useState<{ kind: 'Won' | 'Lost'; deal: Deal } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter] = useState('All owners')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [productFilter, setProductFilter] = useState('All products')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const stages = pipelineMap[pipeline] ?? pipelines[pipeline]
  const stageMeta = stageMetaMap[pipeline] ?? defaultStageMeta(stages)

  useEffect(() => {
    const features = settingsQuery.data?.features
    if (!features || typeof features !== 'object') return
    const stored = (features as Record<string, unknown>).pipelines
    if (stored && typeof stored === 'object') {
      setPipelineMap({ ...pipelines, ...(stored as PipelineMap) })
    }
    const meta = (features as Record<string, unknown>).pipelineStageMeta
    if (meta && typeof meta === 'object') {
      setStageMetaMap(meta as PipelineStageMeta)
    }
  }, [settingsQuery.data])
  const openDeals = useMemo(
    () => deals.filter((deal) => stages.includes(deal.stage) || deal.stage === 'Won' || deal.stage === 'Lost'),
    [deals, stages],
  )
  const activeDeals = useMemo(() => openDeals.filter((deal) => stages.includes(deal.stage)), [openDeals, stages])
  const total = activeDeals.reduce((sum, deal) => sum + money(deal.amount), 0)
  const weighted = activeDeals.reduce((sum, deal) => sum + (money(deal.amount) * deal.probability) / 100, 0)
  const visible = activeDeals.filter(
    (deal) =>
      (filter === 'All owners' || deal.owner === filter) &&
      (teamFilter === 'All teams' || deal.team === teamFilter) &&
      (productFilter === 'All products' || deal.product === productFilter) &&
      (!minValue || money(deal.amount) >= Number(minValue)) &&
      (!maxValue || money(deal.amount) <= Number(maxValue)),
  )

  async function persistStage(id: string, stage: string, label: string) {
    try {
      await updateStage.mutateAsync({ id, stage })
      notify(`Moved ${label} to ${stage}`)
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Could not update deal stage')
    }
  }

  function moveDeal(id: string, stage: string) {
    const deal = deals.find((item) => item.id === id)
    if (!deal) return
    if (stage === 'Won' || stage === 'Lost') return setDecision({ kind: stage, deal })
    void persistStage(id, stage, deal.name)
  }
  function onDragEnd(event: DragEndEvent) {
    const over = String(event.over?.id || '')
    const id = String(event.active.id)
    if (over) moveDeal(id, over)
  }

  return (
    <QueryGate
      isLoading={dealsQuery.isLoading}
      isError={dealsQuery.isError}
      error={dealsQuery.error}
      onRetry={() => void dealsQuery.refetch()}
      loadingLabel="Loading deals…"
      errorTitle="Could not load deals"
      errorIcon={Target}
    >
    <div className="p-5 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-indigo-600">Manage</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sales pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeDeals.length} open deals · ${Math.round(total / 1000)}k pipeline · ${Math.round(weighted / 1000)}k weighted
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white">
          <Plus className="size-4" />
          Add deal
        </button>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select value={pipeline} onChange={(e) => setPipeline(e.target.value as keyof typeof pipelines)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
          <option>Sales</option>
          <option>Renewals</option>
          <option>Partnerships</option>
        </select>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">
          <SlidersHorizontal className="size-3.5" />
          Filters {filter !== 'All owners' && <span className="rounded bg-indigo-50 px-1.5 text-indigo-700">1</span>}
        </button>
        <button onClick={() => setShowSettings(true)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">
          <Settings2 className="size-3.5" />
          Pipeline settings
        </button>
        <div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          {(['Kanban', 'List', 'Forecast'] as const).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === item ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>
              {item === 'Kanban' ? <GripVertical className="mr-1 inline size-3" /> : item === 'List' ? <List className="mr-1 inline size-3" /> : <Target className="mr-1 inline size-3" />}
              {item}
            </button>
          ))}
        </div>
      </div>
      {filterOpen && (
        <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="text-xs font-medium">
            Owner
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-2 h-8 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700">
              <option>All owners</option>
              <option>AR</option>
              <option>JC</option>
              <option>SL</option>
              <option>MK</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Team
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="ml-2 h-8 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700">
              <option>All teams</option>
              <option>Sales</option>
              <option>Renewals</option>
              <option>Partnerships</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Product
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="ml-2 h-8 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700">
              <option>All products</option>
              <option>Platform</option>
              <option>Enterprise</option>
              <option>Growth</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Value
            <input value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="Min" className="ml-2 h-8 w-20 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700" />
            <input value={maxValue} onChange={(e) => setMaxValue(e.target.value)} placeholder="Max" className="ml-1 h-8 w-20 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700" />
          </label>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">Close date: Any</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">Tags: Any</span>
        </div>
      )}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Pipeline value" value={`$${Math.round(total / 1000)}k`} detail={`${openDeals.length} open deals`} />
        <Metric label="Weighted value" value={`$${Math.round(weighted / 1000)}k`} detail="Probability adjusted" />
        <Metric label="Win probability" value={`${total ? Math.round((weighted / total) * 100) : 0}%`} detail="Across active stages" />
      </div>
      {mode === 'Forecast' ? (
        <Forecast deals={visible} />
      ) : mode === 'List' ? (
        <DealList deals={visible} onOpen={onOpen} onEdit={() => setShowForm(true)} />
      ) : (
        <DndContext onDragEnd={onDragEnd}>
          <div className="grid min-h-[500px] gap-4 overflow-x-auto pb-3 lg:grid-cols-4">
            {stages.map((stage) => (
              <StageColumn key={stage} stage={stage} deals={visible.filter((deal) => deal.stage === stage)} onOpen={onOpen} />
            ))}
            <DropZone id="Won" label="Won" color="emerald" />
            <DropZone id="Lost" label="Lost" color="rose" />
          </div>
        </DndContext>
      )}
      {showForm && (
        <DealForm
          onClose={() => setShowForm(false)}
          busy={createDeal.isPending}
          onSave={async (deal) => {
            try {
              await createDeal.mutateAsync({
                name: deal.name,
                company: deal.company,
                amount: deal.amount,
                stage: deal.stage,
                closeDate: deal.closeDate,
                probability: deal.probability,
              })
              setShowForm(false)
              notify('Deal created')
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Could not create deal')
            }
          }}
        />
      )}
      {decision && (
        <DecisionDialog
          decision={decision}
          onClose={() => setDecision(null)}
          onSave={async (detail) => {
            try {
              await createCatalogRecord('activities', {
                type: 'note',
                subject: `${decision.kind} · ${decision.deal.name}`,
                body: detail,
                relatedType: 'deal',
                relatedId: decision.deal.id,
                actorName: 'You',
                occurredAt: new Date().toISOString(),
              })
              await updateStage.mutateAsync({ id: decision.deal.id, stage: decision.kind })
              setDecision(null)
              notify(`${decision.kind} deal saved · notes logged`)
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Could not save deal decision')
            }
          }}
        />
      )}
      {showSettings && (
        <PipelineSettings
          pipeline={pipeline}
          stages={stages}
          stageMeta={stageMeta}
          onClose={() => setShowSettings(false)}
          notify={notify}
          onSave={async (nextStages, nextMeta) => {
            const nextMap = { ...pipelineMap, [pipeline]: nextStages }
            const nextMetaMap = { ...stageMetaMap, [pipeline]: nextMeta }
            const currentFeatures =
              settingsQuery.data?.features && typeof settingsQuery.data.features === 'object'
                ? (settingsQuery.data.features as Record<string, unknown>)
                : {}
            await updateSettingsApi({
              features: {
                ...currentFeatures,
                pipelines: nextMap,
                pipelineStageMeta: nextMetaMap,
              },
            })
            setPipelineMap(nextMap)
            setStageMetaMap(nextMetaMap)
            await settingsQuery.refetch()
          }}
        />
      )}
    </div>
    </QueryGate>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  )
}

function StageColumn({ stage, deals, onOpen }: { stage: string; deals: Deal[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const value = deals.reduce((sum, deal) => sum + money(deal.amount), 0)
  return (
    <div ref={setNodeRef} className={`min-w-[255px] rounded-xl bg-slate-100/70 p-3 dark:bg-slate-900 ${isOver ? 'ring-2 ring-indigo-400' : ''}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-500" />
            <h2 className="text-xs font-semibold">{stage}</h2>
            <span className="text-[10px] text-slate-400">{deals.length}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">${Math.round(value / 1000)}k total</p>
        </div>
        <ChevronDown className="size-4 text-slate-400" />
      </div>
      <div className="space-y-3">
        {deals.map((deal) => (
          <DraggableDeal key={deal.id} deal={deal} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

function DraggableDeal({ deal, onOpen }: { deal: Deal; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(deal.name)}
      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-950 ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold">{deal.name}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{deal.company}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold dark:bg-slate-800">{deal.amount}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />
          {deal.closeDate}
        </span>
        <span>{deal.probability}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {deal.tags.map((tag) => (
            <span key={tag} className="rounded bg-indigo-50 px-1.5 py-1 text-[10px] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {tag}
            </span>
          ))}
        </div>
        <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${deal.color}`}>{deal.owner}</span>
      </div>
      {deal.stale && (
        <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-amber-600">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Rotting · no activity in 12 days
        </p>
      )}
    </article>
  )
}

function DropZone({ id, label, color }: { id: string; label: string; color: 'emerald' | 'rose' }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[150px] rounded-xl border-2 border-dashed p-4 text-center ${color === 'emerald' ? 'border-emerald-200 text-emerald-600' : 'border-rose-200 text-rose-600'} ${isOver ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
    >
      <Trophy className="mx-auto mb-2 size-5" />
      <p className="text-xs font-semibold">Drop to mark {label}</p>
      <p className="mt-1 text-[10px] opacity-70">Opens details</p>
    </div>
  )
}

function DealList({ deals, onOpen, onEdit }: { deals: Deal[]; onOpen: (id: string) => void; onEdit: () => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/50">
          <tr>
            {['Deal', 'Stage', 'Value', 'Probability', 'Close date', 'Owner', ''].map((label) => (
              <th key={label} className="px-4 py-3 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} onClick={() => onOpen(deal.name)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
              <td className="px-4 py-3">
                <p className="text-xs font-semibold">{deal.name}</p>
                <p className="text-[11px] text-slate-500">{deal.company}</p>
              </td>
              <td className="px-4 py-3 text-xs">{deal.stage}</td>
              <td className="px-4 py-3 text-xs font-semibold">{deal.amount}</td>
              <td className="px-4 py-3 text-xs">{deal.probability}%</td>
              <td className="px-4 py-3 text-xs text-slate-500">{deal.closeDate}</td>
              <td className="px-4 py-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{deal.owner}</span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="text-xs text-indigo-600"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Forecast({ deals }: { deals: Deal[] }) {
  const groups = ['This month', 'Next month', 'Later']
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map((group, index) => {
        const items = deals.filter((_, i) => i % 3 === index)
        return (
          <div key={group} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{group}</h2>
              <span className="text-xs text-slate-400">{items.length} deals</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">${Math.round(items.reduce((sum, deal) => sum + money(deal.amount) * deal.probability / 100, 0) / 1000)}k</p>
            <div className="mt-5 space-y-3">
              {items.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span>
                    <b>{deal.name}</b>
                    <span className="block text-slate-500">{deal.company}</span>
                  </span>
                  <span className="font-semibold">{deal.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DealForm({
  onClose,
  onSave,
  editing = false,
  busy,
}: {
  onClose: () => void
  onSave: (deal: Omit<Deal, 'id'>) => void | Promise<void>
  editing?: boolean
  busy?: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: '',
      company: '',
      amount: '',
      closeDate: '2026-12-18',
      stage: 'Qualification',
    },
  })

  return (
    <Modal title={editing ? 'Edit deal' : 'Create deal'} onClose={onClose}>
      <form
        onSubmit={handleSubmit((values) => {
          onSave({
            name: values.name,
            company: values.company,
            amount: values.amount.startsWith('$') ? values.amount : `$${values.amount}`,
            stage: values.stage,
            probability: values.stage === 'Proposal' ? 70 : 25,
            owner: 'AR',
            color: 'bg-indigo-100 text-indigo-700',
            closeDate: values.closeDate,
            tags: ['New'],
            product: 'Platform',
            team: 'Sales',
          })
        })}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Deal name
            <input {...register('name')} placeholder="Enterprise expansion" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.name)} />
            {errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name.message}</span>}
          </label>
          <label className="text-xs font-medium">
            Company
            <input {...register('company')} placeholder="Company name" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.company)} />
            {errors.company && <span className="mt-1 block text-[11px] text-rose-600">{errors.company.message}</span>}
          </label>
          <label className="text-xs font-medium">
            Value
            <input {...register('amount')} placeholder="84000" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.amount)} />
            {errors.amount && <span className="mt-1 block text-[11px] text-rose-600">{errors.amount.message}</span>}
          </label>
          <label className="text-xs font-medium">
            Close date
            <input {...register('closeDate')} type="date" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.closeDate)} />
            {errors.closeDate && <span className="mt-1 block text-[11px] text-rose-600">{errors.closeDate.message}</span>}
          </label>
        </div>
        <label className="text-xs font-medium">
          Pipeline stage
          <select {...register('stage')} className={`${ui.input} mt-1.5 h-10 w-full`}>
            {pipelines.Sales.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" onClick={onClose} className={ui.button}>
            Cancel
          </button>
          <button type="submit" className={ui.buttonPrimary} disabled={busy}>
            {busy ? 'Saving…' : 'Save deal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DecisionDialog({
  decision,
  onClose,
  onSave,
}: {
  decision: { kind: 'Won' | 'Lost'; deal: Deal }
  onClose: () => void
  onSave: (detail: string) => void | Promise<void>
}) {
  const [detail, setDetail] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <Modal title={`${decision.kind} ${decision.deal.name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSaving(true)
          void Promise.resolve(onSave(detail)).finally(() => setSaving(false))
        }}
        className="space-y-4 p-5"
      >
        <p className="text-sm text-slate-500">Capture the context before moving this deal out of the active pipeline.</p>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          required
          placeholder={decision.kind === 'Lost' ? 'Lost reason' : 'Won details, contract or handoff notes'}
          className="min-h-28 w-full rounded-lg border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : `Save ${decision.kind.toLowerCase()} details`}
        </button>
      </form>
    </Modal>
  )
}

function PipelineSettings({
  pipeline,
  stages,
  stageMeta,
  onClose,
  notify,
  onSave,
}: {
  pipeline: string
  stages: string[]
  stageMeta: Record<string, StageMeta>
  onClose: () => void
  notify: (message: string) => void
  onSave: (stages: string[], meta: Record<string, StageMeta>) => Promise<void>
}) {
  const [items, setItems] = useState(stages)
  const [meta, setMeta] = useState<Record<string, StageMeta>>(() => ({
    ...defaultStageMeta(stages),
    ...stageMeta,
  }))
  const [newStage, setNewStage] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <Modal title={`${pipeline} pipeline settings`} onClose={onClose}>
      <div className="space-y-5 p-5">
        <p className="text-xs text-slate-500">Drag stages to reorder. Win % and days save with the pipeline.</p>
        <div className="space-y-2">
          {items.map((stage, index) => (
            <div
              key={stage}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('stage', String(index))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const from = Number(e.dataTransfer.getData('stage'))
                const next = [...items]
                const [moved] = next.splice(from, 1)
                next.splice(index, 0, moved)
                setItems(next)
              }}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <GripVertical className="size-4 text-slate-400" />
              <span className="flex-1 text-sm font-medium">{stage}</span>
              <input
                value={meta[stage]?.winPercent ?? 25}
                onChange={(e) =>
                  setMeta((current) => ({
                    ...current,
                    [stage]: {
                      winPercent: Number(e.target.value) || 0,
                      days: current[stage]?.days ?? 30,
                    },
                  }))
                }
                type="number"
                min="0"
                max="100"
                className="h-8 w-16 rounded border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"
              />
              <span className="text-[10px] text-slate-400">% win</span>
              <input
                value={meta[stage]?.days ?? 30}
                onChange={(e) =>
                  setMeta((current) => ({
                    ...current,
                    [stage]: {
                      winPercent: current[stage]?.winPercent ?? 25,
                      days: Number(e.target.value) || 0,
                    },
                  }))
                }
                type="number"
                className="h-8 w-16 rounded border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"
              />
              <span className="text-[10px] text-slate-400">days</span>
              <span className="ml-auto rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-800">Required: value, close date</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Add stage" className="h-9 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 text-xs dark:border-slate-700" />
          <button
            type="button"
            onClick={() => {
              if (newStage.trim()) {
                const name = newStage.trim()
                setItems([...items, name])
                setMeta((current) => ({ ...current, [name]: { winPercent: 50, days: 21 } }))
                setNewStage('')
              }
            }}
            className="rounded-lg border border-slate-200 px-3 text-xs font-semibold dark:border-slate-700"
          >
            Add
          </button>
        </div>
        <button
          type="button"
          disabled={saving || items.length === 0}
          onClick={() => {
            setSaving(true)
            const nextMeta = Object.fromEntries(items.map((stage) => [stage, meta[stage] ?? { winPercent: 50, days: 21 }]))
            void onSave(items, nextMeta)
              .then(() => {
                notify('Pipeline settings saved')
                onClose()
              })
              .catch((error: unknown) => {
                notify(error instanceof ApiError ? error.message : 'Could not save pipeline')
              })
              .finally(() => setSaving(false))
          }}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save pipeline'}
        </button>
      </div>
    </Modal>
  )
}
