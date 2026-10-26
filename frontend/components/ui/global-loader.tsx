'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type GlobalLoaderProps = {
  /** Accessible status text shown next to the spinner. */
  label?: string
  /**
   * - `page` — full workspace area (default for route/API waits)
   * - `section` — compact block inside a panel
   * - `inline` — small spinner for buttons / toolbars
   */
  variant?: 'page' | 'section' | 'inline'
  className?: string
}

/** Single shared loader for every API wait — use instead of one-off skeletons. */
export function GlobalLoader({
  label = 'Loading data…',
  variant = 'page',
  className = '',
}: GlobalLoaderProps) {
  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex items-center gap-2 text-xs font-medium text-slate-500', className)}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-3.5 animate-spin text-indigo-600" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }

  if (variant === 'section') {
    return (
      <div
        className={cn(
          'grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 dark:border-slate-700 dark:bg-slate-900/40',
          className,
        )}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-indigo-600" aria-hidden />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('grid min-h-[50vh] place-items-center p-5 lg:p-8', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid size-14 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" aria-hidden />
          <span className="absolute inset-1 rounded-full border-2 border-indigo-100 dark:border-indigo-950" aria-hidden />
          <Loader2 className="relative size-7 animate-spin text-indigo-600" aria-hidden />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-slate-400">Fetching live data from the API</p>
        </div>
      </div>
    </div>
  )
}
