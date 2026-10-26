import type { Company, Contact, Deal, Lead } from '@/lib/types'

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
] as const

export type ApiContact = {
  id: string
  companyId: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  stage: string | null
  ownerName: string | null
  tags: string[]
  notes: string | null
  updatedAt: string
  createdAt: string
}

export type ApiCompany = {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  location: string | null
  revenue: string | null
  ownerName: string | null
  phone: string | null
  website: string | null
  notes: string | null
  updatedAt: string
  createdAt: string
}

export type ApiLead = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  companyName: string | null
  companyId: string | null
  source: string | null
  score: number
  status: string
  ownerName: string | null
  notes: string | null
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export type ApiDeal = {
  id: string
  companyId: string | null
  contactId: string | null
  title: string
  amountCents: number
  currency: string
  stage: string
  probability: number
  expectedClose: string | null
  createdAt: string
  updatedAt: string
}

export type ApiTask = {
  id: string
  title: string
  dueAt: string | null
  priority: string
  status: string
  assigneeName: string | null
  recordLabel: string | null
  recurring: string | null
  subtasksDone: number | null
  subtasksTotal: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type ApiDashboard = {
  counts: {
    contacts: number
    companies: number
    leads: number
    deals: number
    openTickets: number
    tasksTodo: number
  }
  won: { count: number; amountCents: number }
  pipeline: Array<{ stage: string; count: number; amountCents: number }>
}

/** UI deal row used by deals workspace (richer than lib/types Deal). */
export type UiDeal = {
  id: string
  name: string
  company: string
  amount: string
  stage: string
  probability: number
  owner: string
  color: string
  closeDate: string
  tags: string[]
  product: string
  team: string
  stale?: boolean
  companyId?: string | null
}

export type UiTask = {
  id: string
  title: string
  due: string
  priority: string
  status: string
  assignee: string
  record: string
  recurring?: string
  subtasks?: string
}

const DEAL_STAGE_FROM_API: Record<string, string> = {
  LEAD: 'Qualification',
  QUALIFIED: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
}

const DEAL_STAGE_TO_API: Record<string, string> = {
  Qualification: 'LEAD',
  Discovery: 'QUALIFIED',
  Proposal: 'PROPOSAL',
  Negotiation: 'NEGOTIATION',
  Won: 'WON',
  Lost: 'LOST',
  LEAD: 'LEAD',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
  WON: 'WON',
  LOST: 'LOST',
}

const TASK_PRIORITY_FROM_API: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const TASK_STATUS_FROM_API: Record<string, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export function colorForKey(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0]
}

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Unknown', lastName: 'Contact' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatMoneyCents(cents: number, currency = 'USD'): string {
  const amount = (cents || 0) / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `$${Math.round(amount).toLocaleString()}`
  }
}

export function parseAmountToCents(raw: string): number {
  const n = Number(String(raw).replace(/[$,]/g, ''))
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

export function dealStageFromApi(stage: string): string {
  return DEAL_STAGE_FROM_API[stage] ?? stage
}

export function dealStageToApi(stage: string): string {
  return DEAL_STAGE_TO_API[stage] ?? stage.toUpperCase()
}

export function mapContact(dto: ApiContact, companyNameById: Map<string, string>): Contact {
  const name = `${dto.firstName} ${dto.lastName}`.trim()
  return {
    id: dto.id,
    name,
    email: dto.email ?? '',
    company: (dto.companyId && companyNameById.get(dto.companyId)) || '—',
    stage: dto.stage || 'Lead',
    owner: dto.ownerName || '—',
    last: formatRelative(dto.updatedAt),
    color: colorForKey(dto.id),
    phone: dto.phone ?? undefined,
    title: dto.title ?? undefined,
    tags: dto.tags ?? [],
    notes: dto.notes ?? undefined,
  }
}

export function mapCompany(dto: ApiCompany): Company & { health?: number; color?: string; website: string } {
  return {
    id: dto.id,
    name: dto.name,
    industry: dto.industry || '—',
    size: dto.size || '—',
    website: dto.website || dto.domain || '—',
    location: dto.location || '—',
    revenue: dto.revenue || '—',
    owner: dto.ownerName || '—',
    contacts: 0,
    deals: 0,
    health: 60 + (dto.id.charCodeAt(0) % 35),
    color: colorForKey(dto.id),
  }
}

export function mapLead(dto: ApiLead): Lead {
  return {
    id: dto.id,
    name: `${dto.firstName} ${dto.lastName}`.trim(),
    email: dto.email ?? '',
    company: dto.companyName || '—',
    source: dto.source || 'Website',
    score: dto.score ?? 0,
    status: dto.status || 'New',
    owner: dto.ownerName || '—',
    phone: dto.phone || '—',
    tags: dto.tags ?? [],
    notes: dto.notes ?? undefined,
  }
}

export function mapDeal(dto: ApiDeal, companyNameById: Map<string, string>): UiDeal {
  return {
    id: dto.id,
    name: dto.title,
    company: (dto.companyId && companyNameById.get(dto.companyId)) || '—',
    amount: formatMoneyCents(dto.amountCents, dto.currency),
    stage: dealStageFromApi(dto.stage),
    probability: dto.probability ?? 0,
    owner: '—',
    color: colorForKey(dto.id),
    closeDate: dto.expectedClose
      ? new Date(dto.expectedClose).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    tags: [],
    product: 'Platform',
    team: 'Sales',
    companyId: dto.companyId,
  }
}

export function mapTask(dto: ApiTask): UiTask {
  const subDone = dto.subtasksDone ?? 0
  const subTotal = dto.subtasksTotal ?? 0
  return {
    id: dto.id,
    title: dto.title,
    due: dto.dueAt
      ? new Date(dto.dueAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'No due date',
    priority: TASK_PRIORITY_FROM_API[dto.priority] ?? dto.priority,
    status: TASK_STATUS_FROM_API[dto.status] ?? dto.status,
    assignee: dto.assigneeName || '—',
    record: dto.recordLabel || '—',
    recurring: dto.recurring || undefined,
    subtasks: subTotal > 0 ? `${subDone}/${subTotal}` : undefined,
  }
}
