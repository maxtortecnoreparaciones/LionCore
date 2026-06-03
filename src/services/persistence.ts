import { db } from './db'

const API_BASE = `http://${window.location.hostname}:3456`

export async function isElectron(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI) return true
    const res = await fetch(`${API_BASE}/api/persistence/status`, { signal: AbortSignal.timeout(1000) })
    if (res.ok) return true
  } catch {}
  return false
}

export async function getExportableCollections(localDb?: typeof db): Promise<Record<string, any[]>> {
  const collections: Record<string, any[]> = {}
  const sourceDb = localDb || db
  try {
    collections.products = await sourceDb.products.toArray()
    collections.transactions = await sourceDb.transactions.toArray()
    collections.transaction_items = await sourceDb.transaction_items.toArray()
    collections.transaction_meta = await sourceDb.transaction_meta.toArray()
    collections.inventory_adjustments = await sourceDb.inventory_adjustments.toArray()
    collections.productions = await sourceDb.productions.toArray()
    collections.customers = await sourceDb.customers.toArray()
    collections.suppliers = await sourceDb.suppliers.toArray()
    collections.categories = await sourceDb.categories.toArray()
    collections.mesas = await sourceDb.mesas.toArray()
    collections.production_processes = await sourceDb.production_processes.toArray()
    collections.production_batches = await sourceDb.production_batches.toArray()
    collections.batch_step_logs = await sourceDb.batch_step_logs.toArray()
    collections.production_resources = await sourceDb.production_resources.toArray()
    collections.batch_products = await sourceDb.batch_products.toArray()
    collections.production_batch_runs = await sourceDb.production_batch_runs.toArray()
    collections.service_orders = await sourceDb.service_orders.toArray()
    collections.warehouses = await sourceDb.warehouses.toArray()
    collections.warehouse_stock = await sourceDb.warehouse_stock.toArray()
  } catch {}
  return collections
}

export async function importCollections(collections: Record<string, any[]>, localDb?: typeof db): Promise<string[]> {
  const imported: string[] = []
  const sourceDb = localDb || db
  try {
    const tableMap: Record<string, string> = {
      products: 'products', transactions: 'transactions', transaction_items: 'transaction_items',
      transaction_meta: 'transaction_meta', inventory_adjustments: 'inventory_adjustments',
      productions: 'productions', customers: 'customers', suppliers: 'suppliers',
      categories: 'categories', mesas: 'mesas', production_processes: 'production_processes',
      production_batches: 'production_batches', batch_step_logs: 'batch_step_logs',
      production_resources: 'production_resources', batch_products: 'batch_products', production_batch_runs: 'production_batch_runs', service_orders: 'service_orders',
      warehouses: 'warehouses', warehouse_stock: 'warehouse_stock',
    }
    for (const [key, tableName] of Object.entries(tableMap)) {
      const data = collections[key]
      if (!data || !Array.isArray(data) || data.length === 0) continue
      const table = (sourceDb as any)[tableName]
      if (!table) continue
      await table.clear()
      await table.bulkAdd(data)
      imported.push(key)
    }
  } catch (e) { console.error('Error importing collections:', e) }
  return imported
}

export async function syncSave(): Promise<{ ok: boolean; saved?: string[]; error?: string }> {
  try {
    const electron = await isElectron()
    if (!electron) return { ok: false, error: 'No disponible en modo web' }
    const collections = await getExportableCollections()
    const res = await fetch(`${API_BASE}/api/persistence/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections }),
    })
    const data = await res.json()
    return data.ok ? { ok: true, saved: data.saved } : { ok: false, error: data.error }
  } catch (e: any) { return { ok: false, error: e.message } }
}

/** Versión con keepalive para beforeunload — el fetch no se cancela al cerrar */
export function syncSaveKeepalive(): void {
  getExportableCollections().then(collections => {
    try {
      fetch(`${API_BASE}/api/persistence/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }).catch(() => {})
}

export async function syncLoad(): Promise<{ ok: boolean; collections?: Record<string, any[]>; error?: string }> {
  try {
    const electron = await isElectron()
    if (!electron) return { ok: false, error: 'No disponible en modo web' }
    const res = await fetch(`${API_BASE}/api/persistence/load`)
    const data = await res.json()
    if (!data.ok) return { ok: false, error: data.error }
    await importCollections(data.collections)
    return { ok: true, collections: data.collections }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function createBackup(): Promise<{ ok: boolean; backup?: string; error?: string }> {
  try {
    const electron = await isElectron()
    if (!electron) return { ok: false, error: 'No disponible en modo web' }
    await syncSave()
    const res = await fetch(`${API_BASE}/api/persistence/backup`, { method: 'POST' })
    const data = await res.json()
    return data.ok ? { ok: true, backup: data.backup } : { ok: false, error: data.error }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function listBackups(): Promise<{ ok: boolean; backups?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/persistence/backups`)
    const data = await res.json()
    return data.ok ? { ok: true, backups: data.backups } : { ok: false, error: data.error }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function restoreBackup(backupName: string): Promise<{ ok: boolean; restored?: string[]; error?: string }> {
  try {
    const electron = await isElectron()
    if (!electron) return { ok: false, error: 'No disponible en modo web' }
    const res = await fetch(`${API_BASE}/api/persistence/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupName }),
    })
    const data = await res.json()
    if (!data.ok) return { ok: false, error: data.error }
    await syncLoad()
    return { ok: true, restored: data.restored }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function verifyIntegrity(): Promise<{ ok: boolean; valid?: string[]; errors?: string[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/persistence/verify`)
    const data = await res.json()
    return data.ok ? { ok: true, valid: data.valid, errors: data.errors } : { ok: false, error: data.error }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function fullExport(): Promise<{ ok: boolean; export?: string; tables?: string[]; error?: string }> {
  try {
    const electron = await isElectron()
    if (!electron) return { ok: false, error: 'No disponible en modo web' }
    await syncSave()
    const res = await fetch(`${API_BASE}/api/persistence/export`)
    const data = await res.json()
    return data.ok ? { ok: true, export: data.export, tables: data.tables } : { ok: false, error: data.error }
  } catch (e: any) { return { ok: false, error: e.message } }
}
