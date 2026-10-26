'use client'

import { Check } from 'lucide-react'

type ToastProps = {
  message: string
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl">
      <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
      {message}
    </div>
  )
}
