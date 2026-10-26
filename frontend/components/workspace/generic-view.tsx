'use client'

import { TrendingUp, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { ui } from '@/lib/ui'
import type { Notify, View } from '@/lib/types'

const METRICS = [
  ['Active records', '1,284', '+12.4%'],
  ['This month', '$84.6k', '+18.2%'],
  ['Needs attention', '18', 'View queue'],
] as const

type GenericViewProps = {
  view: View
  notify: Notify
}

export function GenericView({ view, notify }: GenericViewProps) {
  const action = 'Create new'
  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Workspace"
        title={view}
        description="Manage your workspace with clarity and confidence"
        action={action}
        onAction={() => notify(`${action} flow opened`)}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {METRICS.map(([label, value, change]) => (
          <div key={label} className={`${ui.shell} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <TrendingUp className="size-4 text-slate-400" aria-hidden />
            </div>
            <p className="mt-4 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-emerald-600">{change}</p>
          </div>
        ))}
      </div>
      <EmptyState
        icon={Users}
        title={`Your ${view.toLowerCase()} workspace`}
        description="This module is ready for your team. Use the action above to start building your workspace."
        actionLabel={action}
        onAction={() => notify(`${action} flow opened`)}
      />
    </div>
  )
}
