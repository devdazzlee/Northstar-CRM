'use client'

import type { LucideIcon } from 'lucide-react'
import { ui } from '@/lib/ui'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className={`${ui.shell} p-12 text-center`}>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="size-5" aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className={`mt-5 ${ui.buttonPrimary}`}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
