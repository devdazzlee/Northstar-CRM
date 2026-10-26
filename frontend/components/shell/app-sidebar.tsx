'use client'

import { useEffect, useRef, useState } from 'react'
import { CircleHelp, LogOut, MoreHorizontal, PanelLeftClose, Search, Settings, Users } from 'lucide-react'
import { NorthstarLogo } from '@/components/northstar-logo'
import { NAV_GROUPS } from '@/components/shell/nav-config'
import type { View } from '@/lib/types'

type AppSidebarProps = {
  view: View
  open: boolean
  allowedTabs?: string[] | null
  userName: string
  userRole: string
  userInitials: string
  onClose: () => void
  onNavigate: (view: View) => void
  onOpenSearch: () => void
  onSignOut: () => void
}

export function AppSidebar({
  view,
  open,
  allowedTabs,
  userName,
  userRole,
  userInitials,
  onClose,
  onNavigate,
  onOpenSearch,
  onSignOut,
}: AppSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const go = (next: View) => {
    onNavigate(next)
    setMenuOpen(false)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) onClose()
  }

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: allowedTabs?.length
      ? group.items.filter((item) => allowedTabs.includes(item.label))
      : group.items,
  })).filter((group) => group.items.length > 0)

  return (
    <>
      {open && (
        <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`${open ? 'translate-x-0' : '-translate-x-full lg:hidden'} fixed inset-y-0 left-0 z-30 flex h-dvh w-[248px] flex-col border-r border-slate-200 bg-white px-3 py-4 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:relative lg:h-full lg:shrink-0`}
      >
        <div className="flex shrink-0 items-center justify-between px-3 pb-5">
          <NorthstarLogo />
          <button type="button" aria-label="Close sidebar" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="mb-4 flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1">Search anything</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] dark:border-slate-600 dark:bg-slate-700">⌘ K</kbd>
        </button>

        <nav aria-label="Primary" className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = view === item.label
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => go(item.label)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={`size-4 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden />
                      {item.label}
                      {item.label === 'Inbox' && (
                        <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">8</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-3 shrink-0 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button type="button" onClick={() => go('Settings')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50">
            <CircleHelp className="size-4 text-slate-400" aria-hidden />
            Help center
          </button>
          <button type="button" onClick={() => go('Settings')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50">
            <Settings className="size-4 text-slate-400" aria-hidden />
            Settings
          </button>
          <div ref={menuRef} className="relative mt-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{userName}</p>
                <p className="truncate text-[10px] text-slate-400">{userRole}</p>
              </div>
              <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </button>
            </div>
            {menuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => go('Settings')}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings className="size-4 text-slate-400" aria-hidden />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => go('Team')}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Users className="size-4 text-slate-400" aria-hidden />
                  Team
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onSignOut()
                  }}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
