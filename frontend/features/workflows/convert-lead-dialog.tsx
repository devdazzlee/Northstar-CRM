'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Building2, User, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ApiError } from '@/lib/api/client'
import { createCompanyApi, createContactApi, createDealApi, crmKeys, updateLeadStatusApi } from '@/lib/api/crm'
import { type Notify } from '@/lib/ui'

type LeadLike = {
  id: string
  name: string
  company: string
  email?: string
  phone?: string
  owner?: string
}

export function ConvertLeadDialog({
  lead,
  onClose,
  notify,
}: {
  lead: LeadLike
  onClose: () => void
  notify: Notify
}) {
  const queryClient = useQueryClient()
  const [createCompany, setCreateCompany] = useState(true)
  const [createContact, setCreateContact] = useState(true)
  const [createDeal, setCreateDeal] = useState(true)
  const [dealName, setDealName] = useState(`${lead.company} · Expansion`)
  const [amount, setAmount] = useState('25000')
  const [busy, setBusy] = useState(false)
  const owner = lead.owner || 'Unassigned'

  const convert = async () => {
    setBusy(true)
    try {
      const companyName = lead.company || `${lead.name} Co`

      if (createCompany) {
        await createCompanyApi({
          name: companyName,
          industry: 'Services',
          size: '1-50',
          owner,
        })
      }

      if (createContact) {
        await createContactApi({
          name: lead.name,
          email: lead.email || `${lead.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
          company: companyName,
          phone: lead.phone,
          owner,
          stage: 'Customer',
          tags: ['Converted'],
        })
      }

      if (createDeal) {
        await createDealApi({
          name: dealName,
          company: companyName,
          amount: String(Number(amount) || 25000),
          stage: 'Qualified',
        })
      }

      await updateLeadStatusApi(lead.id, 'Converted')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: crmKeys.leads() }),
        queryClient.invalidateQueries({ queryKey: crmKeys.contacts() }),
        queryClient.invalidateQueries({ queryKey: crmKeys.companies() }),
        queryClient.invalidateQueries({ queryKey: crmKeys.deals() }),
      ])

      notify('Lead converted')
      onClose()
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Convert lead" onClose={onClose}>
      <p className="mb-5 text-sm text-slate-500">
        Convert <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.name}</span> into CRM
        records.
      </p>
      <div className="space-y-3">
        <ConvertOption
          icon={Building2}
          title="Create company"
          sub={lead.company || 'New company'}
          checked={createCompany}
          onChange={setCreateCompany}
        />
        <ConvertOption
          icon={User}
          title="Create contact"
          sub={lead.email || lead.name}
          checked={createContact}
          onChange={setCreateContact}
        />
        <ConvertOption
          icon={Wallet}
          title="Create deal"
          sub="Opportunity from this lead"
          checked={createDeal}
          onChange={setCreateDeal}
        />
      </div>
      {createDeal && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Deal name
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={dealName}
              onChange={(event) => setDealName(event.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            Amount
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500">
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || (!createCompany && !createContact && !createDeal)}
          onClick={() => void convert()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Converting…' : 'Convert lead'}
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </Modal>
  )
}

function ConvertOption({
  icon: Icon,
  title,
  sub,
  checked,
  onChange,
}: {
  icon: typeof Building2
  title: string
  sub: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <div className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </label>
  )
}
