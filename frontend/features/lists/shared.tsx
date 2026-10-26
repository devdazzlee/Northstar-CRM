"use client"

import {
  Download,
  Filter,
  Plus,
  Search,
} from "lucide-react"
import { type Notify } from "@/lib/ui"

export type Contact = {
  id?: string
  name: string
  company: string
  title?: string
  email: string
  phone?: string
  stage: string
  owner: string
  last: string
  tags?: string[]
  color?: string
}

export type Company = {
  id?: string
  name: string
  industry: string
  size: string
  revenue?: string
  location?: string
  owner: string
  deals?: number
  health?: number
  color?: string
}

export type SavedView = { name: string; count: number }

export const owners = ["All owners", "AR", "JC", "SL", "MK"]

export function Avatar({
  name,
  className = "",
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
        className || "bg-indigo-100 text-indigo-700"
      }`}
    >
      {initials}
    </div>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="p-5 lg:p-8">{children}</div>
}

export function Toolbar({
  query,
  setQuery,
  savedViews,
  view,
  setView,
  notify,
}: {
  query: string
  setQuery: (value: string) => void
  savedViews: SavedView[]
  view: string
  setView: (value: string) => void
  notify: Notify
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search records..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>
      <button
        onClick={() => notify("Filters opened")}
        className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"
      >
        <Filter className="size-3.5" />
        Filters
      </button>
      <select
        value={view}
        onChange={(event) => setView(event.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-transparent px-3 text-xs font-medium dark:border-slate-700"
      >
        {savedViews.map((item) => (
          <option key={item.name}>{item.name}</option>
        ))}
      </select>
      <button
        onClick={() => notify("Saved view created")}
        className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"
      >
        <Plus className="size-3.5" />
        Save view
      </button>
      <button
        onClick={() => notify("Export started")}
        className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700"
      >
        <Download className="size-3.5" />
        Export
      </button>
    </div>
  )
}

export function Field({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string
  name: string
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <label className="text-xs font-medium">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700"
      />
    </label>
  )
}
