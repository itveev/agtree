<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3'
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  type ColDef,
  type GetRowIdParams,
  type ICellRendererComp,
  type ICellRendererParams,
  type ValueGetterParams,
} from 'ag-grid-community'
import { TreeDataModule } from 'ag-grid-enterprise'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import type { GridRow } from './gridRows'
import { useTreeTable, type Item } from './useTreeTable'

ModuleRegistry.registerModules([ClientSideRowModelModule, TreeDataModule])

const { store, loading, rowData } = useTreeTable()

type Row = GridRow<Item>

const defaultColDef: ColDef<Row> = {
  sortable: false,
  filter: false,
  resizable: true,
  suppressHeaderMenuButton: true,
}

class RowNumberRenderer implements ICellRendererComp<Row> {
  private readonly gui = document.createElement('span')
  private params: ICellRendererParams<Row> | null = null
  private readonly onIndexChanged = (): void => {
    this.paint()
  }

  init(params: ICellRendererParams<Row>): void {
    this.params = params
    params.node.addEventListener('rowIndexChanged', this.onIndexChanged)
    this.paint()
  }

  getGui(): HTMLElement {
    return this.gui
  }

  refresh(params: ICellRendererParams<Row>): boolean {
    this.params = params
    this.paint()
    return true
  }

  destroy(): void {
    this.params?.node.removeEventListener('rowIndexChanged', this.onIndexChanged)
  }

  private paint(): void {
    const index = this.params?.node.rowIndex
    this.gui.textContent = index == null ? '' : String(index + 1)
  }
}

const columnDefs: ColDef<Row>[] = [
  {
    colId: 'rowNumber',
    headerName: '№ п/п',
    width: 110,
    maxWidth: 130,
    cellRenderer: RowNumberRenderer,
  },
  {
    colId: 'category',
    headerName: 'Категория',
    width: 220,
    showRowGroup: true,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: { suppressCount: true },
    valueGetter: (params: ValueGetterParams<Row>) => {
      const id = params.data?.source.id
      if (id === undefined) {
        return ''
      }
      return store.getChildren(id).length > 0 ? 'Группа' : 'Элемент'
    },
  },
  {
    colId: 'label',
    headerName: 'Наименование',
    flex: 1,
    minWidth: 220,
    valueGetter: (params: ValueGetterParams<Row>) => params.data?.source.label ?? '',
  },
]

function getRowId(params: GetRowIdParams<Row>): string {
  return params.data.gridId
}
</script>

<template>
  <main class="page">
    <section class="card" :class="{ 'card--loading': loading }">
      <ag-grid-vue
        class="table ag-theme-alpine"
        theme="legacy"
        :column-defs="columnDefs"
        :default-col-def="defaultColDef"
        :row-data="rowData"
        :loading="loading"
        :tree-data="true"
        tree-data-display-type="custom"
        tree-data-parent-id-field="gridParent"
        :get-row-id="getRowId"
        :group-default-expanded="-1"
        :animate-rows="false"
        dom-layout="autoHeight"
      />
    </section>
  </main>
</template>
