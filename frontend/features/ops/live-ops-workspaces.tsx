'use client'

import { useQuery } from '@tanstack/react-query'
import { GitMerge, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { ApiRecordsPanel } from '@/components/workspace/api-records-panel'
import { catalogRecordLabel, type CatalogRecord } from '@/lib/api/catalog'
import {
  fetchCustomerPortal,
  fetchDuplicateCompanies,
  fetchDuplicateContacts,
  fetchLiveChatThreads,
  fetchQuotesInvoicesBundle,
  fetchRecycleBin,
  fetchSettings,
  fetchSupportSettings,
} from '@/lib/api/ops'
import { type Notify } from '@/lib/ui'

export function LiveDuplicatesWorkspace({ notify }: { notify: Notify }) {
  const contactsQuery = useQuery({ queryKey: ['duplicates', 'contacts'], queryFn: fetchDuplicateContacts })
  const companiesQuery = useQuery({ queryKey: ['duplicates', 'companies'], queryFn: fetchDuplicateCompanies })
  const rows: CatalogRecord[] = [
    ...(contactsQuery.data ?? []).map((group, index) => ({
      id: `contact-${group.key}-${index}`,
      name: group.key,
      status: 'Contact duplicate',
      field: group.field,
      records: group.records,
    })),
    ...(companiesQuery.data ?? []).map((group, index) => ({
      id: `company-${group.key}-${index}`,
      name: group.key,
      status: 'Company duplicate',
      field: group.field,
      records: group.records,
    })),
  ]

  return (
    <QueryGate
      isLoading={contactsQuery.isLoading || companiesQuery.isLoading}
      isError={contactsQuery.isError || companiesQuery.isError}
      error={contactsQuery.error ?? companiesQuery.error}
      onRetry={() => {
        void contactsQuery.refetch()
        void companiesQuery.refetch()
      }}
      loadingLabel="Scanning duplicates…"
      errorTitle="Could not load duplicates"
      errorIcon={GitMerge}
    >
      <div className="p-5 lg:p-8">
        <PageHeader eyebrow="Data quality" title="Duplicates" description="Duplicate groups detected by the API." />
        <ApiRecordsPanel
          title="Duplicate groups"
          rows={rows}
          emptyTitle="No duplicates found"
          emptyDescription="No email/domain collisions in this organization."
          onOpen={(row) => notify(catalogRecordLabel(row))}
        />
      </div>
    </QueryGate>
  )
}

export function LiveRecycleBinWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['recycle-bin'], queryFn: fetchRecycleBin })
  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading recycle bin…"
      errorTitle="Could not load recycle bin"
      errorIcon={Trash2}
    >
      <div className="p-5 lg:p-8">
        <PageHeader eyebrow="Data quality" title="Recycle bin" description="Soft-deleted records from the API." />
        <ApiRecordsPanel
          title="Deleted records"
          rows={query.data ?? []}
          emptyTitle="Recycle bin is empty"
          emptyDescription="Deleted CRM records will appear here."
          onOpen={(row) => notify(catalogRecordLabel(row))}
        />
      </div>
    </QueryGate>
  )
}

export function LiveQuotesInvoicesWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['quotes-invoices'], queryFn: fetchQuotesInvoicesBundle })
  const rows = [...(query.data?.quotes ?? []), ...(query.data?.invoices ?? [])]
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Commerce" title="Quotes & invoices" description="Quotes and invoices from the API." />
      <ApiRecordsPanel
        title="Commerce documents"
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}

export function LiveSupportSettingsWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['support-settings'], queryFn: fetchSupportSettings })
  const rows: CatalogRecord[] = query.data
    ? Object.entries(query.data).map(([key, value]) => ({
        id: key,
        name: key,
        status: typeof value === 'object' ? 'object' : String(value),
        value: typeof value === 'object' ? JSON.stringify(value) : value,
      }))
    : []
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Support" title="Support settings" description="Org support settings from the API." />
      <ApiRecordsPanel
        title="Settings"
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}

export function LiveCustomerPortalWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['customer-portal'], queryFn: fetchCustomerPortal })
  const rows: CatalogRecord[] = query.data
    ? Object.entries(query.data).map(([key, value]) => ({
        id: key,
        name: key,
        status: String(value),
      }))
    : []
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Support" title="Customer portal" description="Portal configuration from the API." />
      <ApiRecordsPanel
        title="Portal"
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}

export function LiveChatWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['live-chat'], queryFn: fetchLiveChatThreads })
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Support" title="Live chat" description="Chat threads from the API." />
      <ApiRecordsPanel
        title="Threads"
        rows={query.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}

export function LiveOrgSettingsWorkspace({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: ['settings'], queryFn: fetchSettings })
  const rows: CatalogRecord[] = query.data
    ? Object.entries(query.data).map(([key, value]) => ({
        id: key,
        name: key,
        status: typeof value === 'object' ? 'object' : String(value ?? '—'),
      }))
    : []
  return (
    <div className="p-5 lg:p-8">
      <PageHeader eyebrow="Admin" title="Settings" description="Organization settings from the API." />
      <ApiRecordsPanel
        title="Workspace settings"
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(catalogRecordLabel(row))}
      />
    </div>
  )
}
