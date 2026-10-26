'use client'

import { useCallback, useMemo, useState } from 'react'
import { RecordDetailDrawer, RecordDetailPage, type RecordType } from '@/components/record-detail-pages'
import { AIAssistant, MobileTabBar, ShortcutHelp } from '@/components/cross-cutting-features'
import { CollaborationPanel, ConvertLeadDialog, ImportWizard } from '@/features/workflows'
import { AppHeader } from '@/components/shell/app-header'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { Toast } from '@/components/ui/toast'
import { GlobalLoader } from '@/components/ui/global-loader'
import {
  ContactDialog,
  QuickCreate,
  QuickEntityDialog,
  SearchDialog,
  type QuickCreateLabel,
  type QuickEntityKind,
} from '@/components/workspace/shell-dialogs'
import { renderWorkspace } from '@/components/workspace/view-router'
import {
  useCompaniesQuery,
  useContactsQuery,
  useCreateCompanyMutation,
  useCreateContactMutation,
  useCreateDealMutation,
  useCreateTaskMutation,
  useDealsQuery,
  useLeadsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/use-crm-queries'
import { useCatalogCreateMutation } from '@/hooks/use-catalog-query'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useToast } from '@/hooks/use-toast'
import { recordPath } from '@/lib/record-path'
import { ApiError } from '@/lib/api/client'
import type { ContactFormValues } from '@/lib/validators/contact'
import type { Lead, View, WorkspaceNotification } from '@/lib/types'
import { useShellStore } from '@/stores/shell-store'
import { useAuthStore } from '@/stores/auth-store'
import { crmKeys } from '@/lib/api/crm'
import { logoutApi } from '@/lib/api/auth'
import { useQueryClient } from '@tanstack/react-query'

export default function Page() {
  const {
    view,
    dark,
    sidebarOpen,
    showQuickCreate,
    showSearch,
    showAI,
    showShortcuts,
    showNotifications,
    showProfileMenu,
    query,
    setView,
    toggleDark,
    setSidebarOpen,
    setShowQuickCreate,
    setShowSearch,
    setShowAI,
    setShowShortcuts,
    setShowNotifications,
    setShowProfileMenu,
    setQuery,
    closeMenus,
  } = useShellStore()

  const [showContact, setShowContact] = useState(false)
  const [quickEntity, setQuickEntity] = useState<QuickEntityKind | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<{ type: RecordType; id: string } | null>(null)
  const [fullRecord, setFullRecord] = useState<{ type: RecordType; id: string } | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)

  const { toast, notify } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const membership = useAuthStore((s) => s.membership)
  const clearSession = useAuthStore((s) => s.clearSession)

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User'
  const userEmail = user?.email ?? ''
  const userRole = membership?.role?.replaceAll('_', ' ') ?? 'Member'
  const userInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  const handleSignOut = () => {
    // Start logout while token is still available, then clear UI session immediately.
    void logoutApi()
    clearSession()
    queryClient.clear()
  }

  const contactsQuery = useContactsQuery()
  const companiesQuery = useCompaniesQuery()
  const leadsQuery = useLeadsQuery()
  const dealsQuery = useDealsQuery()
  const notificationsQuery = useNotificationsQuery()
  const createContact = useCreateContactMutation()
  const createCompany = useCreateCompanyMutation()
  const createDeal = useCreateDealMutation()
  const createTask = useCreateTaskMutation()
  const createActivity = useCatalogCreateMutation('activities')
  const createEvent = useCatalogCreateMutation('calendar-events')
  const markNotificationRead = useMarkNotificationReadMutation()
  const markAllNotificationsRead = useMarkAllNotificationsReadMutation()

  const contactList = contactsQuery.data ?? []
  const companyList = companiesQuery.data ?? []
  const leadList = leadsQuery.data ?? []
  const dealList = dealsQuery.data ?? []
  const notifications = notificationsQuery.data ?? []
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])
  const bootstrapping = contactsQuery.isLoading || leadsQuery.isLoading
  const quickBusy =
    createCompany.isPending ||
    createDeal.isPending ||
    createTask.isPending ||
    createActivity.isPending ||
    createEvent.isPending

  const openAi = useCallback(() => setShowAI(true), [setShowAI])
  const openSearch = useCallback(() => setShowSearch(true), [setShowSearch])
  const openShortcuts = useCallback(() => setShowShortcuts(true), [setShowShortcuts])
  useKeyboardShortcuts({ onOpenAi: openAi, onOpenSearch: openSearch, onOpenShortcuts: openShortcuts })

  const setLeadList = useCallback(
    (updater: Lead[] | ((prev: Lead[]) => Lead[])) => {
      queryClient.setQueryData<Lead[]>(crmKeys.leads(), (current = []) =>
        typeof updater === 'function' ? updater(current) : updater,
      )
    },
    [queryClient],
  )

  const openRecord = (type: RecordType, id: string) => {
    setFullRecord({ type, id })
    setSelectedRecord(null)
    window.history.pushState({}, '', recordPath(type, id))
  }

  const closeFullRecord = () => {
    setFullRecord(null)
    window.history.pushState({}, '', '/')
  }

  const findRecord = (type: RecordType, id: string) => {
    if (type === 'contact') return contactList.find((item) => item.id === id || item.email === id)
    if (type === 'company') return companyList.find((item) => item.id === id)
    if (type === 'lead') return leadList.find((item) => item.id === id)
    return dealList.find((item) => item.id === id || item.name === id)
  }

  const handleCreateContact = async (values: ContactFormValues) => {
    const contact = await createContact.mutateAsync(values)
    setShowContact(false)
    notify(`${contact.name} added to contacts`)
  }

  const handleQuickCreate = (label: QuickCreateLabel) => {
    setShowQuickCreate(false)
    if (label === 'Contact') {
      setShowContact(true)
      return
    }
    setQuickEntity(label)
  }

  const handleQuickEntitySubmit = async (values: Record<string, string>) => {
    if (!quickEntity) return
    try {
      if (quickEntity === 'Company') {
        await createCompany.mutateAsync({
          name: values.name,
          industry: values.industry || 'Services',
          size: values.size || '1-50',
          owner: values.owner || userName,
        })
        setView('Companies')
      } else if (quickEntity === 'Deal') {
        await createDeal.mutateAsync({
          name: values.name,
          company: values.company,
          amount: values.amount || '0',
          stage: values.stage || 'Qualified',
        })
        setView('Deals')
      } else if (quickEntity === 'Task') {
        await createTask.mutateAsync({
          title: values.title,
          due: values.due,
          assignee: values.assignee || userName,
          priority: (values.priority as 'Low' | 'Medium' | 'High') || 'Medium',
        })
        setView('Tasks')
      } else if (quickEntity === 'Note') {
        await createActivity.mutateAsync({
          type: 'note',
          subject: values.subject,
          body: values.body,
          actorName: userName,
          occurredAt: new Date().toISOString(),
        })
        setView('Activities')
      } else {
        const startsAt = values.startsAt ? new Date(values.startsAt).toISOString() : new Date().toISOString()
        await createEvent.mutateAsync({
          title: values.title,
          startsAt,
          endsAt: new Date(new Date(startsAt).getTime() + 3600000).toISOString(),
          location: values.location || undefined,
          description: '',
        })
        setView('Calendar')
      }
      notify(`${quickEntity} created`)
      setQuickEntity(null)
    } catch (error) {
      notify(error instanceof ApiError ? error.message : `Could not create ${quickEntity}`)
    }
  }

  const markAllRead = () => {
    const unreadIds = notifications.filter((row) => !row.read).map((row) => row.id)
    if (!unreadIds.length) {
      notify('No unread notifications')
      return
    }
    void markAllNotificationsRead.mutateAsync(unreadIds).then(
      () => notify('All notifications marked read'),
      (error: unknown) => notify(error instanceof ApiError ? error.message : 'Could not mark notifications read'),
    )
  }

  const openNotification = (item: WorkspaceNotification) => {
    if (!item.read) {
      void markNotificationRead.mutateAsync(item.id).catch(() => undefined)
    }
    setShowNotifications(false)
    setView(item.view)
  }

  return (
    <div className={dark ? 'dark h-dvh overflow-hidden bg-slate-950 text-slate-100' : 'h-dvh overflow-hidden bg-[#f1f5f9] text-slate-950'}>
      <div className="flex h-full min-h-0">
        <AppSidebar
          view={view}
          open={sidebarOpen}
          allowedTabs={membership?.tabs ?? null}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
          onClose={() => setSidebarOpen(false)}
          onNavigate={setView}
          onOpenSearch={() => setShowSearch(true)}
          onSignOut={handleSignOut}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            view={view}
            dark={dark}
            sidebarOpen={sidebarOpen}
            unreadCount={unreadCount}
            notifications={notifications}
            showNotifications={showNotifications}
            showProfileMenu={showProfileMenu}
            showAI={showAI}
            userName={userName}
            userEmail={organization ? `${userEmail} · ${organization.name}` : userEmail}
            userRole={userRole}
            userInitials={userInitials}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onToggleDark={toggleDark}
            onOpenSearch={() => setShowSearch(true)}
            onOpenCreate={() => setShowQuickCreate(true)}
            onOpenAI={() => setShowAI(true)}
            onSetShowNotifications={setShowNotifications}
            onSetShowProfileMenu={setShowProfileMenu}
            onMarkAllRead={markAllRead}
            onOpenNotification={openNotification}
            onNavigate={setView}
            onSignOut={handleSignOut}
            notify={notify}
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            {bootstrapping ? (
              <GlobalLoader label="Loading workspace…" />
            ) : fullRecord ? (
              <>
                <RecordDetailPage
                  record={findRecord(fullRecord.type, fullRecord.id)}
                  type={fullRecord.type}
                  onBack={closeFullRecord}
                  onNotify={notify}
                  onConvert={(lead) => setConvertLead(lead)}
                />
                <div className="mx-5 mb-24 mt-5 lg:mx-8">
                  <CollaborationPanel
                    notify={notify}
                    entityId={fullRecord.id}
                    entityLabel={`${fullRecord.type} ${fullRecord.id.slice(0, 8)}`}
                  />
                </div>
              </>
            ) : (
              renderWorkspace(view, {
                notify,
                setView,
                setSelectedRecord,
                setShowQuickCreate,
                setShowImport,
                leadList,
                setLeadList,
                setConvertLead,
              })
            )}
          </div>
        </main>
      </div>

      {showQuickCreate && <QuickCreate onClose={() => setShowQuickCreate(false)} onAction={handleQuickCreate} />}
      {showContact && (
        <ContactDialog
          onClose={() => setShowContact(false)}
          onSubmit={handleCreateContact}
          isSubmitting={createContact.isPending}
        />
      )}
      {quickEntity && (
        <QuickEntityDialog
          kind={quickEntity}
          onClose={() => setQuickEntity(null)}
          onSubmit={handleQuickEntitySubmit}
          isSubmitting={quickBusy}
          defaultOwner={userName}
        />
      )}
      {showImport && <ImportWizard onClose={() => setShowImport(false)} notify={notify} />}
      {convertLead && <ConvertLeadDialog lead={convertLead} onClose={() => setConvertLead(null)} notify={notify} />}
      {selectedRecord && (
        <RecordDetailDrawer
          record={findRecord(selectedRecord.type, selectedRecord.id)}
          type={selectedRecord.type}
          onClose={() => setSelectedRecord(null)}
          onOpenFull={() => openRecord(selectedRecord.type, selectedRecord.id)}
          onNotify={notify}
          onConvert={(lead) => setConvertLead(lead)}
        />
      )}
      {showSearch && (
        <SearchDialog
          query={query}
          setQuery={setQuery}
          onClose={() => setShowSearch(false)}
          onSelect={(next) => {
            setView(next)
            setShowSearch(false)
          }}
        />
      )}
      <AIAssistant open={showAI} onClose={() => setShowAI(false)} notify={notify} onNavigate={(next) => { setShowAI(false); setView(next as View) }} />
      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      {(showNotifications || showProfileMenu) && (
        <button
          type="button"
          aria-label="Close menus"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={closeMenus}
        />
      )}
      <Toast message={toast} />
      <MobileTabBar onNavigate={(label) => setView(label === 'More' ? 'Settings' : (label as View))} />
    </div>
  )
}
