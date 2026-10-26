import { api } from '@/lib/api/client'

export type CatalogRecord = Record<string, unknown> & {
  id?: string
  createdAt?: string
  updatedAt?: string
}

export const catalogKeys = {
  all: ['catalog'] as const,
  list: (route: string) => [...catalogKeys.all, route] as const,
}

function asRecords(data: unknown, route: string): CatalogRecord[] {
  if (Array.isArray(data)) return data as CatalogRecord[]
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.apps)) return obj.apps as CatalogRecord[]
  if (Array.isArray(obj.items)) return obj.items as CatalogRecord[]
  if (Array.isArray(obj.groups)) return obj.groups as CatalogRecord[]
  if (Array.isArray(obj.quotes)) return obj.quotes as CatalogRecord[]
  // Settings-style payloads become a single display row.
  return [{ id: route, name: route, ...obj }]
}

export async function fetchCatalogList(route: string, limit = 100): Promise<CatalogRecord[]> {
  const path = route.startsWith('/') ? route : `/${route}`
  const withQuery = path.includes('?') ? path : `${path}?page=1&limit=${limit}`
  const res = await api.get<unknown>(withQuery)
  return asRecords(res.data, route)
}

export async function createCatalogRecord(
  route: string,
  body: Record<string, unknown>,
): Promise<CatalogRecord> {
  const path = route.startsWith('/') ? route : `/${route}`
  const res = await api.post<CatalogRecord>(path, body)
  return res.data
}

export async function updateCatalogRecord(
  route: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CatalogRecord> {
  const path = route.startsWith('/') ? route : `/${route}`
  const res = await api.patch<CatalogRecord>(`${path}/${id}`, body)
  return res.data
}

export async function deleteCatalogRecord(route: string, id: string): Promise<void> {
  const path = route.startsWith('/') ? route : `/${route}`
  await api.delete(`${path}/${id}`)
}

/** Pick a human label from a catalog row for tables/search. */
export function catalogRecordLabel(row: CatalogRecord): string {
  const candidates = [
    row.name,
    row.title,
    row.subject,
    row.number,
    row.workflowName,
    row.repName,
    row.customerName,
    row.fromName,
    row.contactName,
    row.text,
    row.participant,
    row.key,
    row.locale,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value
  }
  if (typeof row.firstName === 'string' || typeof row.lastName === 'string') {
    return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || String(row.id ?? 'Record')
  }
  if (row.item && typeof row.item === 'object') {
    return catalogRecordLabel(row.item as CatalogRecord)
  }
  return String(row.id ?? 'Record')
}

export function catalogRecordStatus(row: CatalogRecord): string {
  const status = row.status ?? row.priority ?? row.tier ?? row.provider ?? row.resource ?? row.category
  return typeof status === 'string' ? status : '—'
}

export function catalogRecordOwner(row: CatalogRecord): string {
  const owner =
    row.ownerName ??
    row.assigneeName ??
    row.agentName ??
    row.repName ??
    row.fromName ??
    row.actorName ??
    row.owner
  return typeof owner === 'string' ? owner : '—'
}

export function catalogRecordValue(row: CatalogRecord): string {
  if (typeof row.amountCents === 'number') {
    return `$${Math.round(row.amountCents / 100).toLocaleString()}`
  }
  if (typeof row.mrrCents === 'number') {
    return `$${Math.round(row.mrrCents / 100).toLocaleString()}/mo`
  }
  if (typeof row.priceCents === 'number') {
    return `$${Math.round(row.priceCents / 100).toLocaleString()}`
  }
  if (typeof row.valueCents === 'number') {
    return `$${Math.round(row.valueCents / 100).toLocaleString()}`
  }
  if (typeof row.wonCents === 'number') {
    return `$${Math.round(row.wonCents / 100).toLocaleString()}`
  }
  if (typeof row.targetValue === 'number') return String(row.targetValue)
  if (typeof row.score === 'number') return String(row.score)
  if (typeof row.progress === 'number') return `${row.progress}%`
  if (typeof row.accountsCount === 'number') return `${row.accountsCount} accounts`
  if (typeof row.deals === 'number') return `${row.deals} deals`
  if (Array.isArray(row.records)) return `${row.records.length} records`
  return '—'
}
