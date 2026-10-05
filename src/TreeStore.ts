export type TreeId = string | number

export interface TreeItem {
  id: TreeId
  parent: TreeId | null
}

export class TreeStore<T extends TreeItem> {
  private items: T[] = []
  private indexById = new Map<TreeId, number>()
  private childrenByParent = new Map<TreeId | null, T[]>()
  private childIndexById = new Map<TreeId, number>()

  constructor(items: readonly T[]) {
    this.setItems(items)
  }

  getAll(): T[] {
    return this.items
  }

  getItem(id: TreeId): T | undefined {
    const index = this.indexById.get(id)
    return index === undefined ? undefined : this.items[index]
  }

  getChildren(id: TreeId): T[] {
    return this.childrenByParent.get(id) ?? []
  }

  getAllChildren(id: TreeId): T[] {
    const first = this.childrenByParent.get(id)
    if (first === undefined || first.length === 0) {
      return []
    }

    const result: T[] = []
    const stack: T[] = []
    for (let i = first.length - 1; i >= 0; i -= 1) {
      const child = first[i]
      if (child !== undefined) {
        stack.push(child)
      }
    }

    const seen = new Set<TreeId>([id])
    while (stack.length > 0) {
      const node = stack.pop()
      if (node === undefined || seen.has(node.id)) {
        continue
      }
      seen.add(node.id)
      result.push(node)

      const kids = this.childrenByParent.get(node.id)
      if (kids !== undefined) {
        for (let i = kids.length - 1; i >= 0; i -= 1) {
          const child = kids[i]
          if (child !== undefined) {
            stack.push(child)
          }
        }
      }
    }

    return result
  }

  getAllParents(id: TreeId): T[] {
    const result: T[] = []
    const seen = new Set<TreeId>()
    let current = this.getItem(id)

    while (current !== undefined && !seen.has(current.id)) {
      seen.add(current.id)
      result.push(current)
      if (current.parent === null) {
        break
      }
      current = this.getItem(current.parent)
    }

    return result
  }

  setItems(items: readonly T[]): void {
    this.rebuild(items.slice())
  }

  addItem(item: T): void {
    this.indexById.set(item.id, this.items.length)
    this.items.push(item)
    this.attachChild(item)
  }

  removeItem(id: TreeId): void {
    if (!this.indexById.has(id)) {
      return
    }

    const removeIds = new Set<TreeId>([id])
    for (const node of this.getAllChildren(id)) {
      removeIds.add(node.id)
    }

    const next: T[] = []
    for (const item of this.items) {
      if (!removeIds.has(item.id)) {
        next.push(item)
      }
    }
    this.rebuild(next)
  }

  updateItem(next: T): void {
    const index = this.indexById.get(next.id)
    if (index === undefined) {
      return
    }

    const previous = this.items[index]
    if (previous === undefined) {
      return
    }
    const previousParent = previous.parent
    this.items[index] = next

    if (Object.is(previousParent, next.parent)) {
      const siblings = this.childrenByParent.get(previousParent)
      const childIndex = this.childIndexById.get(next.id)
      if (siblings !== undefined && childIndex !== undefined) {
        siblings[childIndex] = next
      }
      return
    }

    this.detachChild(next.id, previousParent)
    this.attachChild(next)
  }

  private rebuild(items: T[]): void {
    this.items = items
    this.indexById = new Map()
    this.childrenByParent = new Map()
    this.childIndexById = new Map()

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      if (item === undefined) {
        continue
      }
      this.indexById.set(item.id, i)
      this.attachChild(item)
    }
  }

  private attachChild(item: T): void {
    let siblings = this.childrenByParent.get(item.parent)
    if (siblings === undefined) {
      siblings = []
      this.childrenByParent.set(item.parent, siblings)
    }
    this.childIndexById.set(item.id, siblings.length)
    siblings.push(item)
  }

  private detachChild(id: TreeId, parent: TreeId | null): void {
    const siblings = this.childrenByParent.get(parent)
    const childIndex = this.childIndexById.get(id)
    if (siblings === undefined || childIndex === undefined) {
      return
    }

    siblings.splice(childIndex, 1)
    this.childIndexById.delete(id)
    for (let i = childIndex; i < siblings.length; i += 1) {
      const sibling = siblings[i]
      if (sibling !== undefined) {
        this.childIndexById.set(sibling.id, i)
      }
    }
    if (siblings.length === 0) {
      this.childrenByParent.delete(parent)
    }
  }
}
