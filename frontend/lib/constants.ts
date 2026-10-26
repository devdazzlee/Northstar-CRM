import type { View } from '@/lib/types'

/** Toast auto-dismiss duration (ms). */
export const TOAST_DURATION_MS = 2600

/** Views rendered by the generic NewCRMModule shell. */
export const MODULE_VIEWS = [
  'Messaging',
  'Social',
  'Enrichment',
  'Territories',
  'Subscriptions',
  'Commissions',
  'Contracts',
  'Surveys',
  'Landing pages',
  'Events',
  'Partners',
  'Projects',
  'Leaderboards',
  'Language settings',
  'Sandbox',
  'Marketplace',
  'Customer 360',
] as const satisfies readonly View[]

export type ModuleView = (typeof MODULE_VIEWS)[number]

export function isModuleView(view: string): view is ModuleView {
  return (MODULE_VIEWS as readonly string[]).includes(view)
}

export const DEFAULT_VIEW: View = 'Dashboard'

export const SEARCH_RESULT_LIMIT = 8
