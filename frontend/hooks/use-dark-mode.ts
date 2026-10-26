'use client'

import { useCallback, useState } from 'react'

/** Local theme toggle for the demo shell (not persisted). */
export function useDarkMode(initial = false) {
  const [dark, setDark] = useState(initial)
  const toggle = useCallback(() => setDark((value) => !value), [])
  return { dark, setDark, toggle }
}
