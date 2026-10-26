'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, Target, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { ApiRecordsPanel } from '@/components/workspace/api-records-panel'
import { useCatalogListQuery } from '@/hooks/use-catalog-query'
import { catalogRecordLabel, type CatalogRecord } from '@/lib/api/catalog'
import { formatMoneyCents } from '@/lib/api/mappers'
import {
  fetchForecastReport,
  fetchOverviewReport,
  fetchSupportAnalytics,
  reportKeys,
} from '@/lib/api/reports'
import { ui, type Notify } from '@/lib/ui'

export function LiveOverviewWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: reportKeys.overview(), queryFn: fetchOverviewReport })
  const activities = (query.data?.recentActivities ?? []) as CatalogRecord[]
  const deals = (query.data?.recentDeals ?? []) as CatalogRecord[]
  const tickets = (query.data?.recentTickets ?? []) as CatalogRecord[]

  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError || (!query.isLoading && !query.data)}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading overview…"
      errorTitle="Could not load overview"
      errorIcon={BarChart3}
    >
      <div className="space-y-6 p-5 lg:p-8">
        <PageHeader eyebrow="Workspace" title="CRM Overview" description="Live activity, deals, and tickets from the API." />
        <ApiRecordsPanel title="Recent activities" rows={activities} onOpen={(row) => notify(catalogRecordLabel(row))} />
        <ApiRecordsPanel title="Recent deals" rows={deals} onOpen={(row) => notify(catalogRecordLabel(row))} />
        <ApiRecordsPanel title="Recent tickets" rows={tickets} onOpen={(row) => notify(catalogRecordLabel(row))} />
      </div>
    </QueryGate>
  )
}

export function LiveForecastWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: reportKeys.forecast(), queryFn: fetchForecastReport })
  const rows =
    query.data?.deals.map((deal) => ({
      id: deal.id,
      name: deal.title,
      title: deal.title,
      status: deal.stage,
      amountCents: deal.amountCents,
      probability: deal.probability,
      expectedClose: deal.expectedClose,
    })) ?? []

  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError || (!query.isLoading && !query.data)}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading forecast…"
      errorTitle="Could not load forecast"
      errorIcon={TrendingUp}
    >
      <div className="p-5 lg:p-8">
        <PageHeader
          eyebrow="Workspace"
          title="Forecast"
          description={`Weighted pipeline ${formatMoneyCents(query.data!.weightedPipelineCents)} from API.`}
        />
        <div className={`${ui.shell} mb-5 p-4`}>
          <p className="text-xs text-slate-500">Weighted pipeline</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoneyCents(query.data!.weightedPipelineCents)}</p>
        </div>
        <ApiRecordsPanel title="Open deals" rows={rows} onOpen={(row) => notify(catalogRecordLabel(row))} />
      </div>
    </QueryGate>
  )
}

export function LiveGoalsWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('goals')
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Workspace" title="Goals" description="Goal targets from the API." />
      <ApiRecordsPanel
        title="Goals"
        rows={query.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}

export function LiveSupportAnalyticsWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: reportKeys.supportAnalytics(), queryFn: fetchSupportAnalytics })
  const rows: CatalogRecord[] = query.data
    ? [
        { id: 'open', name: 'Open', status: 'Open', value: query.data.counts.open },
        { id: 'pending', name: 'Pending', status: 'Pending', value: query.data.counts.pending },
        { id: 'resolved', name: 'Resolved', status: 'Resolved', value: query.data.counts.resolved },
        ...query.data.byChannel.map((row) => ({
          id: `ch-${row.channel}`,
          name: row.channel,
          status: 'Channel',
          value: row.count,
        })),
      ]
    : []

  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError || (!query.isLoading && !query.data)}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading support analytics…"
      errorTitle="Could not load support analytics"
      errorIcon={Target}
    >
      <div className="p-5 lg:p-8">
        <PageHeader eyebrow="Support" title="Support analytics" description="Ticket analytics from the API." />
        <ApiRecordsPanel title="Analytics" rows={rows} onOpen={(row) => notify(catalogRecordLabel(row))} />
      </div>
    </QueryGate>
  )
}
