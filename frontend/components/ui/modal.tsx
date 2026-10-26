'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { ui } from '@/lib/ui'

type ModalProps = {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}

/** Accessible dialog: Escape to close, labelled title, backdrop dismiss. */
export function Modal({ title, children, onClose, wide = false }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${ui.shell} max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} overflow-auto p-5 outline-none sm:p-6`}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {title}
          </h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
