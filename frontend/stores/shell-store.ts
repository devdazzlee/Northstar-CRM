'use client'

import { create } from 'zustand'
import { DEFAULT_VIEW } from '@/lib/constants'
import type { View } from '@/lib/types'

type ShellState = {
  view: View
  dark: boolean
  sidebarOpen: boolean
  showQuickCreate: boolean
  showSearch: boolean
  showAI: boolean
  showShortcuts: boolean
  showNotifications: boolean
  showProfileMenu: boolean
  query: string
  setView: (view: View) => void
  setDark: (dark: boolean | ((prev: boolean) => boolean)) => void
  toggleDark: () => void
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setShowQuickCreate: (open: boolean) => void
  setShowSearch: (open: boolean) => void
  setShowAI: (open: boolean) => void
  setShowShortcuts: (open: boolean) => void
  setShowNotifications: (open: boolean | ((prev: boolean) => boolean)) => void
  setShowProfileMenu: (open: boolean | ((prev: boolean) => boolean)) => void
  setQuery: (query: string) => void
  closeMenus: () => void
}

function applyToggle(value: boolean | ((prev: boolean) => boolean), prev: boolean) {
  return typeof value === 'function' ? value(prev) : value
}

export const useShellStore = create<ShellState>((set) => ({
  view: DEFAULT_VIEW,
  dark: false,
  sidebarOpen: true,
  showQuickCreate: false,
  showSearch: false,
  showAI: false,
  showShortcuts: false,
  showNotifications: false,
  showProfileMenu: false,
  query: '',
  setView: (view) => set({ view }),
  setDark: (dark) => set((state) => ({ dark: applyToggle(dark, state.dark) })),
  toggleDark: () => set((state) => ({ dark: !state.dark })),
  setSidebarOpen: (open) => set((state) => ({ sidebarOpen: applyToggle(open, state.sidebarOpen) })),
  setShowQuickCreate: (showQuickCreate) => set({ showQuickCreate }),
  setShowSearch: (showSearch) => set({ showSearch }),
  setShowAI: (showAI) => set({ showAI }),
  setShowShortcuts: (showShortcuts) => set({ showShortcuts }),
  setShowNotifications: (open) => set((state) => ({ showNotifications: applyToggle(open, state.showNotifications) })),
  setShowProfileMenu: (open) => set((state) => ({ showProfileMenu: applyToggle(open, state.showProfileMenu) })),
  setQuery: (query) => set({ query }),
  closeMenus: () => set({ showNotifications: false, showProfileMenu: false }),
}))
