'use client'

import { useState } from 'react'
import { KeyRound, Link2, Plus, Webhook } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { type Notify } from '@/lib/ui'
import { RunLogs } from './run-logs'
import { button, integrations, primary, shell } from './shared'

export function AutomationAdminWorkspace({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState('Run logs')
  const [connected, setConnected] = useState<string[]>(['Gmail', 'Slack'])

  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Automation"
        title="Automation admin"
        description="Monitor runs, connect tools, and manage developer access."
        action="Create API key"
        onAction={() => notify('API key created')}
      />
      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {['Run logs', 'Integrations', 'Developer'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-md px-3 py-2 text-xs font-semibold ${tab === item ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === 'Run logs' ? (
        <RunLogs notify={notify} />
      ) : tab === 'Integrations' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((name) => {
            const active = connected.includes(name)
            return (
              <div key={name} className={shell + ' p-4'}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Link2 className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-slate-500">{active ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <span className={`size-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <button
                  onClick={() => {
                    setConnected((items) => (active ? items.filter((item) => item !== name) : [...items, name]))
                    notify(`${name} ${active ? 'disconnected' : 'connected'}`)
                  }}
                  className={button + ' mt-4 w-full'}
                >
                  {active ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className={shell + ' p-5'}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">API keys</p>
              <button onClick={() => notify('API key created')} className={primary}>
                <Plus className="mr-1 inline size-3.5" />
                Create key
              </button>
            </div>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {['Production key ·•••• 7H2K', 'Preview key ·•••• A91P'].map((key) => (
                <div key={key} className="flex items-center gap-3 py-3">
                  <KeyRound className="size-4 text-slate-400" />
                  <span className="flex-1 font-mono text-xs">{key}</span>
                  <button onClick={() => notify('API key revoked')} className="text-xs text-rose-600">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-sm font-semibold">Webhooks</p>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
                <Webhook className="size-4 text-indigo-600" />
                <span className="flex-1 truncate">https://api.northstar.io/hooks/crm</span>
                <span className="text-emerald-600">Healthy</span>
              </div>
            </div>
          </div>
          <div className={shell + ' p-5'}>
            <p className="text-sm font-semibold">API usage</p>
            <div className="mt-5 flex h-36 items-end gap-2">
              {[35, 48, 41, 62, 57, 76, 68, 84, 72, 92].map((height, index) => (
                <div key={index} className="flex-1 rounded-t bg-indigo-500/70" style={{ height: `${height}%` }} />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">8,421 requests this month</p>
          </div>
        </div>
      )}
    </div>
  )
}
