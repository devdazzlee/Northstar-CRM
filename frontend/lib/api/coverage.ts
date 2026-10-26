/**
 * Frontend View → Backend API map (senior audit).
 * Every nav View has at least one backing endpoint.
 */
export type MembershipRole =
  | 'ORG_ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_REP'
  | 'SUPPORT_MANAGER'
  | 'SUPPORT_AGENT'
  | 'MARKETING'
  | 'VIEWER'

export const VIEW_API_MAP = {
  Dashboard: 'GET /reports/dashboard',
  'CRM Overview': 'GET /reports/overview',
  Forecast: 'GET /reports/forecast',
  Goals: 'CRUD /goals',
  Territories: 'CRUD /territories',
  Subscriptions: 'CRUD /subscriptions',
  Contracts: 'CRUD /contracts',
  Projects: 'CRUD /projects',
  Partners: 'CRUD /partners',
  'Customer 360': 'GET /customer-360/:contactId',
  Contacts: 'CRUD /contacts',
  Companies: 'CRUD /companies',
  Leads: 'CRUD /leads',
  Deals: 'CRUD /deals',
  Tasks: 'CRUD /tasks',
  Calendar: 'CRUD /calendar-events',
  'Meeting scheduler': 'CRUD /calendar-events',
  Import: 'POST /imports + GET /imports',
  Duplicates: 'GET /duplicates/contacts|companies + POST merge',
  'Recycle bin': 'GET /recycle-bin + POST restore',
  Messaging: 'CRUD /messaging/threads',
  Social: 'CRUD /social/posts',
  Enrichment: 'POST /enrichment',
  Activities: 'CRUD /activities',
  Inbox: 'CRUD /inbox-messages',
  'Email templates': 'CRUD /email-templates',
  'Email campaigns': 'CRUD /email-campaigns + POST /engines/campaigns/:id/send',
  Sequences: 'CRUD /sequences + POST /engines/sequences/*',
  Calling: 'CRUD /call-logs',
  'Lead capture forms': 'CRUD /lead-forms',
  'Support tickets': 'CRUD /support-tickets',
  'Support settings': 'GET|PATCH /support-settings',
  'Knowledge base': 'CRUD /knowledge-articles',
  'Customer portal': 'GET|PATCH /customer-portal',
  'Live chat': 'GET|POST /live-chat/threads',
  'Support analytics': 'GET /reports/support-analytics',
  Commissions: 'CRUD /commissions',
  Leaderboards: 'GET /leaderboards',
  Reports: 'GET /reports/*',
  Automation: 'CRUD /automation-rules + POST /engines/automation/run',
  'Assignment rules': 'CRUD /assignment-rules + POST /engines/assignment/run',
  'Lead scoring': 'CRUD /lead-score-rules + POST /engines/lead-scoring/run',
  'Approval workflows': 'CRUD /approval-workflows + POST /engines/approvals/*',
  'Workflow logs': 'CRUD /workflow-logs',
  Marketplace: 'GET /marketplace',
  Sandbox: 'POST /sandbox/run',
  'Language settings': 'GET /language-settings',
  Team: 'GET /users + POST /users/invite',
  Products: 'CRUD /products',
  'Quotes & invoices': 'GET /quotes-invoices (+ /quotes, /invoices)',
  Documents: 'CRUD /documents + POST /documents/upload',
  Integrations: 'CRUD /integrations',
  Developer: 'GET /developer',
  Settings: 'GET|PATCH /settings',
  Surveys: 'CRUD /surveys',
  'Landing pages': 'CRUD /landing-pages',
  Events: 'CRUD /events',
} as const
