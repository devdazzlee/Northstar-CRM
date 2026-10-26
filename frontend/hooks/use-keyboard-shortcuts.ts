'use client'

import { useEffect } from 'react'

type ShortcutHandlers = {
  onOpenAi?: () => void
  onOpenSearch?: () => void
  onOpenShortcuts?: () => void
}

/**
 * Global ⌘/Ctrl+J (AI), ⌘/Ctrl+K (search), ? (shortcuts help).
 * Skips ? when focus is in an editable field.
 */
export function useKeyboardShortcuts({ onOpenAi, onOpenSearch, onOpenShortcuts }: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (meta && key === 'j') {
        event.preventDefault()
        onOpenAi?.()
        return
      }
      if (meta && key === 'k') {
        event.preventDefault()
        onOpenSearch?.()
        return
      }

      const tag = document.activeElement?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement | null)?.isContentEditable
      if (event.key === '?' && !isEditing) {
        onOpenShortcuts?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenAi, onOpenSearch, onOpenShortcuts])
}
