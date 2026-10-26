'use client'

import type { LucideIcon } from 'lucide-react'
import { Layers3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { GlobalLoader } from '@/components/ui/global-loader'

type QueryGateProps = {
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  children: ReactNode
  /** Loader label while waiting on the API. */
  loadingLabel?: string
  errorTitle?: string
  errorIcon?: LucideIcon
  /** Optional empty state when loaded with no rows. */
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  className?: string
}

/**
 * Consistent API wait / error / empty gate for workspaces.
 * Always shows GlobalLoader while `isLoading` is true.
 */
export function QueryGate({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  loadingLabel = 'Loading data…',
  errorTitle = 'Could not load data',
  errorIcon: ErrorIcon = Layers3,
  isEmpty,
  emptyTitle = 'No records yet',
  emptyDescription = 'Nothing returned from the API for this view.',
  emptyActionLabel,
  onEmptyAction,
  className,
}: QueryGateProps) {
  if (isLoading) {
    return <GlobalLoader label={loadingLabel} variant="page" className={className} />
  }

  if (isError) {
    return (
      <div className={className ?? 'p-5 lg:p-8'}>
        <EmptyState
          icon={ErrorIcon}
          title={errorTitle}
          description={error instanceof Error ? error.message : 'Try again in a moment.'}
          actionLabel={onRetry ? 'Retry' : undefined}
          onAction={onRetry}
        />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={className ?? 'p-5 lg:p-8'}>
        <EmptyState
          icon={ErrorIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    )
  }

  return <>{children}</>
}
