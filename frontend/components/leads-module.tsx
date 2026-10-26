'use client'

import { useMemo, useState } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { ArrowDownUp, CalendarDays, Check, ChevronDown, Download, Filter, KanbanSquare, Mail, MoreHorizontal, Phone, Plus, Search, Tag, Trash2, Upload, UserRound, X } from 'lucide-react'
import {
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadOwnerMutation,
  useUpdateLeadStatusMutation,
  useUpdateLeadTagsMutation,
} from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { createCatalogRecord } from '@/lib/api/catalog'

type Lead = { id: string; name: string; email: string; company: string; source: string; score: number; status: string; owner: string; phone: string; tags?: string[]; createdAt?: string; lastActivity?: string; nextFollowUp?: string; notes?: string }
type Props = {
  leads: Lead[]
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  notify: (message: string) => void
  onOpen: (id: string) => void
  onConvert?: (lead: Lead) => void
  onImport?: () => void
}
const statuses = ['All', 'New', 'Working', 'Qualified', 'Hot', 'Lost']
const sources = ['Website', 'Referral', 'LinkedIn', 'Event', 'Outbound']
const owners = ['AR', 'JC', 'MK', 'SL']
const tags = ['Enterprise', 'SaaS', 'Priority', 'Demo']
const statusTone: Record<string, string> = { New: 'bg-slate-100 text-slate-600', Working: 'bg-amber-50 text-amber-700', Qualified: 'bg-blue-50 text-blue-700', Hot: 'bg-rose-50 text-rose-700', Lost: 'bg-slate-100 text-slate-500', Converted: 'bg-emerald-50 text-emerald-700' }

function Score({ value }: { value: number }) { return <div className="min-w-[92px]"><div className="flex items-center justify-between text-xs font-semibold"><span className={value >= 80 ? 'text-rose-600' : value >= 60 ? 'text-amber-600' : 'text-slate-600'}>{value}</span><span className="text-[10px] text-slate-400">/100</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${value >= 80 ? 'bg-rose-500' : value >= 60 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${value}%` }} /></div></div> }
function Stat({ label, value, trend, points }: { label: string; value: string | number; trend: string; points: number[] }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><p className="text-xs text-slate-500">{label}</p><span className="text-[11px] font-medium text-emerald-600">{trend}</span></div><div className="mt-2 flex items-end justify-between"><p className="text-2xl font-semibold tracking-tight">{value}</p><svg viewBox="0 0 100 26" className="h-7 w-24" aria-label={`${label} trend`} role="img"><polyline points={points.map((p, i) => `${i * 20},${26 - p / 4}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="2" /></svg></div></div> }

export function EnhancedLeadsView({ leads, setLeads, notify, onOpen, onConvert, onImport }: Props) {
  const createLead = useCreateLeadMutation()
  const updateLeadStatus = useUpdateLeadStatusMutation()
  const deleteLead = useDeleteLeadMutation()
  const updateLeadOwner = useUpdateLeadOwnerMutation()
  const updateLeadTags = useUpdateLeadTagsMutation()
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('All'); const [source, setSource] = useState('All sources'); const [owner, setOwner] = useState('All owners'); const [scoreMin, setScoreMin] = useState(''); const [tagFilter, setTagFilter] = useState('All tags'); const [view, setView] = useState<'List' | 'Kanban'>('List'); const [selected, setSelected] = useState<string[]>([]); const [showFilters, setShowFilters] = useState(false); const [showForm, setShowForm] = useState(false); const [showActions, setShowActions] = useState<string | null>(null); const [savedView, setSavedView] = useState('Default view'); const [formError, setFormError] = useState(''); const [pageSize, setPageSize] = useState('25');
  const [form, setForm] = useState({ name: '', email: '', company: '', source: 'Website', status: 'New', owner: 'AR', phone: '', tags: '', notes: '' })
  const filtered = useMemo(() => leads.filter((lead) => (status === 'All' || lead.status === status) && (source === 'All sources' || lead.source === source) && (owner === 'All owners' || lead.owner === owner) && (!scoreMin || lead.score >= Number(scoreMin)) && (tagFilter === 'All tags' || lead.tags?.includes(tagFilter)) && `${lead.name} ${lead.email} ${lead.company} ${lead.status} ${lead.source}`.toLowerCase().includes(query.toLowerCase())), [leads, query, status, source, owner, scoreMin, tagFilter])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((lead) => lead.id))
  const updateStatus = (id: string, next: string) => {
    setLeads((items) => items.map((lead) => (lead.id === id ? { ...lead, status: next } : lead)))
    void updateLeadStatus.mutateAsync({ id, status: next }).then(
      () => notify(`Lead moved to ${next}`),
      (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not update lead'),
    )
  }
  const saveLead = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setFormError('Enter a name and valid email address')
      return
    }
    const score = form.status === 'Hot' ? 88 : form.status === 'Qualified' ? 72 : 45
    const parsedTags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    void createLead
      .mutateAsync({
        name: form.name,
        email: form.email,
        company: form.company,
        source: form.source,
        status: form.status,
        owner: form.owner,
        phone: form.phone,
        notes: form.notes,
        score,
        tags: parsedTags,
      })
      .then((lead) => {
        setShowForm(false)
        setFormError('')
        setForm({ name: '', email: '', company: '', source: 'Website', status: 'New', owner: 'AR', phone: '', tags: '', notes: '' })
        notify(`${lead.name} added as a lead`)
      })
      .catch((error: unknown) => {
        setFormError(error instanceof ApiError ? error.message : 'Could not create lead')
      })
  }
  const exportCsv = () => { const csv = ['Name,Email,Company,Source,Score,Status,Owner', ...filtered.map((lead) => [lead.name, lead.email, lead.company, lead.source, lead.score, lead.status, lead.owner].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = 'northstar-leads.csv'; link.click(); URL.revokeObjectURL(url); notify('Leads CSV exported') }
  const bulk = (action: string) => {
    if (!selected.length) return notify('Select at least one lead')
    const ids = [...selected]
    if (action === 'Delete') {
      void Promise.all(ids.map((id) => deleteLead.mutateAsync(id))).then(
        () => {
          setSelected([])
          notify(`Deleted ${ids.length} leads`)
        },
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Bulk delete failed'),
      )
      return
    }
    if (action === 'Change status') {
      void Promise.all(ids.map((id) => updateLeadStatus.mutateAsync({ id, status: 'Working' }))).then(
        () => {
          setSelected([])
          notify(`Updated status for ${ids.length} leads`)
        },
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Bulk status update failed'),
      )
      return
    }
    if (action === 'Assign owner') {
      void Promise.all(ids.map((id) => updateLeadOwner.mutateAsync({ id, ownerName: 'AR' }))).then(
        () => {
          setSelected([])
          notify(`Assigned owner on ${ids.length} leads`)
        },
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Bulk assign failed'),
      )
      return
    }
    if (action === 'Send email') {
      void Promise.all(
        ids.map((id) => {
          const lead = leads.find((row) => row.id === id)
          return createCatalogRecord('activities', {
            type: 'email',
            subject: `Bulk email · ${lead?.name || id}`,
            body: `Queued outreach to ${lead?.email || 'lead'}`,
            relatedType: 'lead',
            relatedId: id,
            actorName: 'You',
            occurredAt: new Date().toISOString(),
          })
        }),
      ).then(
        () => {
          setSelected([])
          notify(`Logged email activity for ${ids.length} leads`)
        },
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Bulk email log failed'),
      )
      return
    }
    if (action === 'Add tag') {
      void Promise.all(
        ids.map((id) => {
          const lead = leads.find((row) => row.id === id)
          const tags = Array.from(new Set([...(lead?.tags ?? []), 'Priority']))
          return updateLeadTags.mutateAsync({ id, tags })
        }),
      ).then(
        () => {
          setSelected([])
          notify(`Added Priority tag to ${ids.length} leads`)
        },
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Bulk tag update failed'),
      )
      return
    }
    setSelected([])
    notify(`${action} applied to selected leads`)
  }
  const filtersActive = [source !== 'All sources' ? source : '', owner !== 'All owners' ? owner : '', scoreMin ? `Score ${scoreMin}+` : '', tagFilter !== 'All tags' ? tagFilter : ''].filter(Boolean)
  const logLeadActivity = (lead: Lead, type: string, subject: string, body: string) =>
    createCatalogRecord('activities', {
      type,
      subject,
      body,
      relatedType: 'lead',
      relatedId: lead.id,
      actorName: 'You',
      occurredAt: new Date().toISOString(),
    })
  const runLeadAction = (action: string, lead: Lead) => {
    if (action === 'Delete') {
      void deleteLead.mutateAsync(lead.id).then(
        () => notify(`${lead.name} deleted`),
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Delete failed'),
      )
      return
    }
    if (action === 'Edit') {
      onOpen(lead.id)
      return
    }
    if (action === 'Assign') {
      void updateLeadOwner.mutateAsync({ id: lead.id, ownerName: 'AR' }).then(
        () => notify(`${lead.name} assigned to AR`),
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Assign failed'),
      )
      return
    }
    if (action === 'Log call' || action === 'Contact') {
      void logLeadActivity(lead, 'call', `Call · ${lead.name}`, `Logged outreach to ${lead.phone || lead.email || lead.name}`).then(
        () => notify(`Call logged for ${lead.name}`),
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not log call'),
      )
      return
    }
    if (action === 'Send email') {
      void logLeadActivity(lead, 'email', `Email · ${lead.name}`, `Queued outreach to ${lead.email || lead.name}`).then(
        () => notify(`Email activity logged for ${lead.name}`),
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not log email'),
      )
      return
    }
    if (action === 'Add to campaign') {
      void logLeadActivity(lead, 'note', `Campaign · ${lead.name}`, `Marked for campaign enrollment`).then(
        () => notify(`${lead.name} flagged for campaign`),
        (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not flag lead'),
      )
      return
    }
    notify(`${action} flow opened for ${lead.name}`)
  }
  return <div className="p-5 lg:p-8">
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-xs font-medium text-indigo-600">Manage</p><h1 className="text-2xl font-semibold tracking-tight">Leads</h1><p className="mt-1 text-sm text-slate-500">Qualify demand and turn the right conversations into pipeline</p></div><button onClick={() => setShowForm(true)} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white"><Plus className="size-4" />Add lead</button></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total leads" value={leads.length} trend="" points={[8, 12, 10, 17, 21]} /><Stat label="Hot leads" value={leads.filter((lead) => lead.status === 'Hot').length} trend="" points={[5, 8, 7, 15, 20]} /><Stat label="Conversion rate" value={`${Math.round((leads.filter((lead) => lead.status === 'Converted' || lead.status === 'Qualified').length / Math.max(leads.length, 1)) * 1000) / 10}%`} trend="" points={[10, 8, 13, 12, 18]} /><Stat label="Avg score" value={Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(leads.length, 1))} trend="" points={[8, 11, 9, 15, 18]} /></div>
    <div className="mb-4 flex flex-wrap items-center gap-2">{statuses.map((item) => <button key={item} onClick={() => setStatus(item)} className={`rounded-lg px-3 py-2 text-xs font-medium ${status === item ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-500'}`}>{item} <span className="ml-1 text-[10px] text-slate-400">{item === 'All' ? leads.length : leads.filter((lead) => lead.status === item).length}</span></button>)}<div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"><button aria-label="List view" onClick={() => setView('List')} className={`rounded-md p-1.5 ${view === 'List' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}><ListIcon /></button><button aria-label="Kanban view" onClick={() => setView('Kanban')} className={`rounded-md p-1.5 ${view === 'Kanban' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}><KanbanSquare className="size-4" /></button></div></div>
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads, companies, status..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" /></div><button onClick={() => setShowFilters(!showFilters)} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"><Filter className="size-3.5" />Filters{filtersActive.length > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{filtersActive.length}</span>}</button><select value={savedView} onChange={(event) => setSavedView(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>Default view</option><option>Hot leads</option><option>My leads</option><option>Create saved view</option></select><button onClick={() => (onImport ? onImport() : notify('Open Import from the sidebar'))} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"><Upload className="size-3.5" />Import CSV</button><button onClick={exportCsv} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"><Download className="size-3.5" />Export</button></div>
      {(showFilters || filtersActive.length > 0) && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"><select value={source} onChange={(event) => setSource(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>All sources</option>{sources.map((item) => <option key={item}>{item}</option>)}</select><select value={owner} onChange={(event) => setOwner(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>All owners</option>{owners.map((item) => <option key={item}>{item}</option>)}</select><select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>All tags</option>{tags.map((item) => <option key={item}>{item}</option>)}</select><input value={scoreMin} onChange={(event) => setScoreMin(event.target.value.replace(/\D/g, ''))} placeholder="Min score" className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900" />{filtersActive.map((filter) => <button key={filter} onClick={() => { if (filter === source) setSource('All sources'); if (filter === owner) setOwner('All owners'); if (filter === tagFilter) setTagFilter('All tags'); if (filter.startsWith('Score')) setScoreMin('') }} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{filter}<X className="size-3" /></button>)}<button onClick={() => { setSource('All sources'); setOwner('All owners'); setTagFilter('All tags'); setScoreMin('') }} className="text-xs font-medium text-indigo-600">Clear all</button></div>}
      {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50/60 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/20"><span className="text-xs font-semibold text-indigo-700">{selected.length} selected</span>{['Assign owner', 'Change status', 'Add tag', 'Send email', 'Delete'].map((action) => <button key={action} onClick={() => bulk(action)} className="rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-slate-900">{action}</button>)}</div>}
      {view === 'Kanban' ? <Kanban leads={filtered} onOpen={onOpen} onMove={updateStatus} /> : <LeadTable leads={filtered} selected={selected} setSelected={setSelected} toggleAll={toggleAll} onOpen={onOpen} onConvert={(lead) => { onConvert ? onConvert(lead) : updateStatus(lead.id, 'Converted') }} notify={notify} showActions={showActions} setShowActions={setShowActions} onAction={runLeadAction} />}
      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><span>Showing {Math.min(Number(pageSize), filtered.length)} of {filtered.length}</span><label className="flex items-center gap-2">Rows per page <select value={pageSize} onChange={(event) => setPageSize(event.target.value)} className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"><option>25</option><option>50</option><option>100</option></select></label><div className="flex gap-1"><button className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700">Previous</button><button className="rounded bg-indigo-600 px-2 py-1 text-white">1</button><button className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700">2</button><button className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700">Next</button></div></div>
    </div>
    {showForm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={saveLead} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold">Add lead</h2><p className="mt-1 text-xs text-slate-500">Create a lead record for your team.</p></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X className="size-4" /></button></div><div className="grid gap-4 sm:grid-cols-2">{[['name','Full name','text'],['email','Email','email'],['company','Company','text'],['phone','Phone','text']].map(([key, label, type]) => <label key={key} className="text-xs font-medium">{label}<input required={key !== 'phone'} type={type} value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700" /></label>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-xs font-medium">Source<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700">{sources.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700">{statuses.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-medium">Owner<select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700">{owners.map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="mt-4 block text-xs font-medium">Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Enterprise, Priority" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700" /></label><label className="mt-4 block text-xs font-medium">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add context for the sales team" className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" /></label>{formError && <p className="mt-3 text-xs text-rose-600" role="alert">{formError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-2 text-sm text-slate-500">Cancel</button><button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Save lead</button></div></form></div>}
  </div>
}

function ListIcon() { return <span className="inline-flex flex-col gap-0.5"><span className="h-px w-3.5 bg-current" /><span className="h-px w-3.5 bg-current" /><span className="h-px w-3.5 bg-current" /></span> }
function LeadTable({ leads, selected, setSelected, toggleAll, onOpen, onConvert, notify, showActions, setShowActions, onAction }: { leads: Lead[]; selected: string[]; setSelected: React.Dispatch<React.SetStateAction<string[]>>; toggleAll: () => void; onOpen: (id: string) => void; onConvert: (lead: Lead) => void; notify: (message: string) => void; showActions: string | null; setShowActions: (id: string | null) => void; onAction: (action: string, lead: Lead) => void }) { return <div className="overflow-x-auto"><table className="w-full min-w-[1240px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/50"><tr><th className="w-10 px-4 py-3"><input type="checkbox" checked={leads.length > 0 && selected.length === leads.length} onChange={toggleAll} aria-label="Select all leads" /></th>{['Lead', 'Source', 'Score', 'Status', 'Owner', 'Tags', 'Created', 'Last activity', 'Next follow-up', 'Contact', ''].map((header) => <th key={header} className="px-3 py-3">{header}{header === 'Score' && <ArrowDownUp className="ml-1 inline size-3" />}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/30"><td className="px-4 py-3"><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => setSelected((items) => items.includes(lead.id) ? items.filter((item) => item !== lead.id) : [...items, lead.id])} aria-label={`Select ${lead.name}`} /></td><td className="px-3 py-3"><button onClick={() => onOpen(lead.id)} className="flex min-w-[190px] items-center gap-2 text-left"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{lead.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><p className="font-medium">{lead.name}</p><p className="text-xs text-slate-400">{lead.company} · {lead.email}</p></span></button></td><td className="px-3 py-3 text-xs text-slate-500">{lead.source}</td><td className="px-3 py-3"><Score value={lead.score} /></td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusTone[lead.status] || statusTone.New}`}>{lead.status}</span></td><td className="px-3 py-3"><span className="flex items-center gap-1.5 text-xs"><span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">{lead.owner}</span>{lead.owner}</span></td><td className="px-3 py-3"><div className="flex max-w-[100px] flex-wrap gap-1">{(lead.tags || []).slice(0, 2).map((tag) => <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{tag}</span>)}</div></td><td className="px-3 py-3 text-xs text-slate-500">{lead.createdAt || '—'}</td><td className="px-3 py-3 text-xs text-slate-500">{lead.lastActivity || '—'}</td><td className="px-3 py-3 text-xs text-slate-500">{lead.nextFollowUp || '—'}</td><td className="px-3 py-3"><button onClick={() => onAction('Contact', lead)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium dark:border-slate-700">Contact</button></td><td className="relative px-3 py-3"><button aria-label={`Actions for ${lead.name}`} onClick={() => setShowActions(showActions === lead.id ? null : lead.id)}><MoreHorizontal className="size-4 text-slate-400" /></button>{showActions === lead.id && <div className="absolute right-2 top-10 z-10 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{['Edit', 'Assign', 'Log call', 'Send email', 'Add to campaign', 'Delete'].map((action) => <button key={action} onClick={() => { setShowActions(null); onAction(action, lead) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"><UserRound className="size-3.5" />{action}</button>)}</div>}</td><td className="px-3 py-3"><button onClick={() => onConvert(lead)} disabled={lead.status === 'Converted'} className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">Convert</button></td></tr>)}</tbody></table>{leads.length === 0 && <div className="flex flex-col items-center gap-2 px-6 py-14 text-center"><Search className="size-8 text-slate-300" /><p className="text-sm font-semibold">No leads found</p><p className="text-xs text-slate-500">Try adjusting your filters or create a new lead.</p></div>}</div> }
function Kanban({ leads, onOpen, onMove }: { leads: Lead[]; onOpen: (id: string) => void; onMove: (id: string, status: string) => void }) { return <DndContext onDragEnd={(event: DragEndEvent) => { if (event.over) onMove(String(event.active.id), String(event.over.id)) }}><div className="grid gap-4 overflow-x-auto p-4 lg:grid-cols-5">{statuses.slice(1).map((column) => <KanbanColumn key={column} status={column} leads={leads.filter((lead) => lead.status === column)} onOpen={onOpen} />)}</div></DndContext> }
function KanbanColumn({ status, leads, onOpen }: { status: string; leads: Lead[]; onOpen: (id: string) => void }) { const { setNodeRef, isOver } = useDroppable({ id: status }); return <div ref={setNodeRef} className={`min-h-[240px] min-w-[230px] rounded-lg bg-slate-50 p-3 transition ${isOver ? 'ring-2 ring-indigo-300' : ''}`}><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">{status}</span><span className="text-[10px] text-slate-400">{leads.length}</span></div>{leads.map((lead) => <KanbanCard key={lead.id} lead={lead} onOpen={onOpen} />)}</div> }
function KanbanCard({ lead, onOpen }: { lead: Lead; onOpen: (id: string) => void }) { const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id }); return <button ref={setNodeRef} style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined} {...listeners} {...attributes} onClick={() => onOpen(lead.id)} className="mb-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between"><p className="text-sm font-medium">{lead.name}</p><span className="text-xs font-semibold text-indigo-600">{lead.score}</span></div><p className="mt-1 text-xs text-slate-400">{lead.company}</p><div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>{lead.source}</span><span>{lead.owner}</span></div></button> }
