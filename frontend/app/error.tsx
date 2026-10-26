'use client'

import { useEffect } from 'react'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Next.js route-level error boundary — handles loading/error UI for this segment. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error boundary', error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-rose-600">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold">We could not load this workspace</h1>
        <p className="mt-3 text-sm text-slate-500">Try again, or return to the dashboard if the problem continues.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
            Try again
          </button>
          <a href="/" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
            Go home
          </a>
        </div>
      </section>
    </main>
  )
}
