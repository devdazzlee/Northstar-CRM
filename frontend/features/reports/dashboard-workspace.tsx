'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import { QueryGate } from '@/components/ui/query-gate'
import { useDashboardQuery, useDealsQuery, useTasksQuery, useUpdateTaskStatusMutation } from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { dealStageFromApi, formatMoneyCents, parseAmountToCents } from '@/lib/api/mappers'
import { money, ui } from './shared'

type DashDeal = {
  id: string
  name: string
  company: string
  stage: string
  amount: number
  owner: string
  prob: number
  attention?: boolean
}
type DashTask = { id: string; title: string; time: string; priority: 'High' | 'Medium' | 'Low' }
type DashActivity = {
  id: string
  text: string
  time: string
  href: 'Deals' | 'Activities' | 'Leads' | 'Contacts' | 'Tasks'
}

const rangeConfig: Record<string, { months: number; factor: number; funnel: number; label: string }> = {
  'Last 7 days': { months: 2, factor: 0.42, funnel: 0.55, label: 'last 7 days' },
  'Last 30 days': { months: 4, factor: 0.72, funnel: 0.78, label: 'last 30 days' },
  'This quarter': { months: 6, factor: 1, funnel: 1, label: 'this quarter' },
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `$${value}`
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DashboardWorkspace({
  notify,
  onNavigate,
  onOpenDeal,
  onCreate,
}: {
  notify: (message: string) => void
  onNavigate: (view: string) => void
  onOpenDeal: (id: string) => void
  onCreate: () => void
}) {
  const dashboardQuery = useDashboardQuery()
  const dealsQuery = useDealsQuery()
  const tasksQuery = useTasksQuery()
  const updateTaskStatus = useUpdateTaskStatusMutation()
  const dashboard = dashboardQuery.data
  const [range, setRange] = useState('This quarter')
  const [ownerFilter, setOwnerFilter] = useState('All owners')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [showFilters, setShowFilters] = useState(false)
  const apiTasks = tasksQuery.data ?? []
  const tasks: DashTask[] = apiTasks
    .filter((task) => String(task.status).toLowerCase() !== 'done')
    .slice(0, 8)
    .map((task) => ({
      id: task.id,
      title: task.title,
      time: task.due,
      priority: (task.priority === 'High' || task.priority === 'Medium' || task.priority === 'Low'
        ? task.priority
        : 'Medium') as DashTask['priority'],
    }))
  const [localActivity, setLocalActivity] = useState<DashActivity[]>([])
  const activity: DashActivity[] = [
    ...localActivity,
    ...(dealsQuery.data ?? []).slice(0, 6).map((deal, index) => ({
      id: deal.id,
      text: `${deal.name} · ${deal.stage} · ${deal.company}`,
      time: `${index + 1}h`,
      href: 'Deals' as const,
    })),
  ]

  const config = rangeConfig[range] ?? rangeConfig['This quarter']

  const chartData = useMemo(() => {
    const pipeline = dashboard?.pipeline ?? []
    if (pipeline.length === 0) return []
    return pipeline.map((row) => ({
      month: dealStageFromApi(row.stage).slice(0, 3),
      current: Math.round(row.amountCents / 100),
      prior: Math.round((row.amountCents / 100) * 0.85),
    }))
  }, [dashboard])

  const funnelBars = useMemo(() => {
    if (dashboard?.pipeline?.length) {
      const colors = ['#94A3B8', '#64748B', '#3B82F6', '#059669', '#6366F1', '#F43F5E']
      return dashboard.pipeline.map((row, index) => ({
        name: dealStageFromApi(row.stage),
        value: Math.max(row.count, 0),
        fill: colors[index % colors.length],
      }))
    }
    const base = [
      { name: 'Leads', value: dashboard?.counts.leads ?? 0, fill: '#94A3B8' },
      { name: 'Qualified', value: Math.max(1, Math.round((dashboard?.counts.deals ?? 0) * 0.6)), fill: '#64748B' },
      { name: 'Proposal', value: Math.max(1, Math.round((dashboard?.counts.deals ?? 0) * 0.3)), fill: '#3B82F6' },
      { name: 'Won', value: dashboard?.won.count ?? 0, fill: '#059669' },
    ]
    return base.map((stage) => ({ ...stage, value: Math.max(0, Math.round(stage.value * config.funnel)) }))
  }, [config, dashboard])

  const liveDeals: DashDeal[] = useMemo(
    () =>
      (dealsQuery.data ?? []).map((deal) => ({
        id: deal.id,
        name: deal.name,
        company: deal.company,
        stage: deal.stage,
        amount: parseAmountToCents(deal.amount) / 100,
        owner: deal.owner,
        prob: deal.probability,
        attention: deal.probability < 50,
      })),
    [dealsQuery.data],
  )

  const filteredDeals = useMemo(
    () =>
      liveDeals.filter(
        (deal) =>
          (ownerFilter === 'All owners' || deal.owner === ownerFilter) &&
          (stageFilter === 'All stages' || deal.stage === stageFilter),
      ),
    [liveDeals, ownerFilter, stageFilter],
  )

  const closedRevenue = useMemo(
    () => (dashboard ? dashboard.won.amountCents / 100 : chartData.reduce((sum, row) => sum + row.current, 0)),
    [dashboard, chartData],
  )
  const priorRevenue = useMemo(() => chartData.reduce((sum, row) => sum + row.prior, 0), [chartData])
  const pipelineValue = useMemo(
    () =>
      dashboard?.pipeline
        ? dashboard.pipeline.reduce((sum, row) => sum + row.amountCents / 100, 0)
        : filteredDeals.reduce((sum, deal) => sum + deal.amount * (deal.prob / 100), 0),
    [dashboard, filteredDeals],
  )
  const winRate = funnelBars[0]?.value
    ? Math.round(((funnelBars[funnelBars.length - 1]?.value ?? 0) / funnelBars[0].value) * 1000) / 10
    : 0
  const openTaskCount = dashboard?.counts.tasksTodo ?? tasks.length
  const overdueCount = tasks.filter((task) => task.priority === 'High').length
  const attentionDeals = filteredDeals.filter((deal) => deal.attention).length
  const revenueDelta = priorRevenue ? (((closedRevenue - priorRevenue) / priorRevenue) * 100).toFixed(1) : '0.0'

  const kpis = [
    {
      label: 'Closed revenue',
      value: dashboard ? formatMoneyCents(dashboard.won.amountCents) : formatMoney(closedRevenue),
      delta: `${Number(revenueDelta) >= 0 ? '+' : ''}${revenueDelta}%`,
      up: Number(revenueDelta) >= 0,
      onClick: () => onNavigate('Reports'),
    },
    {
      label: 'Pipeline',
      value: formatMoney(pipelineValue),
      delta: `${filteredDeals.length} deals`,
      up: true,
      onClick: () => onNavigate('Deals'),
    },
    {
      label: 'Win rate',
      value: `${winRate}%`,
      delta: '+2.4%',
      up: true,
      onClick: () => onNavigate('CRM Overview'),
    },
    {
      label: 'Open tasks',
      value: String(openTaskCount),
      delta: `${overdueCount} high priority`,
      up: overdueCount === 0,
      onClick: () => onNavigate('Tasks'),
    },
  ]

  const exportRevenue = () => {
    downloadCsv(`northstar-revenue-${range.replaceAll(' ', '-').toLowerCase()}.csv`, [
      ['Month', 'Current', 'Prior'],
      ...chartData.map((row) => [row.month, String(row.current), String(row.prior)]),
    ])
    notify('Revenue CSV downloaded')
  }

  const toggleTask = (id: string) => {
    const task = tasks.find((item) => item.id === id)
    if (!task) return
    void updateTaskStatus.mutateAsync({ id, status: 'Done' }).then(
      () => {
        setLocalActivity((rows) =>
          [
            { id: `a-${Date.now()}`, text: `You completed “${task.title}”`, time: 'Just now', href: 'Tasks' as const },
            ...rows,
          ].slice(0, 8),
        )
        notify(`Completed “${task.title}”`)
      },
      (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not complete task'),
    )
  }

  const clearFilters = () => {
    setOwnerFilter('All owners')
    setStageFilter('All stages')
  }

  return (
    <QueryGate
      isLoading={dashboardQuery.isLoading || dealsQuery.isLoading || tasksQuery.isLoading}
      isError={dashboardQuery.isError}
      error={dashboardQuery.error}
      onRetry={() => void dashboardQuery.refetch()}
      loadingLabel="Loading dashboard…"
      errorTitle="Could not load dashboard"
    >
    <div className="p-5 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-500">Monday, October 26</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
            Good morning, Ahmed
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {attentionDeals} deals need attention · {openTaskCount} open tasks · viewing {config.label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
            {Object.keys(rangeConfig).map((item) => (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${range === item ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters((open) => !open)}
            className={`${ui.button} bg-white dark:bg-slate-900 ${showFilters || ownerFilter !== 'All owners' || stageFilter !== 'All stages' ? 'border-blue-300 text-blue-700' : ''}`}
          >
            <SlidersHorizontal className="mr-1.5 inline size-3.5" />
            Filters{ownerFilter !== 'All owners' || stageFilter !== 'All stages' ? ' · on' : ''}
          </button>
          <button
            onClick={onCreate}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <Plus className="mr-1 inline size-3.5" />
            Create
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={`${ui.shell} mb-5 flex flex-wrap items-end gap-3 p-4`}>
          <label className="text-xs font-medium text-slate-600">
            Owner
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="mt-1.5 block h-9 min-w-[140px] rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
            >
              {['All owners', 'AR', 'JC', 'SL', 'MK'].map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Stage
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="mt-1.5 block h-9 min-w-[160px] rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
            >
              {['All stages', 'Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Qualification'].map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </label>
          <button onClick={clearFilters} className={`${ui.button} !py-2`}>
            Clear
          </button>
          <p className="ml-auto text-xs text-slate-500">{filteredDeals.length} deals match</p>
        </div>
      )}

      <div
        className={`${ui.shell} mb-5 grid grid-cols-2 divide-y divide-slate-100 overflow-hidden sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800`}
      >
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.onClick}
            className="px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{kpi.value}</p>
              <span
                className={`mb-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold ${kpi.up ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {kpi.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {kpi.delta}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className={`${ui.shell} p-5`}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue performance</h2>
              <p className="mt-0.5 text-xs text-slate-500">Closed vs prior period · {config.label}</p>
            </div>
            <button onClick={exportRevenue} className={`${ui.button} !py-1.5`}>
              <Download className="mr-1 inline size-3.5" />
              Export
            </button>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={money}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), 'Revenue']}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="prior"
                  name="Prior"
                  stroke="#CBD5E1"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="none"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  name="Current"
                  stroke="#2563EB"
                  strokeWidth={2.25}
                  fill="url(#dashRevenueFill)"
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${ui.shell} flex flex-col p-5`}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Conversion funnel</h2>
              <p className="mt-0.5 text-xs text-slate-500">Lead → won · {config.label}</p>
            </div>
            <button
              onClick={() => onNavigate('CRM Overview')}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Open CRM overview"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {funnelBars.map((stage, index) => (
              <button
                key={stage.name}
                type="button"
                onClick={() => onNavigate(index === 0 ? 'Leads' : 'Deals')}
                className="block w-full text-left"
              >
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{stage.name}</span>
                  <span className="tabular-nums text-slate-500">{stage.value.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(12, 100 - index * 22)}%`, backgroundColor: stage.fill }}
                  />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-lg font-semibold tabular-nums">{winRate}%</p>
              <p className="text-[11px] text-slate-400">Lead to win</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-emerald-600">+2.4%</p>
              <p className="text-[11px] text-slate-400">vs last month</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr] xl:grid-cols-[1.4fr_1fr_1fr]">
        <section className={`${ui.shell} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pipeline focus</h2>
              <p className="mt-0.5 text-sm text-slate-500">{filteredDeals.length} open opportunities</p>
            </div>
            <button
              onClick={() => onNavigate('Deals')}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300"
            >
              View all <ChevronRight className="ml-0.5 inline size-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3.5 font-medium">Deal</th>
                  <th className="px-3 py-3.5 font-medium">Stage</th>
                  <th className="px-3 py-3.5 font-medium">Prob.</th>
                  <th className="px-5 py-3.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No deals match these filters.
                    </td>
                  </tr>
                )}
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => onOpenDeal(deal.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{deal.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {deal.company} · {deal.owner}
                        {deal.attention ? ' · needs attention' : ''}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
                            style={{ width: `${deal.prob}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-slate-500">{deal.prob}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatMoney(deal.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${ui.shell} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Today&apos;s focus</h2>
              <p className="mt-0.5 text-sm text-slate-500">{openTaskCount} remaining</p>
            </div>
            <Clock3 className="size-4 text-slate-400" />
          </div>
          <div className="space-y-1">
            {tasks.map((task) => {
              return (
                <button
                  key={task.id}
                  type="button"
                  disabled={updateTaskStatus.isPending}
                  onClick={() => toggleTask(task.id)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800/60"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 dark:border-slate-600">
                    <Check className="size-3 opacity-0" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-5 text-slate-800 dark:text-slate-100">
                      {task.title}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays className="size-3.5" />
                      {task.time}
                      <span className={task.priority === 'High' ? 'font-semibold text-amber-600' : ''}>
                        {task.priority}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => onNavigate('Tasks')}
            className="mt-3 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300"
          >
            Open task list <ChevronRight className="ml-0.5 inline size-3.5" />
          </button>
        </section>

        <section className={`${ui.shell} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent activity</h2>
              <p className="mt-0.5 text-sm text-slate-500">Across your workspace</p>
            </div>
          </div>
          <div className="space-y-0">
            {activity.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.href)}
                className="flex w-full gap-3 border-b border-slate-50 py-3.5 text-left last:border-0 hover:bg-slate-50/80 dark:border-slate-800/50 dark:hover:bg-slate-800/40"
              >
                <span
                  className={`mt-2 size-2 shrink-0 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
                    {item.text}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    {item.time === 'Just now' ? item.time : `${item.time} ago`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
    </QueryGate>
  )
}
