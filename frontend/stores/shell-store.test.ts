import { beforeEach, describe, expect, it } from 'vitest'
import { useShellStore } from '@/stores/shell-store'

describe('useShellStore', () => {
  beforeEach(() => {
    useShellStore.setState({
      view: 'Dashboard',
      dark: false,
      sidebarOpen: true,
      showNotifications: false,
      showProfileMenu: false,
    })
  })

  it('navigates between views', () => {
    useShellStore.getState().setView('Contacts')
    expect(useShellStore.getState().view).toBe('Contacts')
  })

  it('toggles dark mode', () => {
    useShellStore.getState().toggleDark()
    expect(useShellStore.getState().dark).toBe(true)
  })

  it('closes menus together', () => {
    useShellStore.setState({ showNotifications: true, showProfileMenu: true })
    useShellStore.getState().closeMenus()
    expect(useShellStore.getState().showNotifications).toBe(false)
    expect(useShellStore.getState().showProfileMenu).toBe(false)
  })
})
