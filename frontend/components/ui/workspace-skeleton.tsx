'use client'

import { GlobalLoader } from '@/components/ui/global-loader'

/**
 * @deprecated Prefer `GlobalLoader` or `QueryGate` directly.
 * Kept as a thin alias so older imports stay consistent.
 */
export function WorkspaceSkeleton({ label = 'Loading workspace…' }: { label?: string }) {
  return <GlobalLoader label={label} variant="page" />
}
