import { expect, it } from 'vitest'
import { TreeStore, type TreeId, type TreeItem } from './TreeStore'

interface BenchItem extends TreeItem {
  label: string
}

const SMALL = 8_000
const FACTOR = 4
const LARGE = SMALL * FACTOR
const QUADRATIC_LIMIT = FACTOR * FACTOR * 0.75

function idAt(index: number): TreeId {
  return index % 2 === 0 ? index : `id-${index}`
}

function heap(count: number): BenchItem[] {
  const items: BenchItem[] = []
  for (let index = 0; index < count; index += 1) {
    const parent = index === 0 ? null : idAt((index - 1) >> 1)
    items.push({ id: idAt(index), parent, label: String(index) })
  }
  return items
}

function chain(count: number): BenchItem[] {
  const items: BenchItem[] = []
  for (let index = 0; index < count; index += 1) {
    const parent = index === 0 ? null : idAt(index - 1)
    items.push({ id: idAt(index), parent, label: String(index) })
  }
  return items
}

function median(run: () => void, samples = 5): number {
  run()
  const times: number[] = []
  for (let index = 0; index < samples; index += 1) {
    const started = performance.now()
    run()
    times.push(performance.now() - started)
  }
  times.sort((left, right) => left - right)
  return times[Math.floor(times.length / 2)] ?? 0
}

function expectSubQuadratic(name: string, smallMs: number, largeMs: number): void {
  const ratio = largeMs / Math.max(smallMs, 0.001)
  console.log(
    `${name}: n=${SMALL} ${smallMs.toFixed(2)} ms, n=${LARGE} ${largeMs.toFixed(2)} ms, ratio=${ratio.toFixed(2)}, limit=${QUADRATIC_LIMIT}`,
  )
  if (smallMs < 2 && largeMs < 2) {
    console.log('  ratio check skipped: both runs are below timer resolution')
    return
  }
  expect(ratio, name).toBeLessThan(QUADRATIC_LIMIT)
}

it('scales setItems, traversal, lookup and removal below quadratic growth', () => {
  const smallHeap = heap(SMALL)
  const largeHeap = heap(LARGE)
  const smallChain = chain(SMALL)
  const largeChain = chain(LARGE)

  expectSubQuadratic(
    'setItems',
    median(() => {
      new TreeStore(smallHeap)
    }),
    median(() => {
      new TreeStore(largeHeap)
    }),
  )

  const smallStore = new TreeStore(smallHeap)
  const largeStore = new TreeStore(largeHeap)
  expect(smallStore.getAll()).toHaveLength(SMALL)
  expect(largeStore.getAll()).toHaveLength(LARGE)
  expect(smallStore.getItem(idAt(1))?.id).toBe('id-1')
  expect(largeStore.getItem(0)?.id).toBe(0)

  expectSubQuadratic(
    'getAll',
    median(() => {
      smallStore.getAll()
    }),
    median(() => {
      largeStore.getAll()
    }),
  )

  expectSubQuadratic(
    'getItem x20000',
    median(() => {
      for (let index = 0; index < 20_000; index += 1) {
        smallStore.getItem(idAt(index % SMALL))
      }
    }),
    median(() => {
      for (let index = 0; index < 20_000; index += 1) {
        largeStore.getItem(idAt(index % LARGE))
      }
    }),
  )

  expectSubQuadratic(
    'getAllChildren(root)',
    median(() => {
      smallStore.getAllChildren(idAt(0))
    }),
    median(() => {
      largeStore.getAllChildren(idAt(0))
    }),
  )

  expect(smallStore.getAllChildren(idAt(0))).toHaveLength(SMALL - 1)

  const smallChainStore = new TreeStore(smallChain)
  const largeChainStore = new TreeStore(largeChain)
  expect(smallChainStore.getAllParents(idAt(SMALL - 1))).toHaveLength(SMALL)
  expect(largeChainStore.getAllParents(idAt(LARGE - 1))).toHaveLength(LARGE)

  expectSubQuadratic(
    'getAllParents(leaf of a chain)',
    median(() => {
      smallChainStore.getAllParents(idAt(SMALL - 1))
    }),
    median(() => {
      largeChainStore.getAllParents(idAt(LARGE - 1))
    }),
  )

  expectSubQuadratic(
    'updateItem same parent x2000',
    median(() => {
      for (let index = 0; index < 2_000; index += 1) {
        const id = idAt(index % SMALL)
        const current = smallStore.getItem(id)
        if (current !== undefined) {
          smallStore.updateItem({ ...current, label: `u${index}` })
        }
      }
    }),
    median(() => {
      for (let index = 0; index < 2_000; index += 1) {
        const id = idAt(index % LARGE)
        const current = largeStore.getItem(id)
        if (current !== undefined) {
          largeStore.updateItem({ ...current, label: `u${index}` })
        }
      }
    }),
  )

  expectSubQuadratic(
    'removeItem(root)',
    median(() => {
      const store = new TreeStore(smallHeap)
      store.removeItem(idAt(0))
    }),
    median(() => {
      const store = new TreeStore(largeHeap)
      store.removeItem(idAt(0))
    }),
  )
})
