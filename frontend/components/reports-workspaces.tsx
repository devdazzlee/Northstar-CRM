'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, GripVertical, Plus, SlidersHorizontal, Sparkles, Table2, X } from 'lucide-react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'

const shell = 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700'
const revenue = [{ month: 'Jan', current: 42000, prior: 36000 }, { month: 'Feb', current: 52000, prior: 44000 }, { month: 'Mar', current: 48000, prior: 46000 }, { month: 'Apr', current: 69000, prior: 55000 }, { month: 'May', current: 81000, prior: 62000 }, { month: 'Jun', current: 94000, prior: 78000 }]
const records = [{ name: 'Vertex renewal', owner: 'Ahmed R.', value: '$94,000', stage: 'Proposal' }, { name: 'Northstar expansion', owner: 'Jamie C.', value: '$72,000', stage: 'Negotiation' }, { name: 'Lattice platform', owner: 'Sofia L.', value: '$51,000', stage: 'Qualified' }]
function money(value: number) { return `$${Math.round(value / 1000)}k` }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5"><div className={`${shell} max-h-[90vh] w-full max-w-2xl overflow-auto p-6`}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400"><X className="size-4" /></button></div>{children}</div></div> }
export function ReportsWorkspace({ notify }: { notify: (message: string) => void }) {
  const [chart, setChart] = useState('Trend'); const [compare, setCompare] = useState(true); const [showBuild, setShowBuild] = useState(false); const [showSchedule, setShowSchedule] = useState(false); const [showExport, setShowExport] = useState(false); const [drill, setDrill] = useState(false)
  const [chips, setChips] = useState(['This quarter', 'All owners', 'Sales pipeline'])
  const chartData = chart === 'Bars' || chart === 'Stacked' ? revenue.map((item) => ({ ...item, pipeline: item.current * .28 })) : revenue
  return <div className="p-5 lg:p-8"><div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-1 text-xs font-medium text-indigo-600">Analyze</p><h1 className="text-2xl font-semibold tracking-tight">Reports</h1><p className="mt-1 text-sm text-slate-500">Turn revenue activity into decisions your team can act on.</p></div><div className="flex flex-wrap gap-2"><button className={button} onClick={() => setShowBuild(true)}><Plus className="mr-1 inline size-3.5" />Build report</button><button className={button} onClick={() => setShowSchedule(true)}>Schedule email</button><div className="relative"><button className={button} onClick={() => setShowExport(!showExport)}><Download className="mr-1 inline size-3.5" />Export</button>{showExport && <div className="absolute right-0 top-11 z-20 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">{['CSV', 'PDF', 'Excel'].map((format) => <button key={format} onClick={() => { notify(`${format} export started`); setShowExport(false) }} className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{format}</button>)}</div>}</div></div></div>
    <div className="mb-4 flex flex-wrap gap-2">{['7d', '30d', 'This quarter', 'Custom range'].map((item) => <button key={item} onClick={() => setChips((current) => [item, ...current.slice(1)])} className={`${button} ${chips[0] === item ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' : ''}`}>{item}</button>)}<select className={button}><option>All owners</option><option>Ahmed R.</option><option>Jamie C.</option></select><select className={button}><option>Sales pipeline</option><option>Renewals</option><option>Partnerships</option></select><select className={button}><option>Group by: Month</option><option>Group by: Owner</option><option>Group by: Stage</option><option>Group by: Product</option></select><button className={button} onClick={() => notify('More report filters opened')}><SlidersHorizontal className="mr-1 inline size-3.5" />Filters</button>{chips.map((chip) => <button key={chip} onClick={() => setChips((current) => current.filter((item) => item !== chip))} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">{chip} ×</button>)}</div>
    <div className="mb-5 flex flex-wrap gap-2"><div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">{['Trend', 'Bars', 'Stacked', 'Funnel', 'Donut', 'Heatmap', 'Leaderboard'].map((item) => <button key={item} onClick={() => setChart(item)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${chart === item ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}>{item}</button>)}</div><label className="ml-auto flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />Compare prior period</label></div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]"><section className={`${shell} p-5`}><div className="mb-4 flex items-start justify-between"><div><p className="text-sm font-semibold">Revenue performance</p><p className="text-xs text-slate-500">Closed revenue by month</p></div><div className="flex gap-3 text-xs text-slate-500"><span><i className="mr-1 inline-block size-2 rounded-full bg-indigo-600" />Current</span>{compare && <span><i className="mr-1 inline-block size-2 rounded-full border border-dashed border-slate-400" />Prior period</span>}</div></div>{chart === 'Funnel' ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip /><Funnel dataKey="current" data={revenue.map((item, index) => ({ name: item.month, current: item.current, fill: ['#b7c8ff', '#7e9cff', '#526ff0', '#2438b8', '#0f1b63', '#1d4ed8'][index] }))} isAnimationActive><LabelList position="right" fill="#64748b" stroke="none" dataKey="name" /></Funnel></FunnelChart></ResponsiveContainer></div> : chart === 'Donut' ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip /><Pie data={revenue} dataKey="current" nameKey="month" innerRadius={65} outerRadius={100}>{revenue.map((_, index) => <Cell key={index} fill={['#b7c8ff', '#7e9cff', '#526ff0', '#2438b8', '#0f1b63', '#1d4ed8'][index]} />)}</Pie><Legend /></PieChart></ResponsiveContainer></div> : chart === 'Leaderboard' ? <Leaderboard onOpen={() => setDrill(true)} /> : chart === 'Heatmap' ? <Heatmap /> : <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickFormatter={money} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [money(Number(value)), 'Revenue']} /><Legend /> <Line type="monotone" dataKey="current" name="Current" stroke="#526ff0" strokeWidth={3} dot={{ r: 4 }} />{compare && <Line type="monotone" dataKey="prior" name="Prior period" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 5" dot={false} />}{chart === 'Stacked' && <Bar dataKey="pipeline" stackId="a" fill="#a5b4fc" />}</LineChart></ResponsiveContainer></div>}</section><aside className={`${shell} p-5`}><p className="mb-4 text-sm font-semibold">Saved reports</p>{['Revenue by owner', 'Pipeline coverage', 'Activity by channel', 'Win rate by segment'].map((item, index) => <div key={item} className="flex items-center justify-between border-b border-slate-100 py-3 text-sm last:border-0 dark:border-slate-800"><button onClick={() => notify(`${item} opened`)} className="text-left font-medium">{item}<span className="mt-1 block text-xs text-slate-500">Updated {index + 1}d ago</span></button><button onClick={() => setShowSchedule(true)} className="text-xs text-indigo-600">More</button></div>)}</aside></div>
    <section className={`${shell} mt-5 overflow-hidden`}><div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><div><p className="text-sm font-semibold">Underlying records</p><p className="text-xs text-slate-500">Click a row to drill down.</p></div><button className={button} onClick={() => notify('CSV export started')}>Export CSV</button></div><table className="w-full text-left text-xs"><thead><tr className="text-slate-400"><th className="px-5 py-3">Report row</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Stage</th></tr></thead><tbody>{records.map((row) => <tr key={row.name} onClick={() => setDrill(true)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"><td className="px-5 py-4 font-semibold">{row.name}</td><td className="px-5 py-4 text-slate-500">{row.owner}</td><td className="px-5 py-4 font-semibold">{row.value}</td><td className="px-5 py-4 text-slate-500">{row.stage}</td></tr>)}</tbody></table></section>
    {showBuild && <BuildReportDialog onClose={() => setShowBuild(false)} notify={notify} />}{showSchedule && <ScheduleDialog onClose={() => setShowSchedule(false)} notify={notify} />}{drill && <DrillSheet onClose={() => setDrill(false)} />}</div>
}
function Leaderboard({ onOpen }: { onOpen: () => void }) { return <div className="space-y-2">{['Ahmed R.', 'Jamie C.', 'Sofia L.', 'Marcus K.'].map((name, index) => <button key={name} onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left dark:border-slate-800"><span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{index + 1}</span><span className="flex-1 text-sm font-semibold">{name}</span><span className="text-sm font-semibold">{money(94000 - index * 13000)}</span></button>)}</div> }
function Heatmap() { return <div className="grid grid-cols-7 gap-2 pt-5">{Array.from({ length: 35 }).map((_, index) => <div key={index} title={`${index + 4} activities`} className={`aspect-square rounded-md ${['bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-500', 'bg-indigo-700'][index % 5]}`} />)}</div> }
function BuildReportDialog({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) { const [step, setStep] = useState(1); return <Modal title={`Build report · Step ${step} of 3`} onClose={onClose}><div className="mb-5 flex gap-2">{['Data source', 'Metrics & dimensions', 'Visualization'].map((item, index) => <div key={item} className={`flex-1 rounded-lg p-3 text-xs ${step === index + 1 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>{index + 1}. {item}</div>)}</div><label className="block text-xs font-medium">{step === 1 ? 'Choose data source' : step === 2 ? 'Choose metrics and dimensions' : 'Choose visualization'}<select className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"><option>{step === 1 ? 'Deals' : step === 2 ? 'Revenue · Owner · Stage' : 'Trend line'}</option><option>Contacts</option><option>Activities</option></select></label><div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><Sparkles className="mb-2 size-4 text-indigo-600" />Live preview updates as you configure the report.</div><div className="mt-5 flex justify-end gap-2"><button className={button} onClick={step === 1 ? onClose : () => setStep(step - 1)}>Back</button><button className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white" onClick={() => step < 3 ? setStep(step + 1) : (notify('Report created'), onClose())}>{step < 3 ? 'Continue' : 'Create report'}</button></div></Modal> }
function ScheduleDialog({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) { return <Modal title="Schedule report email" onClose={onClose}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Frequency<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"><option>Weekly</option><option>Daily</option><option>Monthly</option></select></label><label className="text-xs font-medium">Format<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"><option>PDF</option><option>CSV</option><option>Excel</option></select></label></div><label className="mt-4 block text-xs font-medium">Recipients<input defaultValue="sales@northstar.io" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700" /></label><button onClick={() => { notify('Report schedule saved'); onClose() }} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Save schedule</button></Modal> }
function DrillSheet({ onClose }: { onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-slate-950/35"><aside className="absolute inset-y-0 right-0 w-full max-w-lg overflow-auto border-l border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Report drill-down</h2><button onClick={onClose} aria-label="Close"><X className="size-4" /></button></div>{records.map((row) => <div key={row.name} className="mb-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">{row.owner} · {row.stage} · {row.value}</p></div>)}</aside></div> }

export function ForecastWorkspace({ notify }: { notify: (message: string) => void }) { const [quota, setQuota] = useState(250000); return <div className="p-5 lg:p-8"><PageHeading eyebrow="Forecast" title="Forecast" description="Quota, closed, and projected revenue by rep." /><div className="grid gap-4 md:grid-cols-3">{['Commit', 'Best case', 'Pipeline'].map((item, index) => <div key={item} className={`${shell} border-l-4 ${['border-l-emerald-500', 'border-l-blue-600', 'border-l-sky-500'][index]} p-5`}><p className="text-xs text-slate-500">{item}</p><p className="mt-2 text-2xl font-semibold">{money([214000, 286000, 418000][index])}</p><p className="mt-1 text-xs text-emerald-600">+{[8, 16, 24][index]}% vs quota</p></div>)}</div><div className={`${shell} mt-5 p-5`}><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Quota vs projected</p><label className="text-xs">Team quota <input type="number" value={quota} onChange={(event) => setQuota(Number(event.target.value))} className="ml-2 h-8 w-28 rounded border border-slate-200 bg-transparent px-2 dark:border-slate-700" /></label></div><div className="space-y-4">{['Ahmed R.', 'Jamie C.', 'Sofia L.'].map((rep, index) => <div key={rep}><div className="mb-1 flex justify-between text-xs"><span>{rep}</span><span>{money(quota / 3 + index * 22000)} projected</span></div><div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-3 rounded-full bg-blue-600" style={{ width: `${60 + index * 10}%` }} /></div></div>)}</div></div></div> }
export function GoalsWorkspace({ notify }: { notify: (message: string) => void }) { return <div className="p-5 lg:p-8"><PageHeading eyebrow="Analyze" title="Goals" description="Set targets and keep teams aligned." /><div className="grid gap-4 md:grid-cols-3">{['Ahmed R.', 'Jamie C.', 'Sales team'].map((name, index) => <div key={name} className={`${shell} p-5 text-center`}><div className="mx-auto grid size-28 place-items-center rounded-full border-[10px] border-blue-100 text-2xl font-bold text-blue-700 dark:border-blue-950/50">{[84, 67, 72][index]}%</div><p className="mt-4 font-semibold">{name}</p><p className="mt-1 text-xs text-slate-500">Target {money([250000, 220000, 720000][index])}</p><button onClick={() => notify('Goal editor opened')} className={`${button} mt-4`}>Edit target</button></div>)}</div></div> }
const widgetMeta: Record<string, { value: string; delta: string; up: boolean; hint: string; bar: string; track: string; chip: string; accent: string; width: string }> = {
  Revenue: { value: '$1.24M', delta: '+18.2%', up: true, hint: 'Closed this quarter', bar: 'bg-emerald-500', track: 'bg-emerald-100 dark:bg-emerald-950/40', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', accent: 'border-l-emerald-500', width: '72%' },
  Pipeline: { value: '$3.8M', delta: '+24.8%', up: true, hint: 'Weighted open deals', bar: 'bg-blue-600', track: 'bg-blue-100 dark:bg-blue-950/40', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300', accent: 'border-l-blue-600', width: '64%' },
  'Tasks due': { value: '12', delta: '3 overdue', up: false, hint: 'Due in next 48 hours', bar: 'bg-amber-500', track: 'bg-amber-100 dark:bg-amber-950/40', chip: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', accent: 'border-l-amber-500', width: '48%' },
  'Activity feed': { value: '84', delta: '+12', up: true, hint: 'Touches this week', bar: 'bg-sky-500', track: 'bg-sky-100 dark:bg-sky-950/40', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300', accent: 'border-l-sky-500', width: '80%' },
  Leaderboard: { value: '92%', delta: '+4.1%', up: true, hint: 'Quota attainment', bar: 'bg-teal-600', track: 'bg-teal-100 dark:bg-teal-950/40', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300', accent: 'border-l-teal-600', width: '92%' },
  'Top deals': { value: '6', delta: '$612k', up: true, hint: 'Closing this month', bar: 'bg-slate-700', track: 'bg-slate-200 dark:bg-slate-800', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', accent: 'border-l-slate-700', width: '58%' },
}

export function DashboardWorkspace({ notify }: { notify: (message: string) => void }) {
  const [widgets, setWidgets] = useState(['Revenue', 'Pipeline', 'Tasks due', 'Activity feed', 'Leaderboard', 'Top deals'])
  const [add, setAdd] = useState(false)
  return (
    <div className="p-5 lg:p-8">
      <PageHeading eyebrow="Workspace" title="Dashboard" description="Your customizable operating view." action="Add widget" onAction={() => setAdd(true)} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Quota progress', value: '68%', sub: '$170k of $250k', tone: 'bg-blue-600', width: '68%' },
          { label: 'Win rate', value: '24%', sub: '+2.4% vs last month', tone: 'bg-emerald-500', width: '24%' },
          { label: 'At-risk deals', value: '4', sub: '$186k needs attention', tone: 'bg-amber-500', width: '40%' },
        ].map((kpi) => (
          <div key={kpi.label} className={`${shell} overflow-hidden p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{kpi.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full rounded-full ${kpi.tone}`} style={{ width: kpi.width }} />
            </div>
          </div>
        ))}
      </div>
      <DndContext onDragEnd={(event) => { if (event.over) notify(`${String(event.active.id)} moved`) }}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => <Widget key={widget} id={widget} title={widget} meta={widgetMeta[widget] ?? widgetMeta.Revenue} />)}
        </div>
      </DndContext>
      {add && (
        <Modal title="Add widget" onClose={() => setAdd(false)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.keys(widgetMeta).map((item) => (
              <button
                key={item}
                onClick={() => { setWidgets((current) => current.includes(item) ? current : [...current, item]); setAdd(false) }}
                className="rounded-lg border border-slate-200 p-3 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-blue-950/20"
              >
                {item}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Widget({ id, title, meta }: { id: string; title: string; meta: (typeof widgetMeta)[string] }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={`${shell} min-h-40 border-l-4 ${meta.accent} p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>{title}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{meta.value}</p>
          <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
        </div>
        <button {...listeners} {...attributes} aria-label={`Move ${title}`} className="cursor-grab text-slate-400 hover:text-slate-600">
          <GripVertical className="size-4" />
        </button>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${meta.track}`}>
          <div className={`h-full rounded-full ${meta.bar}`} style={{ width: meta.width }} />
        </div>
        <span className={`shrink-0 text-xs font-semibold ${meta.up ? 'text-emerald-600' : 'text-amber-600'}`}>{meta.delta}</span>
      </div>
    </div>
  )
}

export function OverviewWorkspace({ notify }: { notify: (message: string) => void }) {
  const funnel = [
    { label: 'Leads', count: 856, width: '100%', fill: 'bg-sky-500' },
    { label: 'Qualified', count: 438, width: '72%', fill: 'bg-blue-500' },
    { label: 'Proposal', count: 192, width: '48%', fill: 'bg-blue-700' },
    { label: 'Won', count: 86, width: '28%', fill: 'bg-emerald-600' },
  ]
  return (
    <div className="p-5 lg:p-8">
      <PageHeading eyebrow="Workspace" title="CRM Overview" description="A clear view of funnel health and sales efficiency." />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Win rate', value: '24%', tone: 'border-l-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
          { label: 'Sales cycle', value: '42 days', tone: 'border-l-blue-600', chip: 'bg-blue-50 text-blue-700' },
          { label: 'Lead sources', value: '8', tone: 'border-l-sky-500', chip: 'bg-sky-50 text-sky-700' },
          { label: 'Pipeline coverage', value: '3.8×', tone: 'border-l-teal-600', chip: 'bg-teal-50 text-teal-700' },
        ].map((item) => (
          <div key={item.label} className={`${shell} border-l-4 ${item.tone} p-5`}>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.chip}`}>{item.label}</span>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>
      <div className={`${shell} mt-5 p-5`}>
        <p className="mb-4 text-sm font-semibold">Conversion funnel</p>
        {funnel.map((item) => (
          <div key={item.label} className="mb-3 flex items-center gap-3 last:mb-0">
            <span className="w-24 text-xs font-medium text-slate-500">{item.label}</span>
            <div className={`h-7 rounded-r-lg ${item.fill} shadow-sm`} style={{ width: item.width }} />
            <span className="w-10 text-right text-xs font-semibold text-slate-700 dark:text-slate-200">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action && (
        <button onClick={onAction} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700">
          {action}
        </button>
      )}
    </div>
  )
}
