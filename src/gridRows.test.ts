import { describe, expect, it } from 'vitest'
import { gridRowKey, toGridRows } from './gridRows'
import type { TreeItem } from './TreeStore'

describe('grid rows', () => {
  it('builds string keys for the grid without changing the source items', () => {
    const items: Array<TreeItem & { label: string }> = [
      { id: 1, parent: null, label: 'число' },
      { id: '1', parent: 1, label: 'строка' },
    ]

    const rows = toGridRows(items)

    expect(rows.map((row) => row.gridId)).toEqual(['n:1', 's:1'])
    expect(rows.map((row) => row.gridParent)).toEqual([null, 'n:1'])
    expect(rows[0]?.source).toBe(items[0])
    expect(items[0]).toEqual({ id: 1, parent: null, label: 'число' })
    expect(gridRowKey(8)).toBe('n:8')
    expect(gridRowKey('91064cef')).toBe('s:91064cef')
  })
})
