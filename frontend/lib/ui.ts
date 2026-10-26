/** Shared Tailwind class tokens — import these instead of redefining per file. */
export const ui = {
  shell: 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
  panel: 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
  button:
    'rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
  buttonPrimary:
    'rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
  input:
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
  eyebrow: 'text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300',
} as const

export type { Notify } from '@/lib/types'
