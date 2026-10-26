/** Shared CRM domain types — import from here instead of redefining per file. */

export type View =
  | 'Dashboard'
  | 'CRM Overview'
  | 'Forecast'
  | 'Goals'
  | 'Contacts'
  | 'Companies'
  | 'Leads'
  | 'Deals'
  | 'Tasks'
  | 'Import'
  | 'Duplicates'
  | 'Recycle bin'
  | 'Calendar'
  | 'Activities'
  | 'Inbox'
  | 'Email campaigns'
  | 'Support tickets'
  | 'Support settings'
  | 'Knowledge base'
  | 'Customer portal'
  | 'Live chat'
  | 'Support analytics'
  | 'Meeting scheduler'
  | 'Email templates'
  | 'Sequences'
  | 'Calling'
  | 'Lead capture forms'
  | 'Reports'
  | 'Automation'
  | 'Assignment rules'
  | 'Lead scoring'
  | 'Approval workflows'
  | 'Workflow logs'
  | 'Team'
  | 'Products'
  | 'Quotes & invoices'
  | 'Documents'
  | 'Integrations'
  | 'Developer'
  | 'Settings'
  | 'Messaging'
  | 'Social'
  | 'Enrichment'
  | 'Territories'
  | 'Subscriptions'
  | 'Commissions'
  | 'Contracts'
  | 'Surveys'
  | 'Landing pages'
  | 'Events'
  | 'Partners'
  | 'Projects'
  | 'Leaderboards'
  | 'Language settings'
  | 'Sandbox'
  | 'Marketplace'
  | 'Customer 360'

export type Contact = {
  id?: string
  name: string
  email: string
  company: string
  stage: string
  owner: string
  last: string
  color: string
  phone?: string
  title?: string
  tags?: string[]
  notes?: string
}

export type Company = {
  id: string
  name: string
  industry: string
  size: string
  website: string
  location: string
  revenue: string
  owner: string
  contacts: number
  deals: number
}

export type Lead = {
  id: string
  name: string
  email: string
  company: string
  source: string
  score: number
  status: string
  owner: string
  phone: string
  tags?: string[]
  notes?: string
}

export type Deal = {
  id?: string
  name: string
  company: string
  amount: string
  stage: string
  probability: number
  owner: string
  color: string
}

export type Notify = (message: string) => void

export type WorkspaceNotification = {
  id: string
  text: string
  time: string
  read: boolean
  view: View
}
