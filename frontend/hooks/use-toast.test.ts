import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '@/hooks/use-toast'

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets and clears toast messages', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast(1000))

    act(() => {
      result.current.notify('Saved')
    })
    expect(result.current.toast).toBe('Saved')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.toast).toBe('')
  })
})
