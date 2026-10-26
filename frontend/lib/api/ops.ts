import { api } from '@/lib/api/client'
import type { CatalogRecord } from '@/lib/api/catalog'

export type DuplicateGroup = {
  key: string
  field: string
  records: CatalogRecord[]
}

export async function fetchRecycleBin(): Promise<CatalogRecord[]> {
  const res = await api.get<Array<{ resource: string; item: CatalogRecord }>>('/recycle-bin')
  const rows = Array.isArray(res.data) ? res.data : []
  return rows.map((row, index) => ({
    id: String(row.item?.id ?? `recycle-${index}`),
    resource: row.resource,
    name: String(
      row.item?.name ??
        row.item?.title ??
        row.item?.subject ??
        `${row.item?.firstName ?? ''} ${row.item?.lastName ?? ''}`.trim() ??
        row.resource,
    ),
    status: 'Deleted',
    ...row.item,
  }))
}

export async function fetchDuplicateContacts(): Promise<DuplicateGroup[]> {
  const res = await api.get<{ groups: DuplicateGroup[]; totalGroups: number }>('/duplicates/contacts')
  return Array.isArray(res.data?.groups) ? res.data.groups : []
}

export async function fetchDuplicateCompanies(): Promise<DuplicateGroup[]> {
  const res = await api.get<{ groups: DuplicateGroup[]; totalGroups: number }>('/duplicates/companies')
  return Array.isArray(res.data?.groups) ? res.data.groups : []
}

export async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await api.get<Record<string, unknown>>('/settings')
  return (res.data as Record<string, unknown>) ?? {}
}

export async function updateSettingsApi(
  body: Partial<{
    timezone: string
    locale: string
    currency: string
    companyName: string
    features: Record<string, unknown>
    branding: Record<string, unknown>
  }>,
): Promise<Record<string, unknown>> {
  const res = await api.patch<Record<string, unknown>>('/settings', body)
  return (res.data as Record<string, unknown>) ?? {}
}

export async function fetchSupportSettings(): Promise<Record<string, unknown>> {
  const res = await api.get<Record<string, unknown>>('/support-settings')
  return (res.data as Record<string, unknown>) ?? {}
}

export async function fetchCustomerPortal(): Promise<Record<string, unknown>> {
  const res = await api.get<Record<string, unknown>>('/customer-portal')
  return (res.data as Record<string, unknown>) ?? {}
}

export async function fetchLiveChatThreads(): Promise<CatalogRecord[]> {
  const res = await api.get<CatalogRecord[]>('/live-chat/threads')
  return Array.isArray(res.data) ? res.data : []
}

export async function fetchQuotesInvoicesBundle(): Promise<{
  quotes: CatalogRecord[]
  invoices: CatalogRecord[]
}> {
  const res = await api.get<{ quotes?: CatalogRecord[]; invoices?: CatalogRecord[] }>('/quotes-invoices')
  return {
    quotes: Array.isArray(res.data?.quotes) ? res.data.quotes : [],
    invoices: Array.isArray(res.data?.invoices) ? res.data.invoices : [],
  }
}
