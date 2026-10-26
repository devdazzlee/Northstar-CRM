'use client'

import { useState } from 'react'
import {
  Bot,
  Check,
  Menu,
  MessageCircle,
  Send,
  X,
  Zap,
} from 'lucide-react'
import { useDealsQuery, useLeadsQuery, useNotificationsQuery, useTasksQuery } from '@/hooks/use-crm-queries'
import type { UiDeal, UiTask } from '@/lib/api/mappers'
import type { Lead, WorkspaceNotification } from '@/lib/types'

type Notify = (message: string) => void

const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'

function aiReply(
  prompt: string,
  deals: UiDeal[],
  leads: Lead[],
  tasks: UiTask[],
  notifications: WorkspaceNotification[],
) {
  const text = prompt.toLowerCase()
  const topDeals = [...deals]
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
    .slice(0, 3)
  const topLeads = [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3)
  const openTasks = tasks.filter((task) => String(task.status).toLowerCase() !== 'done').slice(0, 3)
  const unread = notifications.filter((item) => !item.read).slice(0, 3)
  const dealLine = (deal: UiDeal) => `${deal.name} (${deal.stage}, ${deal.probability}%, ${deal.amount})`
  const leadLine = (lead: Lead) => `${lead.name} · score ${lead.score} · ${lead.status}`
  const taskLine = (task: UiTask) => `${task.title} · ${task.due} · ${task.priority}`

  if (text.includes('email') || text.includes('draft')) {
    const target = topDeals[0]?.company || topLeads[0]?.company || 'there'
    return {
      reply: `Draft ready:\n\nHi ${target} — following up on our conversation. Based on your timeline, I recommend we schedule a 20-minute review this week to confirm scope and next steps.\n\nBest`,
      navigate: 'Email templates',
    }
  }
  if (text.includes('summarize') || text.includes('summary')) {
    const focus = topDeals[0]
    return {
      reply: focus
        ? `Summary from live pipeline: ${dealLine(focus)}. Open tasks: ${openTasks.length}. Unread alerts: ${unread.length}.`
        : 'No deals loaded yet — open Deals after the API finishes loading.',
      navigate: 'Deals',
    }
  }
  if (text.includes('next best') || text.includes('action') || text.includes('task')) {
    const dealPart = topDeals.length
      ? `Deals:\n${topDeals.map((d, i) => `${i + 1}) ${dealLine(d)}`).join('\n')}`
      : 'No open deals.'
    const taskPart = openTasks.length
      ? `Tasks:\n${openTasks.map((t, i) => `${i + 1}) ${taskLine(t)}`).join('\n')}`
      : 'No open tasks.'
    return { reply: `${dealPart}\n\n${taskPart}`, navigate: openTasks.length ? 'Tasks' : 'Deals' }
  }
  if (text.includes('score') || text.includes('lead')) {
    return {
      reply: topLeads.length
        ? `Lead scoring from live data:\n${topLeads.map((l, i) => `${i + 1}) ${leadLine(l)}`).join('\n')}`
        : 'No leads loaded yet from the API.',
      navigate: 'Leads',
    }
  }
  if (text.includes('notif')) {
    return {
      reply: unread.length
        ? `Unread notifications:\n${unread.map((n, i) => `${i + 1}) ${n.text}`).join('\n')}`
        : 'No unread notifications.',
      navigate: 'Dashboard',
    }
  }
  if (text.includes('call') || text.includes('script')) {
    return {
      reply:
        'Call script:\n1) Confirm current tools and pain\n2) Share one relevant customer outcome\n3) Ask for decision timeline\n4) Book a technical follow-up',
      navigate: 'Calling',
    }
  }
  if (text.includes('similar') || text.includes('deal')) {
    return {
      reply: topDeals.length
        ? `Similar / high-probability deals:\n${topDeals.map((d) => `• ${dealLine(d)}`).join('\n')}`
        : 'No deals available to compare yet.',
      navigate: 'Deals',
    }
  }
  return {
    reply: `Got it — “${prompt.trim()}”. Live workspace: ${deals.length} deals, ${leads.length} leads, ${openTasks.length} open tasks, ${unread.length} unread alerts.`,
    navigate: 'Dashboard',
  }
}

export function AIAssistant({
  open,
  onClose,
  notify,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  notify: Notify
  onNavigate?: (view: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'I can help you move work forward. Ask about a record, pipeline, or next action.' },
  ])
  const [lastNavigate, setLastNavigate] = useState('Dashboard')
  const dealsQuery = useDealsQuery()
  const leadsQuery = useLeadsQuery()
  const tasksQuery = useTasksQuery()
  const notificationsQuery = useNotificationsQuery()
  if (!open) return null
  const deals = dealsQuery.data ?? []
  const leads = leadsQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const notifications = notificationsQuery.data ?? []
  const ask = (value = prompt) => {
    if (!value.trim()) return
    const result = aiReply(value, deals, leads, tasks, notifications)
    setLastNavigate(result.navigate)
    setMessages((current) => [...current, { role: 'user', text: value }, { role: 'assistant', text: result.reply }])
    setPrompt('')
    notify('AI response ready')
  }
  return (
    <aside aria-label="AI assistant" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"><Bot className="size-4" /></div>
        <div className="flex-1"><p className="text-sm font-semibold">Northstar AI</p><p className="text-xs text-slate-500">Workspace copilot</p></div>
        <button aria-label="Close AI assistant" onClick={onClose}><X className="size-4 text-slate-400" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        {['Draft email', 'Summarize record', 'Next best action', 'Explain lead score', 'Call script', 'Similar deals'].map((action) => (
          <button key={action} onClick={() => ask(action)} className="rounded-lg bg-slate-50 p-2.5 text-left text-[11px] font-medium hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800">{action}</button>
        ))}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'ml-8 rounded-xl bg-slate-900 p-3 text-xs whitespace-pre-wrap text-white dark:bg-white dark:text-slate-900' : 'mr-6 rounded-xl bg-slate-100 p-3 text-xs leading-5 whitespace-pre-wrap dark:bg-slate-900'}>{message.text}</div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700">
          <textarea aria-label="Ask AI" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); ask() } }} placeholder="Ask anything..." className="min-h-10 flex-1 resize-none bg-transparent p-1 text-xs outline-none" />
          <button aria-label="Send AI prompt" onClick={() => ask()} className="rounded-lg bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900"><Send className="size-3.5" /></button>
        </div>
        {messages.length > 1 && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(lastNavigate)}
            className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Open related workspace
          </button>
        )}
      </div>
    </aside>
  )
}

export { CollaborationPanel } from '@/features/workflows'

export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-5">
      <div className={`${panel} w-full max-w-md p-6`} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
          <button type="button" aria-label="Close shortcuts" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          {[
            ['⌘ J', 'Open AI assistant'],
            ['⌘ K', 'Global search'],
            ['?', 'Show shortcuts'],
            ['G then D', 'Go to dashboard'],
            ['N', 'Quick create'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-slate-500">{label}</span>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MobileTabBar({ onNavigate }: { onNavigate: (label: string) => void }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
    >
      {(
        [
          ['Dashboard', Menu],
          ['Inbox', MessageCircle],
          ['Deals', Zap],
          ['Tasks', Check],
          ['More', Menu],
        ] as const
      ).map(([label, Icon]) => (
        <button
          key={label}
          type="button"
          onClick={() => onNavigate(label)}
          className="flex min-w-14 flex-col items-center gap-1 rounded-lg p-1.5 text-[10px] text-slate-500"
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
