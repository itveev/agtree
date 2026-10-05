import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadItems } from './loadItems'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('loadItems', () => {
  it('waits for the artificial delay before resolving fetched json', async () => {
    vi.useFakeTimers()
    const payload = [{ id: 1, parent: null, label: 'Айтем 1' }]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => payload,
      })),
    )

    let settled = false
    const pending = loadItems<typeof payload>('/items.json', 2000).then((items) => {
      settled = true
      return items
    })

    await vi.advanceTimersByTimeAsync(1999)
    await Promise.resolve()
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(pending).resolves.toEqual(payload)
    expect(fetch).toHaveBeenCalledWith('/items.json')
  })
})
