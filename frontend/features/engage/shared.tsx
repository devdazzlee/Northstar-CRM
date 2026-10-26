'use client'

export const avatar = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

export const pill =
  'rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="p-5 lg:p-8">{children}</div>
}

export function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="text-xs font-medium">
      {label}
      <input
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
      />
    </label>
  )
}
