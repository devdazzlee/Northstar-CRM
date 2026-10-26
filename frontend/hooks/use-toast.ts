'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TOAST_DURATION_MS } from '@/lib/constants'
import type { Notify } from '@/lib/types'

/** Local toast notifications with automatic cleanup of timers. */
export function useToast(durationMs = TOAST_DURATION_MS) {
  const [toast, setToast] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const notify: Notify = useCallback(
    (message) => {
      setToast(message)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setToast(''), durationMs)
    },
    [durationMs],
  )

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast('')
  }, [])

  return { toast, notify, dismiss }
}
