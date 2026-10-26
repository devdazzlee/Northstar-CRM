'use client'

import { Plus } from 'lucide-react'
import { ui } from '@/lib/ui'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className={`mb-1 ${ui.eyebrow}`}>{eyebrow || 'Workspace'}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && onAction && (
        <button type="button" onClick={onAction} className={`flex h-9 items-center justify-center gap-2 ${ui.buttonPrimary}`}>
          <Plus className="size-4" />
          {action}
        </button>
      )}
    </div>
  )
}
