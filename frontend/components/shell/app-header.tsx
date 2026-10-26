'use client'

import { Bell, Bot, ChevronRight, LogOut, Menu, Moon, PanelLeftClose, Plus, Search, Settings, Sun, Users } from 'lucide-react'
import type { View, WorkspaceNotification } from '@/lib/types'
import type { Notify } from '@/lib/types'

type AppHeaderProps = {
  view: View
  dark: boolean
  sidebarOpen: boolean
  unreadCount: number
  notifications: WorkspaceNotification[]
  showNotifications: boolean
  showProfileMenu: boolean
  showAI: boolean
  userName: string
  userEmail: string
  userRole: string
  userInitials: string
  onToggleSidebar: () => void
  onToggleDark: () => void
  onOpenSearch: () => void
  onOpenCreate: () => void
  onOpenAI: () => void
  onSetShowNotifications: (open: boolean | ((prev: boolean) => boolean)) => void
  onSetShowProfileMenu: (open: boolean | ((prev: boolean) => boolean)) => void
  onMarkAllRead: () => void
  onOpenNotification: (item: WorkspaceNotification) => void
  onNavigate: (view: View) => void
  onSignOut: () => void
  notify: Notify
}

export function AppHeader({
  view,
  dark,
  sidebarOpen,
  unreadCount,
  notifications,
  showNotifications,
  showProfileMenu,
  showAI,
  userName,
  userEmail,
  userRole,
  userInitials,
  onToggleSidebar,
  onToggleDark,
  onOpenSearch,
  onOpenCreate,
  onOpenAI,
  onSetShowNotifications,
  onSetShowProfileMenu,
  onMarkAllRead,
  onOpenNotification,
  onNavigate,
  onSignOut,
  notify,
}: AppHeaderProps) {
  const menusOpen = showNotifications || showProfileMenu

  return (
    <header
      className={`${menusOpen ? 'z-50' : 'z-20'} flex h-[68px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:px-8`}
    >
      <button
        type="button"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        onClick={onToggleSidebar}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {sidebarOpen ? <PanelLeftClose className="size-5" /> : <Menu className="size-5" />}
      </button>

      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
        <span>Workspace</span>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-slate-700 dark:text-slate-200">{view}</span>
      </nav>

      <div className="relative ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            onOpenSearch()
            onSetShowNotifications(false)
            onSetShowProfileMenu(false)
          }}
          className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open notifications"
            aria-expanded={showNotifications}
            onClick={() => {
              onSetShowNotifications((open) => !open)
              onSetShowProfileMenu(false)
            }}
            className={`relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${showNotifications ? 'bg-slate-100 text-slate-900 dark:bg-slate-800' : ''}`}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900" role="menu">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-[11px] text-slate-400">{unreadCount} unread</p>
                </div>
                <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => onOpenNotification(item)}
                    className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${item.read ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{item.text}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{item.time} ago</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onSetShowNotifications(false)
                  onNavigate('Inbox')
                }}
                className="block w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                Open inbox
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Open AI assistant"
          title="Northstar AI (⌘J)"
          onClick={() => {
            onOpenAI()
            onSetShowNotifications(false)
            onSetShowProfileMenu(false)
          }}
          className={`hidden size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex ${showAI ? 'bg-slate-100 text-slate-900 dark:bg-slate-800' : ''}`}
        >
          <Bot className="size-4" />
        </button>

        <button type="button" onClick={onToggleDark} className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenCreate()
            onSetShowNotifications(false)
            onSetShowProfileMenu(false)
          }}
          className="ml-1 flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Plus className="size-3.5" aria-hidden />
          Create
        </button>

        <div className="relative ml-1">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
            onClick={() => {
              onSetShowProfileMenu((open) => !open)
              onSetShowNotifications(false)
            }}
            className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 ring-offset-2 hover:ring-2 hover:ring-blue-200 dark:bg-blue-950 dark:text-blue-300"
          >
            {userInitials}
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900" role="menu">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-[11px] text-slate-400">
                  {userEmail} · {userRole}
                </p>
              </div>
              <button type="button" role="menuitem" onClick={() => { onSetShowProfileMenu(false); onNavigate('Settings') }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <Settings className="size-4 text-slate-400" aria-hidden />Settings
              </button>
              <button type="button" role="menuitem" onClick={() => { onSetShowProfileMenu(false); onNavigate('Team') }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <Users className="size-4 text-slate-400" aria-hidden />Team
              </button>
              <button type="button" role="menuitem" onClick={() => { onSetShowProfileMenu(false); onToggleDark() }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                {dark ? <Sun className="size-4 text-slate-400" aria-hidden /> : <Moon className="size-4 text-slate-400" aria-hidden />}
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSetShowProfileMenu(false)
                  onSignOut()
                  notify('Signed out')
                }}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30"
              >
                <LogOut className="size-4" aria-hidden />Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
