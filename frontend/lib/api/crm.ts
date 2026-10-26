import { api } from '@/lib/api/client'
import {
  dealStageToApi,
  mapCompany,
  mapContact,
  mapDeal,
  mapLead,
  mapTask,
  parseAmountToCents,
  splitFullName,
  type ApiCompany,
  type ApiContact,
  type ApiDashboard,
  type ApiDeal,
  type ApiLead,
  type ApiTask,
  type UiDeal,
  type UiTask,
} from '@/lib/api/mappers'
import type { Company, Contact, Deal, Lead, WorkspaceNotification } from '@/lib/types'

export const crmKeys = {
  all: ['crm'] as const,
  contacts: () => [...crmKeys.all, 'contacts'] as const,
  companies: () => [...crmKeys.all, 'companies'] as const,
  leads: () => [...crmKeys.all, 'leads'] as const,
  deals: () => [...crmKeys.all, 'deals'] as const,
  tasks: () => [...crmKeys.all, 'tasks'] as const,
  dashboard: () => [...crmKeys.all, 'dashboard'] as const,
  notifications: () => [...crmKeys.all, 'notifications'] as const,
}

async function listResource<T>(path: string, limit = 100): Promise<T[]> {
  const res = await api.get<T[]>(`${path}?page=1&limit=${limit}`)
  return Array.isArray(res.data) ? res.data : []
}

async function companyNameMap(): Promise<Map<string, string>> {
  const companies = await listResource<ApiCompany>('/companies')
  return new Map(companies.map((c) => [c.id, c.name]))
}

export async function fetchContacts(): Promise<Contact[]> {
  const [rows, names] = await Promise.all([listResource<ApiContact>('/contacts'), companyNameMap()])
  return rows.map((row) => mapContact(row, names))
}

export async function fetchCompanies(): Promise<Company[]> {
  const rows = await listResource<ApiCompany>('/companies')
  return rows.map(mapCompany)
}

export async function fetchLeads(): Promise<Lead[]> {
  const rows = await listResource<ApiLead>('/leads')
  return rows.map(mapLead)
}

export async function fetchDeals(): Promise<UiDeal[]> {
  const [rows, names] = await Promise.all([listResource<ApiDeal>('/deals'), companyNameMap()])
  return rows.map((row) => mapDeal(row, names))
}

export async function fetchTasks(): Promise<UiTask[]> {
  const rows = await listResource<ApiTask>('/tasks')
  return rows.map(mapTask)
}

export async function fetchDashboard(): Promise<ApiDashboard> {
  const res = await api.get<ApiDashboard>('/reports/dashboard')
  return res.data
}

export async function fetchNotifications(): Promise<WorkspaceNotification[]> {
  const rows = await listResource<{
    id: string
    text: string
    view?: string | null
    read?: boolean
    createdAt?: string
  }>('/notifications')
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    time: row.createdAt ? new Date(row.createdAt).toLocaleString() : 'Just now',
    read: Boolean(row.read),
    view: (row.view as WorkspaceNotification['view']) || 'Dashboard',
  }))
}

export type CreateContactInput = {
  name: string
  email: string
  company?: string
  phone?: string
  title?: string
  owner?: string
  stage?: string
  tags?: string[]
}

export async function createContactApi(input: CreateContactInput): Promise<Contact> {
  const { firstName, lastName } = splitFullName(input.name)
  let companyId: string | undefined
  if (input.company?.trim()) {
    const companies = await listResource<ApiCompany>('/companies')
    const match = companies.find((c) => c.name.toLowerCase() === input.company!.trim().toLowerCase())
    companyId = match?.id
  }
  const res = await api.post<ApiContact>('/contacts', {
    firstName,
    lastName,
    email: input.email || undefined,
    phone: input.phone || undefined,
    title: input.title || undefined,
    ownerName: input.owner || undefined,
    stage: input.stage || 'Lead',
    tags: input.tags ?? ['New'],
    companyId,
  })
  const names = await companyNameMap()
  return mapContact(res.data, names)
}

export type CreateCompanyInput = {
  name: string
  industry: string
  size: string
  revenue?: string
  location?: string
  owner: string
}

export async function createCompanyApi(input: CreateCompanyInput): Promise<Company> {
  const res = await api.post<ApiCompany>('/companies', {
    name: input.name,
    industry: input.industry,
    size: input.size,
    revenue: input.revenue || undefined,
    location: input.location || undefined,
    ownerName: input.owner,
  })
  return mapCompany(res.data)
}

export type CreateLeadInput = {
  name: string
  email: string
  company: string
  source?: string
  status?: string
  owner?: string
  phone?: string
  notes?: string
  score?: number
  tags?: string[]
}

export async function createLeadApi(input: CreateLeadInput): Promise<Lead> {
  const { firstName, lastName } = splitFullName(input.name)
  const res = await api.post<ApiLead>('/leads', {
    firstName,
    lastName,
    email: input.email || undefined,
    phone: input.phone || undefined,
    companyName: input.company || undefined,
    source: input.source || 'Website',
    status: input.status || 'New',
    ownerName: input.owner || undefined,
    notes: input.notes || undefined,
    score: input.score ?? 45,
    tags: input.tags ?? [],
  })
  return mapLead(res.data)
}

export async function updateLeadStatusApi(id: string, status: string): Promise<Lead> {
  const res = await api.patch<ApiLead>(`/leads/${id}`, { status })
  return mapLead(res.data)
}

export async function deleteLeadApi(id: string): Promise<void> {
  await api.delete(`/leads/${id}`)
}

export async function updateLeadOwnerApi(id: string, ownerName: string): Promise<Lead> {
  const res = await api.patch<ApiLead>(`/leads/${id}`, { ownerName })
  return mapLead(res.data)
}

export async function updateLeadTagsApi(id: string, tags: string[]): Promise<Lead> {
  const res = await api.patch<ApiLead>(`/leads/${id}`, { tags })
  return mapLead(res.data)
}

export type CreateDealInput = {
  name: string
  company: string
  amount: string
  stage: string
  closeDate?: string
  probability?: number
}

export async function createDealApi(input: CreateDealInput): Promise<UiDeal> {
  const companies = await listResource<ApiCompany>('/companies')
  const match = companies.find((c) => c.name.toLowerCase() === input.company.trim().toLowerCase())
  const names = new Map(companies.map((c) => [c.id, c.name]))
  const res = await api.post<ApiDeal>('/deals', {
    title: input.name,
    amountCents: parseAmountToCents(input.amount),
    stage: dealStageToApi(input.stage),
    probability: input.probability ?? 25,
    expectedClose: input.closeDate ? new Date(input.closeDate).toISOString() : undefined,
    companyId: match?.id,
  })
  return mapDeal(res.data, names)
}

export async function updateDealStageApi(id: string, stage: string): Promise<UiDeal> {
  const names = await companyNameMap()
  const res = await api.patch<ApiDeal>(`/deals/${id}`, { stage: dealStageToApi(stage) })
  return mapDeal(res.data, names)
}

export type CreateTaskInput = {
  title: string
  due: string
  assignee: string
  record?: string
  priority: 'Low' | 'Medium' | 'High'
}

export async function createTaskApi(input: CreateTaskInput): Promise<UiTask> {
  const dueAt = input.due ? new Date(input.due).toISOString() : undefined
  const res = await api.post<ApiTask>('/tasks', {
    title: input.title,
    dueAt,
    priority: input.priority,
    status: 'To do',
    assigneeName: input.assignee,
    recordLabel: input.record || undefined,
  })
  return mapTask(res.data)
}

export async function updateTaskStatusApi(id: string, status: string): Promise<UiTask> {
  const res = await api.patch<ApiTask>(`/tasks/${id}`, { status })
  return mapTask(res.data)
}

export async function updateContactStageApi(id: string, stage: string): Promise<Contact> {
  const names = await companyNameMap()
  const res = await api.patch<ApiContact>(`/contacts/${id}`, { stage })
  return mapContact(res.data, names)
}

export async function updateCompanyApi(
  id: string,
  input: Partial<Pick<CreateCompanyInput, 'name' | 'industry' | 'size' | 'revenue' | 'location' | 'owner'>>,
): Promise<Company> {
  const res = await api.patch<ApiCompany>(`/companies/${id}`, {
    name: input.name,
    industry: input.industry,
    size: input.size,
    revenue: input.revenue,
    location: input.location,
    ownerName: input.owner,
  })
  return mapCompany(res.data)
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await api.patch(`/notifications/${id}`, { read: true })
}

export async function markAllNotificationsReadApi(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => markNotificationReadApi(id)))
}

/** @deprecated Prefer createContactApi — kept for callers typing against lib Contact. */
export type { Deal }
