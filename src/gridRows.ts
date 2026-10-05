import type { TreeId, TreeItem } from './TreeStore'

export interface GridRow<T extends TreeItem> {
  source: T
  gridId: string
  gridParent: string | null
}

export function gridRowKey(id: TreeId): string {
  return typeof id === 'number' ? `n:${id}` : `s:${id}`
}

export function toGridRows<T extends TreeItem>(items: readonly T[]): GridRow<T>[] {
  return items.map((item) => ({
    source: item,
    gridId: gridRowKey(item.id),
    gridParent: item.parent === null ? null : gridRowKey(item.parent),
  }))
}
