'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight, ContactRound, Mail, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { SEARCH_RESULT_LIMIT } from '@/lib/constants'
import { crmKeys } from '@/lib/api/crm'
import type { UiDeal } from '@/lib/api/mappers'
import { ui } from '@/lib/ui'
import { contactFormSchema, type ContactFormValues } from '@/lib/validators/contact'
import type { Company, Contact, Lead, View } from '@/lib/types'

const QUICK_CREATE_ITEMS = [
  ['Contact', ContactRound],
  ['Company', Building2],
  ['Deal', BriefcaseBusiness],
  ['Task', Check],
  ['Note', Mail],
  ['Event', CalendarDays],
] as const

export type QuickCreateLabel = (typeof QUICK_CREATE_ITEMS)[number][0]

export type QuickEntityKind = Exclude<QuickCreateLabel, 'Contact'>

type QuickCreateProps = {
  onClose: () => void
  onAction: (label: QuickCreateLabel) => void
}

export function QuickCreate({ onClose, onAction }: QuickCreateProps) {
  return (
    <Modal title="Quick create" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_CREATE_ITEMS.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => onAction(label)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left text-sm font-medium hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-950/20"
          >
            <Icon className="size-4 text-blue-600" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </Modal>
  )
}

type ContactDialogProps = {
  onClose: () => void
  onSubmit: (values: ContactFormValues) => void | Promise<void>
  isSubmitting?: boolean
}

export function ContactDialog({ onClose, onSubmit, isSubmitting = false }: ContactDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', company: '' },
  })

  return (
    <Modal title="Add contact" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <label className="text-xs font-medium">
          Full name
          <input {...register('name')} placeholder="e.g. Jordan Lee" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.name)} />
          {errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Email
          <input {...register('email')} type="email" placeholder="jordan@company.com" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.email)} />
          {errors.email && <span className="mt-1 block text-[11px] text-rose-600">{errors.email.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Company
          <input {...register('company')} placeholder="Company name" className={`${ui.input} mt-1.5 h-10 w-full`} aria-invalid={Boolean(errors.company)} />
          {errors.company && <span className="mt-1 block text-[11px] text-rose-600">{errors.company.message}</span>}
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={ui.buttonPrimary}>
            {isSubmitting ? 'Saving…' : 'Add contact'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type QuickEntityDialogProps = {
  kind: QuickEntityKind
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void | Promise<void>
  isSubmitting?: boolean
  defaultOwner?: string
}

export function QuickEntityDialog({
  kind,
  onClose,
  onSubmit,
  isSubmitting = false,
  defaultOwner = 'You',
}: QuickEntityDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => defaultValuesFor(kind, defaultOwner))
  const fields = fieldsFor(kind)

  return (
    <Modal title={`Create ${kind.toLowerCase()}`} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(values)
        }}
      >
        {fields.map((field) => (
          <label key={field.key} className="text-xs font-medium">
            {field.label}
            {field.type === 'select' ? (
              <select
                className={`${ui.input} mt-1.5 h-10 w-full`}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                className={`${ui.input} mt-1.5 h-10 w-full`}
                type={field.type || 'text'}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={ui.buttonPrimary}>
            {isSubmitting ? 'Saving…' : `Create ${kind.toLowerCase()}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function defaultValuesFor(kind: QuickEntityKind, owner: string): Record<string, string> {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  if (kind === 'Company') return { name: '', industry: 'Services', size: '1-50', owner }
  if (kind === 'Deal') return { name: '', company: '', amount: '10000', stage: 'Qualified' }
  if (kind === 'Task') return { title: '', due: tomorrow, assignee: owner, priority: 'Medium' }
  if (kind === 'Note') return { subject: '', body: '' }
  return { title: '', startsAt: new Date().toISOString().slice(0, 16), location: '' }
}

type QuickField = {
  key: string
  label: string
  required?: boolean
  placeholder?: string
  type?: 'text' | 'date' | 'datetime-local' | 'select'
  options?: string[]
}

function fieldsFor(kind: QuickEntityKind): QuickField[] {
  if (kind === 'Company') {
    return [
      { key: 'name', label: 'Company name', required: true, placeholder: 'Acme Inc.' },
      { key: 'industry', label: 'Industry', required: true },
      { key: 'size', label: 'Size', type: 'select', options: ['1-50', '51-200', '201-1000', '1000+'] },
      { key: 'owner', label: 'Owner', required: true },
    ]
  }
  if (kind === 'Deal') {
    return [
      { key: 'name', label: 'Deal name', required: true, placeholder: 'Expansion' },
      { key: 'company', label: 'Company', required: true },
      { key: 'amount', label: 'Amount', required: true },
      {
        key: 'stage',
        label: 'Stage',
        type: 'select',
        options: ['Qualification', 'Discovery', 'Proposal', 'Negotiation'],
      },
    ]
  }
  if (kind === 'Task') {
    return [
      { key: 'title', label: 'Title', required: true },
      { key: 'due', label: 'Due date', type: 'date', required: true },
      { key: 'assignee', label: 'Assignee', required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
    ]
  }
  if (kind === 'Note') {
    return [
      { key: 'subject', label: 'Subject', required: true },
      { key: 'body', label: 'Body', required: true, placeholder: 'Write a note…' },
    ]
  }
  return [
    { key: 'title', label: 'Event title', required: true },
    { key: 'startsAt', label: 'Starts at', type: 'datetime-local', required: true },
    { key: 'location', label: 'Location', placeholder: 'Zoom / office' },
  ]
}

type SearchDialogProps = {
  query: string
  setQuery: (value: string) => void
  onClose: () => void
  onSelect: (view: View) => void
}

export function SearchDialog({ query, setQuery, onClose, onSelect }: SearchDialogProps) {
  const client = useQueryClient()
  const contacts = client.getQueryData<Contact[]>(crmKeys.contacts()) ?? []
  const companies = client.getQueryData<Company[]>(crmKeys.companies()) ?? []
  const leads = client.getQueryData<Lead[]>(crmKeys.leads()) ?? []
  const deals = client.getQueryData<UiDeal[]>(crmKeys.deals()) ?? []
  const needle = query.toLowerCase()
  const results = [
    ...contacts.map((c) => ({ label: c.name, meta: c.company, view: 'Contacts' as View })),
    ...companies.map((c) => ({ label: c.name, meta: c.industry, view: 'Companies' as View })),
    ...leads.map((l) => ({ label: l.name, meta: l.company, view: 'Leads' as View })),
    ...deals.map((d) => ({ label: d.name, meta: d.company, view: 'Deals' as View })),
  ]
    .filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(needle))
    .slice(0, SEARCH_RESULT_LIMIT)

  return (
    <Modal title="Search workspace" onClose={onClose}>
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-slate-400" aria-hidden />
        <label className="sr-only" htmlFor="workspace-search">
          Search contacts, companies, leads
        </label>
        <input
          id="workspace-search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search contacts, companies, leads..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>
      <div className="mt-3 flex flex-col gap-1" role="listbox" aria-label="Search results">
        {results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">
            {query ? 'No matching live records' : 'Type to search API-loaded CRM records'}
          </p>
        ) : (
          results.map((item) => (
            <button
              key={`${item.view}-${item.label}`}
              type="button"
              role="option"
              onClick={() => {
                onSelect(item.view)
                onClose()
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="text-xs text-slate-400">
                  {item.meta} · {item.view}
                </span>
              </span>
              <ChevronRight className="size-4 text-slate-300" aria-hidden />
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}
