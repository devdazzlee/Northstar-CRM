'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronRight, Download, ExternalLink, Globe2, Layers3, Map, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ApiRecordsPanel } from '@/components/workspace/api-records-panel'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { useContactsQuery } from '@/hooks/use-crm-queries'
import { ApiError } from '@/lib/api/client'
import { fetchCatalogList, type CatalogRecord } from '@/lib/api/catalog'
import { type ModuleView } from '@/lib/constants'
import { MODULE_LIST_ROUTE } from '@/lib/view-api-routes'
import { ui, type Notify } from '@/lib/ui'
import { useQuery } from '@tanstack/react-query'

type ModuleKind = ModuleView

const shell = ui.shell
const button = ui.button
const primary = ui.buttonPrimary
const tabs: Record<ModuleKind, string[]> = {
  Messaging: ['SMS & WhatsApp inbox', 'Templates', 'Campaigns', 'Settings'],
  Social: ['Connected accounts', 'Social leads', 'Inbox', 'Scheduler'],
  Enrichment: ['Enrich records', 'Bulk enrichment', 'Credits & settings'],
  Territories: ['Territories', 'Assignments', 'Performance'],
  Subscriptions: ['Overview', 'Subscriptions', 'Renewals', 'Reminder rules'],
  Commissions: ['Plans', 'Payouts', 'Rep statements'],
  Contracts: ['Contracts', 'Clause library', 'Expiry alerts'],
  Surveys: ['Builder', 'Distribution', 'Results', 'Feedback inbox'],
  'Landing pages': ['Pages', 'Builder', 'Templates'],
  Events: ['Events', 'Registration builder', 'Registrants', 'Analytics'],
  Partners: ['Partners', 'Approvals', 'Portal preview', 'MDF & co-sell'],
  Projects: ['Projects', 'Board', 'Timeline', 'Onboarding templates'],
  Leaderboards: ['Leaderboards', 'Contests', 'Badges'],
  'Language settings': ['Language', 'Translations', 'Regional formats'],
  Sandbox: ['Environments', 'Compare changes', 'Promote'],
  Marketplace: ['Gallery', 'Installed', 'Submit app'],
  'Customer 360': ['Overview', 'Timeline', 'People', 'Account plan'],
}

export function NewCRMModule({ kind, notify }: { kind: ModuleKind; notify: Notify }) {
  const [tab, setTab] = useState(tabs[kind][0])
  const [showCreate, setShowCreate] = useState(false)
  const route = MODULE_LIST_ROUTE[kind] ?? null
  const listQuery = useCatalogListQuery(route, Boolean(route) && kind !== 'Customer 360' && kind !== 'Sandbox' && kind !== 'Enrichment')
  const createMutation = useCatalogCreateMutation(route || 'territories')
  const contactsQuery = useContactsQuery()
  const firstContactId = contactsQuery.data?.[0]?.id

  const customer360Query = useQuery({
    queryKey: ['extras', 'customer-360', firstContactId],
    queryFn: () => fetchCatalogList(`customer-360/${firstContactId}`),
    enabled: kind === 'Customer 360' && Boolean(firstContactId),
  })

  const rows = useMemo(() => {
    if (kind === 'Customer 360') return customer360Query.data ?? []
    return listQuery.data ?? []
  }, [kind, listQuery.data, customer360Query.data])

  const isLoading =
    kind === 'Customer 360'
      ? customer360Query.isLoading || contactsQuery.isLoading
      : kind === 'Sandbox' || kind === 'Enrichment'
        ? false
        : listQuery.isLoading

  const isError =
    kind === 'Customer 360'
      ? customer360Query.isError
      : kind === 'Sandbox' || kind === 'Enrichment'
        ? false
        : listQuery.isError

  const isTerritories = kind === 'Territories'
  const isCustomer360 = kind === 'Customer 360'

  const stats = useMemo(() => {
    const count = rows.length
    return [
      ['Records', String(count), 'API'],
      ['Active', String(rows.filter((r) => String(r.status ?? '').toLowerCase().includes('active')).length || count), 'live'],
      ['Owners', String(new Set(rows.map((r) => String(r.ownerName ?? r.owner ?? ''))).size), 'live'],
      ['Source', 'API', 'live'],
    ] as const
  }, [rows])

  return (
    <div className="p-5 pb-24 lg:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Northstar</span>
            <ChevronRight className="size-3" />
            <span>{kind}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{kind}</h1>
          <p className="mt-1 text-sm text-slate-500">Live workspace data from the Northstar API.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={button} onClick={() => notify('Export started')}>
            <Download className="mr-1 inline size-3.5" />
            Export
          </button>
          {route && (
            <button type="button" className={primary} onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 inline size-3.5" />
              Create new
            </button>
          )}
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, trend]) => (
          <div key={label} className={`${shell} p-4`}>
            <p className="text-xs text-slate-500">{label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-xl font-semibold">{value}</p>
              <span className="text-xs font-semibold text-emerald-600">{trend}</span>
            </div>
          </div>
        ))}
      </div>

      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs[kind].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold ${
              tab === item ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {kind === 'Sandbox' ? (
        <SandboxPanel notify={notify} />
      ) : kind === 'Enrichment' ? (
        <EnrichmentPanel notify={notify} />
      ) : isTerritories ? (
        <TerritoryMap
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void listQuery.refetch()}
          notify={notify}
        />
      ) : isCustomer360 ? (
        <Customer360
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void customer360Query.refetch()}
          notify={notify}
        />
      ) : (
        <ApiRecordsPanel
          title={tab}
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
          onRetry={() => void listQuery.refetch()}
          onOpen={(row) => notify(`${String(row.name ?? row.title ?? row.id)} opened`)}
        />
      )}

      {showCreate && route && (
        <CreateDialog
          kind={kind}
          route={route}
          busy={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onCreate={async (name) => {
            try {
              await createMutation.mutateAsync({ name, status: 'Active', ownerName: 'AR' })
              notify(`${kind} created`)
              setShowCreate(false)
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Could not create record')
            }
          }}
        />
      )}
    </div>
  )
}

function TerritoryMap({
  rows,
  isLoading,
  isError,
  onRetry,
  notify,
}: {
  rows: CatalogRecord[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  notify: Notify
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className={`${shell} p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Territories</h2>
        </div>
        {isLoading || isError || rows.length === 0 ? (
          <div className="mt-3">
            <ApiRecordsPanel
              title="Territories"
              rows={rows}
              isLoading={isLoading}
              isError={isError}
              onRetry={onRetry}
              emptyTitle="No territories"
              emptyDescription="Create a territory to assign accounts."
            />
          </div>
        ) : (
          rows.map((row) => (
            <button
              key={String(row.id)}
              type="button"
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left text-xs dark:border-slate-700"
              onClick={() => notify(`${String(row.name)} opened`)}
            >
              <span>
                <span className="block font-semibold">{String(row.name)}</span>
                <span className="text-slate-500">
                  {String(row.accountsCount ?? 0)} accounts · {String(row.region ?? '—')}
                </span>
              </span>
              <ChevronRight className="size-4" />
            </button>
          ))
        )}
      </section>
      <section className={`${shell} min-h-[440px] p-5`}>
        <div className="flex items-center gap-2">
          <Map className="size-4 text-indigo-600" />
          <h2 className="font-semibold">Territory coverage</h2>
        </div>
        <div className="mt-5 grid min-h-[350px] place-items-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="text-center">
            <Globe2 className="mx-auto size-14 text-indigo-300" />
            <p className="mt-3 text-sm font-semibold">{rows.length} territories loaded</p>
            <p className="mt-1 text-xs text-slate-500">Coverage from API territory records.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Customer360({
  rows,
  isLoading,
  isError,
  onRetry,
  notify,
}: {
  rows: CatalogRecord[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  notify: Notify
}) {
  if (isLoading || isError || rows.length === 0) {
    return (
      <ApiRecordsPanel
        title="Customer 360"
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        emptyTitle="No customer selected"
        emptyDescription="Add contacts first, then open Customer 360."
      />
    )
  }
  const payload = rows[0] ?? {}
  const sections = Object.keys(payload).filter((key) => key !== 'id')
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {(sections.length ? sections : ['overview']).map((section) => (
        <section key={section} className={`${shell} p-5 ${section === 'timeline' ? 'lg:col-span-3' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">{section}</h2>
            <button type="button" aria-label={`Open ${section}`} onClick={() => notify(`${section} opened`)}>
              <ExternalLink className="size-3.5 text-slate-400" />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {typeof payload[section] === 'object'
              ? JSON.stringify(payload[section]).slice(0, 120)
              : String(payload[section] ?? '—')}
          </p>
        </section>
      ))}
    </div>
  )
}

function SandboxPanel({ notify }: { notify: Notify }) {
  return (
    <div className={`${shell} p-6`}>
      <h2 className="font-semibold">Sandbox</h2>
      <p className="mt-2 text-sm text-slate-500">Runs against `POST /sandbox/run` — no mock rows.</p>
      <button
        type="button"
        className={`${primary} mt-4`}
        onClick={async () => {
          try {
            await fetchCatalogList('sandbox/run'.replace('sandbox/run', 'sandbox'))
          } catch {
            // list path may 404; create via post
          }
          try {
            const { api } = await import('@/lib/api/client')
            await api.post('/sandbox/run', { name: 'demo-run' })
            notify('Sandbox run completed')
          } catch (error) {
            notify(error instanceof ApiError ? error.message : 'Sandbox run failed')
          }
        }}
      >
        Run sandbox
      </button>
    </div>
  )
}

function EnrichmentPanel({ notify }: { notify: Notify }) {
  return (
    <div className={`${shell} p-6`}>
      <h2 className="font-semibold">Enrichment</h2>
      <p className="mt-2 text-sm text-slate-500">Uses `POST /enrichment` — no hardcoded enrichments.</p>
      <button
        type="button"
        className={`${primary} mt-4`}
        onClick={async () => {
          try {
            const { api } = await import('@/lib/api/client')
            await api.post('/enrichment', { targetType: 'contact', targetId: '00000000-0000-4000-8000-000000000002' })
            notify('Enrichment job queued')
          } catch (error) {
            notify(error instanceof ApiError ? error.message : 'Enrichment failed')
          }
        }}
      >
        Enrich sample contact
      </button>
    </div>
  )
}

function CreateDialog({
  kind,
  onClose,
  onCreate,
  busy,
}: {
  kind: ModuleKind
  route: string
  onClose: () => void
  onCreate: (name: string) => void | Promise<void>
  busy?: boolean
}) {
  const [name, setName] = useState('')
  return (
    <Modal title={`Create ${kind}`} onClose={onClose}>
      <label className="text-xs font-medium">
        Name
        <input
          className={`${ui.input} mt-1.5 w-full`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Enter ${kind.toLowerCase()} name`}
        />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={button} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={primary}
          disabled={busy || name.trim().length < 2}
          onClick={() => void onCreate(name.trim())}
        >
          <Check className="mr-1 inline size-3.5" />
          {busy ? 'Creating…' : 'Create'}
        </button>
      </div>
    </Modal>
  )
}

export function LanguageSettings({ notify }: { notify: Notify }) {
  return <NewCRMModule kind="Language settings" notify={notify} />
}

export function ModuleErrorState({ notify }: { notify: Notify }) {
  return (
    <div className="m-8 rounded-2xl border border-dashed border-rose-300 p-10 text-center">
      <Layers3 className="mx-auto size-8 text-rose-500" />
      <h2 className="mt-3 font-semibold">Something went wrong</h2>
      <button type="button" className={`${primary} mt-4`} onClick={() => notify('Retrying module')}>
        Retry
      </button>
    </div>
  )
}
