import { onMounted, ref, shallowRef } from 'vue'
import { toGridRows, type GridRow } from './gridRows'
import { loadItems } from './loadItems'
import { TreeStore, type TreeItem } from './TreeStore'

export interface Item extends TreeItem {
  label: string
}

export function useTreeTable() {
  const store = new TreeStore<Item>([])
  const loading = ref(true)
  const rowData = shallowRef<GridRow<Item>[]>([])

  onMounted(async () => {
    const items = await loadItems<Item>('/items.json')
    store.setItems(items)
    rowData.value = toGridRows(store.getAll())
    loading.value = false
  })

  return { store, loading, rowData }
}
