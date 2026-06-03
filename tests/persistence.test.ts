import { describe, it, expect } from 'vitest'

// Mock table factory
function fakeTable<T = any>(initialData: T[] = []) {
  const data: T[] = [...initialData]
  let cleared = false
  let added: T[] = []
  return {
    toArray: async () => [...data],
    clear: async () => { data.length = 0; cleared = true },
    bulkAdd: async (items: T[]) => { data.push(...items); added = items },
    _cleared: () => cleared,
    _added: () => added,
    _data: data,
  }
}

type MockDb = Record<string, ReturnType<typeof fakeTable>>

describe('Persistence - getExportableCollections', () => {
  it('includes batch_products and production_batch_runs', async () => {
    const { getExportableCollections } = await import('../src/services/persistence')
    const mockDb: MockDb = {
      products: fakeTable([{ id: 1, name: 'Test' }]),
      transactions: fakeTable(),
      transaction_items: fakeTable(),
      transaction_meta: fakeTable(),
      inventory_adjustments: fakeTable(),
      productions: fakeTable(),
      customers: fakeTable(),
      suppliers: fakeTable(),
      categories: fakeTable(),
      mesas: fakeTable(),
      production_processes: fakeTable(),
      production_batches: fakeTable(),
      batch_step_logs: fakeTable(),
      production_resources: fakeTable(),
      batch_products: fakeTable([{ batchId: 1, productId: 1, productName: 'Harina', qtyUsed: 10, unit: 'kg' }]),
      production_batch_runs: fakeTable([{ batchId: 1, nombre: 'Tanda 1', estado: 'activo' }]),
      service_orders: fakeTable(),
      warehouses: fakeTable(),
      warehouse_stock: fakeTable(),
    }

    const result = await getExportableCollections(mockDb as any)

    expect(result.batch_products).toBeDefined()
    expect(result.batch_products.length).toBe(1)
    expect(result.batch_products[0].productName).toBe('Harina')
    expect(result.production_batch_runs).toBeDefined()
    expect(result.production_batch_runs.length).toBe(1)
    expect(result.production_batch_runs[0].nombre).toBe('Tanda 1')
  })

  it('exports exactly 19 tables', async () => {
    const { getExportableCollections } = await import('../src/services/persistence')
    const mockDb: MockDb = {}
    const expected = [
      'products', 'transactions', 'transaction_items', 'transaction_meta',
      'inventory_adjustments', 'productions', 'customers', 'suppliers',
      'categories', 'mesas', 'production_processes', 'production_batches',
      'batch_step_logs', 'production_resources', 'batch_products',
      'production_batch_runs', 'service_orders', 'warehouses', 'warehouse_stock',
    ]
    for (const t of expected) {
      mockDb[t] = fakeTable()
    }

    const result = await getExportableCollections(mockDb as any)

    expected.forEach(t => {
      expect(result[t]).toBeDefined(`Table "${t}" should be present in export`)
    })
    expect(Object.keys(result).length).toBe(19)
  })

  it('returns empty arrays for tables with no data', async () => {
    const { getExportableCollections } = await import('../src/services/persistence')
    const mockDb: MockDb = {}
    const tables = [
      'products', 'transactions', 'transaction_items', 'transaction_meta',
      'inventory_adjustments', 'productions', 'customers', 'suppliers',
      'categories', 'mesas', 'production_processes', 'production_batches',
      'batch_step_logs', 'production_resources', 'batch_products',
      'production_batch_runs', 'service_orders', 'warehouses', 'warehouse_stock',
    ]
    for (const t of tables) mockDb[t] = fakeTable()

    const result = await getExportableCollections(mockDb as any)
    Object.values(result).forEach(arr => {
      expect(Array.isArray(arr)).toBe(true)
    })
  })
})

describe('Persistence - importCollections', () => {
  it('imports batch_products and production_batch_runs', async () => {
    const { importCollections } = await import('../src/services/persistence')
    const bpTable = fakeTable()
    const runTable = fakeTable()

    const mockDb: MockDb = {
      products: fakeTable(),
      transactions: fakeTable(),
      transaction_items: fakeTable(),
      transaction_meta: fakeTable(),
      inventory_adjustments: fakeTable(),
      productions: fakeTable(),
      customers: fakeTable(),
      suppliers: fakeTable(),
      categories: fakeTable(),
      mesas: fakeTable(),
      production_processes: fakeTable(),
      production_batches: fakeTable(),
      batch_step_logs: fakeTable(),
      production_resources: fakeTable(),
      batch_products: bpTable,
      production_batch_runs: runTable,
      service_orders: fakeTable(),
      warehouses: fakeTable(),
      warehouse_stock: fakeTable(),
    }

    const backup = {
      batch_products: [
        { batchId: 10, productId: 5, productName: 'Azucar', qtyUsed: 3, unit: 'kg' },
      ],
      production_batch_runs: [
        { batchId: 10, nombre: 'Tanda 1', cantidadEntrada: 100, estado: 'activo' },
      ],
    }

    const imported = await importCollections(backup, mockDb as any)
    expect(imported).toContain('batch_products')
    expect(imported).toContain('production_batch_runs')
    expect(bpTable._cleared()).toBe(true)
    expect(runTable._cleared()).toBe(true)
  })

  it('skips empty collections (does not clear)', async () => {
    const { importCollections } = await import('../src/services/persistence')
    const bpTable = fakeTable([{ batchId: 1, productName: 'Old' }])
    const runTable = fakeTable()

    const mockDb: MockDb = {
      products: fakeTable(),
      transactions: fakeTable(),
      transaction_items: fakeTable(),
      transaction_meta: fakeTable(),
      inventory_adjustments: fakeTable(),
      productions: fakeTable(),
      customers: fakeTable(),
      suppliers: fakeTable(),
      categories: fakeTable(),
      mesas: fakeTable(),
      production_processes: fakeTable(),
      production_batches: fakeTable(),
      batch_step_logs: fakeTable(),
      production_resources: fakeTable(),
      batch_products: bpTable,
      production_batch_runs: runTable,
      service_orders: fakeTable(),
      warehouses: fakeTable(),
      warehouse_stock: fakeTable(),
    }

    const backup = {
      batch_products: [],
      production_batch_runs: [{ batchId: 2, nombre: 'New' }],
    }

    const imported = await importCollections(backup, mockDb as any)
    expect(imported).not.toContain('batch_products')
    expect(imported).toContain('production_batch_runs')
    expect(bpTable._cleared()).toBe(false)
    expect(runTable._cleared()).toBe(true)
  })
})
