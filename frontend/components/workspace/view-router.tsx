'use client'

import dynamic from 'next/dynamic'
import type { ComponentType, Dispatch, SetStateAction } from 'react'
import { Suspense } from 'react'
import type { RecordType } from '@/components/record-detail-pages'
import { GlobalLoader } from '@/components/ui/global-loader'
import { GenericView } from '@/components/workspace/generic-view'
import { isModuleView } from '@/lib/constants'
import { ui } from '@/lib/ui'
import type { Lead, Notify, View } from '@/lib/types'

function lazyNamed<T extends ComponentType<any>>(loader: () => Promise<Record<string, T>>, exportName: string) {
  return dynamic(() => loader().then((mod) => ({ default: mod[exportName] })), {
    ssr: false,
    loading: () => <GlobalLoader label="Loading view…" />,
  })
}

const DashboardWorkspace = lazyNamed(() => import('@/features/reports/dashboard-workspace'), 'DashboardWorkspace')
const LiveOverviewWorkspace = lazyNamed(() => import('@/features/reports/live-reports-workspaces'), 'LiveOverviewWorkspace')
const LiveForecastWorkspace = lazyNamed(() => import('@/features/reports/live-reports-workspaces'), 'LiveForecastWorkspace')
const LiveGoalsWorkspace = lazyNamed(() => import('@/features/reports/live-reports-workspaces'), 'LiveGoalsWorkspace')
const LiveSupportAnalyticsWorkspace = lazyNamed(
  () => import('@/features/reports/live-reports-workspaces'),
  'LiveSupportAnalyticsWorkspace',
)

const ContactsWorkspace = lazyNamed(() => import('@/features/lists/contacts-workspace'), 'ContactsWorkspace')
const CompaniesWorkspace = lazyNamed(() => import('@/features/lists/companies-workspace'), 'CompaniesWorkspace')
const TasksWorkspace = lazyNamed(() => import('@/features/lists/tasks-workspace'), 'TasksWorkspace')
const EnhancedLeadsView = lazyNamed(() => import('@/components/leads-module'), 'EnhancedLeadsView')
const DealsWorkspace = lazyNamed(() => import('@/features/deals/deals-workspace'), 'DealsWorkspace')
const LiveCatalogWorkspace = lazyNamed(() => import('@/features/catalog/live-catalog-workspace'), 'LiveCatalogWorkspace')
const NewCRMModule = lazyNamed(() => import('@/components/new-crm-modules'), 'NewCRMModule')
const TeamView = lazyNamed(() => import('@/components/workspace/team-view'), 'TeamView')
const LiveDuplicatesWorkspace = lazyNamed(() => import('@/features/ops/live-ops-workspaces'), 'LiveDuplicatesWorkspace')
const LiveRecycleBinWorkspace = lazyNamed(() => import('@/features/ops/live-ops-workspaces'), 'LiveRecycleBinWorkspace')
const LiveQuotesInvoicesWorkspace = lazyNamed(
  () => import('@/features/ops/live-ops-workspaces'),
  'LiveQuotesInvoicesWorkspace',
)
const LiveSupportSettingsWorkspace = lazyNamed(
  () => import('@/features/ops/live-ops-workspaces'),
  'LiveSupportSettingsWorkspace',
)
const LiveCustomerPortalWorkspace = lazyNamed(
  () => import('@/features/ops/live-ops-workspaces'),
  'LiveCustomerPortalWorkspace',
)
const LiveChatWorkspace = lazyNamed(() => import('@/features/ops/live-ops-workspaces'), 'LiveChatWorkspace')
const LiveOrgSettingsWorkspace = lazyNamed(
  () => import('@/features/ops/live-ops-workspaces'),
  'LiveOrgSettingsWorkspace',
)
const SupportWorkspace = lazyNamed(() => import('@/features/support/support-workspace'), 'SupportWorkspace')
const ProductsWorkspace = lazyNamed(() => import('@/features/commerce/products-workspace'), 'ProductsWorkspace')
const DocumentsWorkspace = lazyNamed(() => import('@/features/commerce/documents-workspace'), 'DocumentsWorkspace')
const AutomationWorkspace = lazyNamed(
  () => import('@/features/automation/automation-workspace'),
  'AutomationWorkspace',
)
const InboxWorkspace = lazyNamed(() => import('@/features/engage/inbox-workspace'), 'InboxWorkspace')
const TemplatesWorkspace = lazyNamed(() => import('@/features/engage/templates-workspace'), 'TemplatesWorkspace')
const CampaignsWorkspace = lazyNamed(() => import('@/features/engage/campaigns-workspace'), 'CampaignsWorkspace')
const SequencesWorkspace = lazyNamed(() => import('@/features/engage/sequences-workspace'), 'SequencesWorkspace')
const CallingWorkspace = lazyNamed(() => import('@/features/engage/calling-workspace'), 'CallingWorkspace')
const FormsWorkspace = lazyNamed(() => import('@/features/engage/forms-workspace'), 'FormsWorkspace')
const ActivitiesWorkspace = lazyNamed(() => import('@/features/engage/activities-workspace'), 'ActivitiesWorkspace')
const AssignmentRulesWorkspace = lazyNamed(
  () => import('@/features/automation/assignment-rules-workspace'),
  'AssignmentRulesWorkspace',
)
const ScoringApprovalsWorkspace = lazyNamed(
  () => import('@/features/automation/scoring-approvals-workspace'),
  'ScoringApprovalsWorkspace',
)

export type ViewRouterContext = {
  notify: Notify
  setView: (view: View) => void
  setSelectedRecord: (record: { type: RecordType; id: string } | null) => void
  setShowQuickCreate: (open: boolean) => void
  setShowImport: (open: boolean) => void
  leadList: Lead[]
  setLeadList: Dispatch<SetStateAction<Lead[]>>
  setConvertLead: (lead: Lead | null) => void
}

function WorkspaceSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<GlobalLoader label="Loading view…" />}>{children}</Suspense>
}

function catalog(
  title: string,
  route: string,
  notify: Notify,
  createDefaults?: Record<string, unknown>,
  nameField?: string,
) {
  return (
    <LiveCatalogWorkspace
      title={title}
      route={route}
      notify={notify}
      createDefaults={createDefaults}
      nameField={nameField}
    />
  )
}

/** Maps the active shell view to a lazily loaded workspace module. */
export function renderWorkspace(view: View, ctx: ViewRouterContext) {
  const { notify, setView, setSelectedRecord, setShowQuickCreate, setShowImport, leadList, setLeadList, setConvertLead } =
    ctx

  const content = (() => {
    switch (view) {
      case 'Dashboard':
        return (
          <DashboardWorkspace
            notify={notify}
            onNavigate={(next: string) => setView(next as View)}
            onOpenDeal={(id: string) => {
              setView('Deals')
              setSelectedRecord({ type: 'deal', id })
            }}
            onCreate={() => setShowQuickCreate(true)}
          />
        )
      case 'CRM Overview':
        return <LiveOverviewWorkspace notify={notify} />
      case 'Forecast':
        return <LiveForecastWorkspace notify={notify} />
      case 'Goals':
        return <LiveGoalsWorkspace notify={notify} />
      case 'Contacts':
        return <ContactsWorkspace notify={notify} onOpen={(id: string) => setSelectedRecord({ type: 'contact', id })} />
      case 'Companies':
        return <CompaniesWorkspace notify={notify} onOpen={(id: string) => setSelectedRecord({ type: 'company', id })} />
      case 'Leads':
        return (
          <EnhancedLeadsView
            leads={leadList}
            setLeads={setLeadList}
            notify={notify}
            onOpen={(id: string) => setSelectedRecord({ type: 'lead', id })}
            onConvert={(lead: Lead) => setConvertLead(lead)}
            onImport={() => setShowImport(true)}
          />
        )
      case 'Deals':
        return <DealsWorkspace notify={notify} onOpen={(id: string) => setSelectedRecord({ type: 'deal', id })} />
      case 'Import':
        return (
          <div className="p-5 lg:p-8">
            <button type="button" onClick={() => setShowImport(true)} className={ui.buttonPrimary}>
              Open import wizard
            </button>
          </div>
        )
      case 'Duplicates':
        return <LiveDuplicatesWorkspace notify={notify} />
      case 'Recycle bin':
        return <LiveRecycleBinWorkspace notify={notify} />
      case 'Tasks':
        return <TasksWorkspace notify={notify} />
      case 'Calendar':
      case 'Meeting scheduler':
        return catalog('Calendar', 'calendar-events', notify, {}, 'title')
      case 'Activities':
        return <ActivitiesWorkspace notify={notify} />
      case 'Inbox':
        return <InboxWorkspace notify={notify} />
      case 'Email templates':
        return <TemplatesWorkspace notify={notify} />
      case 'Email campaigns':
        return <CampaignsWorkspace notify={notify} />
      case 'Sequences':
        return <SequencesWorkspace notify={notify} />
      case 'Calling':
        return <CallingWorkspace notify={notify} />
      case 'Lead capture forms':
        return <FormsWorkspace notify={notify} />
      case 'Support tickets':
        return <SupportWorkspace notify={notify} />
      case 'Support settings':
        return <LiveSupportSettingsWorkspace notify={notify} />
      case 'Knowledge base':
        return catalog('Knowledge base', 'knowledge-articles', notify, { published: true }, 'title')
      case 'Customer portal':
        return <LiveCustomerPortalWorkspace notify={notify} />
      case 'Live chat':
        return <LiveChatWorkspace notify={notify} />
      case 'Support analytics':
        return <LiveSupportAnalyticsWorkspace notify={notify} />
      case 'Reports':
        return <LiveForecastWorkspace notify={notify} />
      case 'Automation':
        return <AutomationWorkspace notify={notify} />
      case 'Assignment rules':
        return <AssignmentRulesWorkspace notify={notify} />
      case 'Lead scoring':
        return <ScoringApprovalsWorkspace notify={notify} />
      case 'Approval workflows':
        return <ScoringApprovalsWorkspace notify={notify} />
      case 'Workflow logs':
        return catalog('Workflow logs', 'workflow-logs', notify, {}, 'workflowName')
      case 'Integrations':
        return catalog('Integrations', 'integrations', notify, { status: 'Disconnected' })
      case 'Developer':
        return catalog('Developer', 'developer', notify)
      case 'Team':
        return <TeamView notify={notify} />
      case 'Products':
        return <ProductsWorkspace notify={notify} />
      case 'Quotes & invoices':
        return <LiveQuotesInvoicesWorkspace notify={notify} />
      case 'Documents':
        return <DocumentsWorkspace notify={notify} />
      case 'Settings':
        return <LiveOrgSettingsWorkspace notify={notify} />
      default:
        if (isModuleView(view)) return <NewCRMModule kind={view} notify={notify} />
        return <GenericView view={view} notify={notify} />
    }
  })()

  return <WorkspaceSuspense>{content}</WorkspaceSuspense>
}
