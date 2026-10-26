'use client'

import { useState } from 'react'
import { ExternalLink, MessageCircle, Plus, Settings2, ShieldCheck } from 'lucide-react'
import { type Notify } from '@/lib/ui'
import { cx, Pill, Shell } from './shared'

export function SupportSettings({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState<'SLA' | 'Knowledge base' | 'Portal' | 'Chat' | 'Analytics'>('SLA')
  return (
    <Shell title="Support settings" action="Save changes" onAction={() => notify('Support settings saved')}>
      <div className="mb-5 flex flex-wrap gap-2">
        {['SLA', 'Knowledge base', 'Portal', 'Chat', 'Analytics'].map((item) => (
          <button key={item} onClick={() => setTab(item as typeof tab)} className={cx('rounded-lg px-3 py-2 text-xs font-semibold', tab === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
            {item}
          </button>
        ))}
      </div>
      {tab === 'SLA' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SettingsCard title="SLA policies" icon={<ShieldCheck className="size-4" />}>
            <SettingRow label="Urgent first response" value="1 hour" />
            <SettingRow label="High first response" value="4 hours" />
            <SettingRow label="Normal first response" value="12 hours" />
          </SettingsCard>
          <SettingsCard title="Escalation rules" icon={<Settings2 className="size-4" />}>
            <SettingRow label="Notify manager at" value="75% consumed" />
            <SettingRow label="Reassign after" value="100% consumed" />
            <SettingRow label="Business hours" value="Mon–Fri, 9–6" />
          </SettingsCard>
        </div>
      )}
      {tab === 'Knowledge base' && <KnowledgeBase notify={notify} />}
      {tab === 'Portal' && <PortalPreview notify={notify} />}
      {tab === 'Chat' && <ChatPreview notify={notify} />}
      {tab === 'Analytics' && <SupportAnalytics />}
    </Shell>
  )
}

function SettingsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-xs dark:bg-slate-950/50">
      <span>{label}</span>
      <span className="font-semibold text-indigo-600">{value}</span>
    </div>
  )
}

function KnowledgeBase({ notify }: { notify: Notify }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Articles</p>
          <button onClick={() => setEditing(true)} className="rounded-md bg-indigo-600 p-1.5 text-white">
            <Plus className="size-4" />
          </button>
        </div>
        {['Exporting reports', 'Invite troubleshooting', 'API rate limits', 'Billing FAQ'].map((article, index) => (
          <button key={article} className="mt-3 flex w-full items-center justify-between rounded-lg p-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
            <span>{article}</span>
            <Pill tone={index === 0 ? 'emerald' : 'slate'}>{index === 0 ? 'Published' : 'Draft'}</Pill>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600">Knowledge base editor</p>
            <h2 className="mt-1 text-lg font-semibold">Exporting reports</h2>
          </div>
          <button onClick={() => notify('Public preview opened')} className="text-xs font-semibold text-indigo-600">
            Public preview <ExternalLink className="ml-1 inline size-3" />
          </button>
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-4 flex gap-2 border-b border-slate-200 pb-3 text-xs dark:border-slate-700">
            <b>B</b>
            <i>I</i>
            <span>Heading</span>
            <span>Link</span>
          </div>
          <h3 className="text-base font-semibold">Exporting reports</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Learn how to export quarterly reports and troubleshoot timeouts when selecting all accounts.</p>
        </div>
        {editing && <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">New article draft created. Add a title and category to begin.</div>}
      </div>
    </div>
  )
}

function PortalPreview({ notify }: { notify: Notify }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <SettingsCard title="Customer portal" icon={<ExternalLink className="size-4" />}>
        <SettingRow label="Portal status" value="Published" />
        <SettingRow label="Custom domain" value="support.northstar.io" />
        <SettingRow label="Ticket submission" value="Enabled" />
        <button onClick={() => notify('Portal preview opened')} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
          Open customer preview
        </button>
      </SettingsCard>
      <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white">
        <p className="text-xs text-indigo-300">Customer portal preview</p>
        <h2 className="mt-2 text-xl font-semibold">How can we help?</h2>
        <div className="mt-4 rounded-lg bg-white/10 p-3 text-xs">Search the knowledge base</div>
        <div className="mt-3 rounded-lg bg-indigo-600 p-3 text-center text-xs font-semibold">Submit a ticket</div>
        <p className="mt-5 text-xs text-slate-400">Your open tickets · SUP-1048 · In progress</p>
      </div>
    </div>
  )
}

function ChatPreview({ notify }: { notify: Notify }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <SettingsCard title="Live chat inbox" icon={<MessageCircle className="size-4" />}>
        <div className="space-y-3">
          {['Maya Rodriguez · Pricing question', 'Demi Wilkinson · Export help', 'Jon Bell · Invite issue'].map((visitor, i) => (
            <div key={visitor} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950/50">
              <span>{visitor}</span>
              <Pill tone={i === 0 ? 'rose' : 'emerald'}>{i === 0 ? 'Waiting' : 'Active'}</Pill>
            </div>
          ))}
        </div>
        <button onClick={() => notify('Chat widget settings opened')} className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700">
          Customize widget
        </button>
      </SettingsCard>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold text-slate-500">Widget preview</p>
        <div className="mt-5 rounded-xl bg-indigo-600 p-4 text-white shadow-lg">
          <MessageCircle className="size-5" />
          <p className="mt-4 text-sm font-semibold">Hi there</p>
          <p className="mt-1 text-xs text-indigo-100">How can we help today?</p>
          <button className="mt-4 w-full rounded-lg bg-white py-2 text-xs font-semibold text-indigo-700">Start a conversation</button>
        </div>
      </div>
    </div>
  )
}

function SupportAnalytics() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['First response time', '1h 42m', '-18%'],
        ['Resolution time', '8h 14m', '-12%'],
        ['CSAT', '4.8 / 5', '+0.3'],
        ['Backlog', '28 tickets', '-8%'],
      ].map(([label, value, trend]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-emerald-600">{trend} this month</p>
        </div>
      ))}
    </div>
  )
}
