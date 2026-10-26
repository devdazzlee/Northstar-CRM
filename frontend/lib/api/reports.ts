import { api } from '@/lib/api/client'
import type { ApiDashboard } from '@/lib/api/mappers'

export type ForecastReport = {
  weightedPipelineCents: number
  deals: Array<{
    id: string
    title: string
    amountCents: number
    probability: number
    stage: string
    expectedClose: string | null
  }>
}

export type OverviewReport = {
  recentActivities: Array<Record<string, unknown>>
  recentDeals: Array<Record<string, unknown>>
  recentTickets: Array<Record<string, unknown>>
}

export type SupportAnalyticsReport = {
  counts: { open: number; pending: number; resolved: number }
  byChannel: Array<{ channel: string; count: number }>
  byPriority: Array<{ priority: string; count: number }>
}

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  forecast: () => [...reportKeys.all, 'forecast'] as const,
  overview: () => [...reportKeys.all, 'overview'] as const,
  supportAnalytics: () => [...reportKeys.all, 'support-analytics'] as const,
}

export async function fetchForecastReport(): Promise<ForecastReport> {
  const res = await api.get<ForecastReport>('/reports/forecast')
  return res.data
}

export async function fetchOverviewReport(): Promise<OverviewReport> {
  const res = await api.get<OverviewReport>('/reports/overview')
  return res.data
}

export async function fetchSupportAnalytics(): Promise<SupportAnalyticsReport> {
  const res = await api.get<SupportAnalyticsReport>('/reports/support-analytics')
  return res.data
}

export type { ApiDashboard }
