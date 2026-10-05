import { describe, expect, it } from 'vitest'
import { TreeStore, type TreeItem } from './TreeStore'

interface Item extends TreeItem {
  label: string
}

function sample(): Item[] {
  return [
    { id: 1, parent: null, label: 'Айтем 1' },
    { id: '91064cef', parent: 1, label: 'Айтем 2' },
    { id: 3, parent: 1, label: 'Айтем 3' },
    { id: 4, parent: '91064cef', label: 'Айтем 4' },
    { id: 5, parent: '91064cef', label: 'Айтем 5' },
    { id: 6, parent: '91064cef', label: 'Айтем 6' },
    { id: 7, parent: 4, label: 'Айтем 7' },
    { id: 8, parent: 4, label: 'Айтем 8' },
  ]
}

function ids(items: readonly Item[]): Array<Item['id']> {
  return items.map((item) => item.id)
}

describe('TreeStore', () => {
  it('starts empty', () => {
    const store = new TreeStore<Item>([])

    expect(store.getAll()).toEqual([])
    expect(store.getItem(1)).toBeUndefined()
    expect(store.getChildren(1)).toEqual([])
    expect(store.getAllChildren(1)).toEqual([])
    expect(store.getAllParents(1)).toEqual([])
  })

  it('stores the initial array in source order and keeps item identity', () => {
    const items = sample()
    const store = new TreeStore(items)

    expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 5, 6, 7, 8])
    expect(store.getAll()[0]).toBe(items[0])
  })

  it('returns an item by number id and by string id', () => {
    const store = new TreeStore(sample())

    expect(store.getItem(1)?.label).toBe('Айтем 1')
    expect(store.getItem('91064cef')?.label).toBe('Айтем 2')
    expect(store.getItem(99)).toBeUndefined()
    expect(store.getItem('missing')).toBeUndefined()
  })

  it('returns direct children in source order and an empty array when there are none', () => {
    const store = new TreeStore(sample())

    expect(ids(store.getChildren(1))).toEqual(['91064cef', 3])
    expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6])
    expect(store.getChildren(7)).toEqual([])
    expect(store.getChildren(42)).toEqual([])
  })

  it('returns all descendants in depth-first preorder', () => {
    const store = new TreeStore(sample())

    expect(ids(store.getAllChildren(1))).toEqual(['91064cef', 4, 7, 8, 5, 6, 3])
    expect(ids(store.getAllChildren('91064cef'))).toEqual([4, 7, 8, 5, 6])
    expect(ids(store.getAllChildren(4))).toEqual([7, 8])
    expect(store.getAllChildren(7)).toEqual([])
    expect(store.getAllChildren('missing')).toEqual([])
  })

  it('returns parents from the item itself up to the root', () => {
    const store = new TreeStore(sample())

    expect(ids(store.getAllParents(7))).toEqual([7, 4, '91064cef', 1])
    expect(ids(store.getAllParents('91064cef'))).toEqual(['91064cef', 1])
    expect(ids(store.getAllParents(1))).toEqual([1])
    expect(store.getAllParents(99)).toEqual([])
  })

  it('replaces the whole data set', () => {
    const store = new TreeStore(sample())
    const next = [{ id: 'only', parent: null, label: 'Один' }]

    store.setItems(next)

    expect(store.getAll()).toEqual(next)
    expect(store.getItem(1)).toBeUndefined()
    expect(store.getItem('only')).toBe(next[0])
    expect(store.getChildren('only')).toEqual([])
  })

  it('appends an item without reordering existing children', () => {
    const store = new TreeStore(sample())
    const added = { id: 9, parent: '91064cef', label: 'Айтем 9' }

    store.addItem(added)

    expect(store.getAll().at(-1)).toBe(added)
    expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6, 9])
    expect(store.getItem(9)).toBe(added)
  })

  it('updates an item without moving it when the parent stays the same', () => {
    const store = new TreeStore(sample())

    store.updateItem({ id: 5, parent: '91064cef', label: 'Пять' })

    expect(store.getItem(5)).toEqual({ id: 5, parent: '91064cef', label: 'Пять' })
    expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 5, 6, 7, 8])
    expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6])
    expect(store.getChildren('91064cef')[1]).toBe(store.getItem(5))
  })

  it('moves an item to a new parent and keeps every index consistent', () => {
    const store = new TreeStore(sample())

    store.updateItem({ id: 5, parent: 1, label: 'Айтем 5' })

    expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 5, 6, 7, 8])
    expect(ids(store.getChildren(1))).toEqual(['91064cef', 3, 5])
    expect(ids(store.getChildren('91064cef'))).toEqual([4, 6])
    expect(store.getItem(5)?.parent).toBe(1)

    store.updateItem({ id: 6, parent: '91064cef', label: 'шестой' })

    expect(ids(store.getChildren('91064cef'))).toEqual([4, 6])
    expect(store.getChildren('91064cef')[1]?.label).toBe('шестой')
    expect(store.getItem(6)).toBe(store.getChildren('91064cef')[1])
  })

  it('keeps descendants attached when their parent moves', () => {
    const store = new TreeStore(sample())

    store.updateItem({ id: 4, parent: 1, label: 'Айтем 4' })

    expect(ids(store.getChildren('91064cef'))).toEqual([5, 6])
    expect(ids(store.getChildren(4))).toEqual([7, 8])
    expect(ids(store.getChildren(1))).toEqual(['91064cef', 3, 4])
    expect(ids(store.getAllParents(7))).toEqual([7, 4, 1])
  })

  it('ignores updateItem when the id is absent', () => {
    const store = new TreeStore(sample())

    store.updateItem({ id: 40, parent: 1, label: 'нет' })

    expect(store.getAll()).toHaveLength(8)
    expect(store.getItem(40)).toBeUndefined()
  })

  it('removes a leaf', () => {
    const store = new TreeStore(sample())

    store.removeItem(5)

    expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 4, 6, 7, 8])
    expect(ids(store.getChildren('91064cef'))).toEqual([4, 6])
    expect(store.getItem(5)).toBeUndefined()
  })

  it('removes a subtree and leaves the remaining indexes consistent', () => {
    const store = new TreeStore(sample())

    store.removeItem(4)

    expect(ids(store.getAll())).toEqual([1, '91064cef', 3, 5, 6])
    expect(store.getItem(4)).toBeUndefined()
    expect(store.getItem(7)).toBeUndefined()
    expect(store.getItem(8)).toBeUndefined()
    expect(ids(store.getChildren('91064cef'))).toEqual([5, 6])
    expect(store.getAllChildren(4)).toEqual([])
    expect(ids(store.getAllChildren(1))).toEqual(['91064cef', 5, 6, 3])
  })

  it('removes the whole tree from the root', () => {
    const store = new TreeStore(sample())

    store.removeItem(1)

    expect(store.getAll()).toEqual([])
    expect(store.getItem('91064cef')).toBeUndefined()
  })

  it('ignores removeItem for an unknown id', () => {
    const store = new TreeStore(sample())

    store.removeItem('missing')

    expect(store.getAll()).toHaveLength(8)
  })

  it('keeps number and string ids distinct', () => {
    const store = new TreeStore<Item>([
      { id: 1, parent: null, label: 'число' },
      { id: '1', parent: null, label: 'строка' },
      { id: 'child-n', parent: 1, label: 'ребёнок числа' },
      { id: 'child-s', parent: '1', label: 'ребёнок строки' },
    ])

    expect(store.getItem(1)?.label).toBe('число')
    expect(store.getItem('1')?.label).toBe('строка')
    expect(ids(store.getChildren(1))).toEqual(['child-n'])
    expect(ids(store.getChildren('1'))).toEqual(['child-s'])
    expect(ids(store.getAllParents('child-s'))).toEqual(['child-s', '1'])
    expect(ids(store.getAllParents('child-n'))).toEqual(['child-n', 1])
  })

  it('stops parent and child walks on a cycle', () => {
    const store = new TreeStore<Item>([
      { id: 1, parent: 2, label: 'a' },
      { id: 2, parent: 1, label: 'b' },
    ])

    expect(ids(store.getAllParents(1))).toEqual([1, 2])
    expect(ids(store.getAllChildren(1))).toEqual([2])
  })
})
