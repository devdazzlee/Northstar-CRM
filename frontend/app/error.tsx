'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error('Application error boundary', error) }, [error]); return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] p-6 text-slate-950 dark:bg-slate-950 dark:text-white"><section className="max-w-md text-center"><p className="text-sm font-semibold text-rose-600">500</p><h1 className="mt-2 text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-sm text-slate-500">We could not load this workspace. Try again or return home.</p><button onClick={reset} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></section></main> }
