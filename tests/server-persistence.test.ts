import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { existsSync } from 'fs'

// Helper to create a minimal test server
async function createTestServer() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '100mb' }))

  const tmpDir = path.join(os.tmpdir(), 'lioncore-test-' + Date.now())
  const DIRS = {
    database: path.join(tmpDir, 'database'),
    config: path.join(tmpDir, 'config'),
    licenses: path.join(tmpDir, 'licenses'),
    backups: path.join(tmpDir, 'backups'),
    exports: path.join(tmpDir, 'exports'),
  }

  const ensureDirs = async () => {
    for (const d of Object.values(DIRS)) {
      await fs.mkdir(d, { recursive: true })
    }
  }

  const safeName = (name: string) => name.replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.json'

  const saveJSON = async (subdir: string, name: string, data: any) => {
    await ensureDirs()
    const filePath = path.join((DIRS as any)[subdir] || DIRS.database, safeName(name))
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return filePath
  }

  const loadJSON = async (subdir: string, name: string) => {
    const filePath = path.join((DIRS as any)[subdir] || DIRS.database, safeName(name))
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(raw)
    } catch { return null }
  }

  const listJSON = async (subdir: string) => {
    const dir = (DIRS as any)[subdir] || DIRS.database
    try {
      const files = await fs.readdir(dir)
      return files.filter(f => f.endsWith('.json')).map(f => ({
        name: f.replace('.json', ''),
        path: path.join(dir, f),
      }))
    } catch { return [] }
  }

  // Save endpoint
  app.post('/api/persistence/save', async (req, res) => {
    try {
      const { collections } = req.body
      if (!collections || typeof collections !== 'object') {
        return res.status(400).json({ error: 'Se requiere collections' })
      }
      await ensureDirs()
      const saved: string[] = []
      for (const [name, data] of Object.entries(collections)) {
        await saveJSON('database', name, data)
        saved.push(name)
      }
      res.json({ ok: true, saved, root: tmpDir })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Load endpoint
  app.get('/api/persistence/load', async (req, res) => {
    try {
      const files = await listJSON('database')
      const collections: Record<string, any> = {}
      for (const f of files) {
        const data = await loadJSON('database', f.name)
        if (data !== null) collections[f.name] = data
      }
      res.json({ ok: true, collections, root: tmpDir })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Status endpoint
  app.get('/api/persistence/status', (req, res) => {
    res.json({ available: true, root: tmpDir, exists: existsSync(tmpDir) })
  })

  // Backup endpoint
  app.post('/api/persistence/backup', async (req, res) => {
    try {
      await ensureDirs()
      const date = new Date().toISOString().split('T')[0]
      const ts = Date.now()
      const backupDir = DIRS.backups
      const backupName = `backup-${date}-${ts}`
      const backupPath = path.join(backupDir, `${backupName}.json`)

      const allFiles = await listJSON('database')
      const backup: Record<string, any> = {}
      for (const f of allFiles) {
        const data = await loadJSON('database', f.name)
        backup[f.name] = data
      }
      backup._metadata = { createdAt: new Date().toISOString(), version: '2.0.0' }

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8')
      res.json({ ok: true, backup: backupName, path: backupPath })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // List backups
  app.get('/api/persistence/backups', async (req, res) => {
    const dir = DIRS.backups
    await fs.mkdir(dir, { recursive: true }).catch(() => {})
    const files = await fs.readdir(dir)
    const backups: any[] = []
    for (const f of files.filter(f => f.startsWith('backup-')).sort().reverse()) {
      const stat = await fs.stat(path.join(dir, f)).catch(() => null)
      backups.push({ name: f.replace('.json', ''), file: f, size: stat?.size || 0, modified: stat?.mtime?.toISOString() || '' })
    }
    res.json({ ok: true, backups })
  })

  // Restore backup
  app.post('/api/persistence/restore', async (req, res) => {
    try {
      const { backupName } = req.body
      if (!backupName) return res.status(400).json({ error: 'backupName requerido' })
      const backupPath = path.join(DIRS.backups, backupName.replace(/\.json$/, '') + '.json')
      const raw = await fs.readFile(backupPath, 'utf-8')
      const backup = JSON.parse(raw)
      const { _metadata, ...collections } = backup
      for (const [name, data] of Object.entries(collections)) {
        await saveJSON('database', name, data)
      }
      res.json({ ok: true, restored: Object.keys(collections), metadata: _metadata })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Verify integrity
  app.get('/api/persistence/verify', async (req, res) => {
    const files = await listJSON('database')
    const errors: string[] = []
    const valid: string[] = []
    for (const f of files) {
      try {
        const raw = await fs.readFile(f.path, 'utf-8')
        JSON.parse(raw)
        valid.push(f.name)
      } catch { errors.push(f.name) }
    }
    res.json({ ok: true, valid, errors, total: files.length })
  })

  return { app, tmpDir, DIRS, cleanup: async () => { await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}) } }
}

describe('Persistence Server API', () => {
  let server: any
  let tmpDir: string
  let DIRS: any
  let cleanup: () => Promise<void>
  let baseUrl: string

  const testCollections = {
    products: [
      { id: 1, name: 'Papa', businessId: 1, price: 2000, unit: 'kg' },
      { id: 2, name: 'Yuca', businessId: 1, price: 1500, unit: 'kg' },
    ],
    batch_products: [
      { batchId: 1, productId: 1, productName: 'Harina', qtyUsed: 10, unit: 'kg' },
    ],
    production_batch_runs: [
      { batchId: 1, nombre: 'Tanda 1', cantidadEntrada: 50, estado: 'activo' },
      { batchId: 1, nombre: 'Tanda 2', cantidadEntrada: 30, estado: 'pendiente' },
    ],
  }

  beforeAll(async () => {
    const testEnv = await createTestServer()
    server = testEnv.app
    tmpDir = testEnv.tmpDir
    DIRS = testEnv.DIRS
    cleanup = testEnv.cleanup

    // Start server on random port
    const { createServer } = await import('http')
    const httpServer = createServer(server)
    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address()
        baseUrl = `http://127.0.0.1:${(addr as any).port}`
        resolve()
      })
    })
    ;(globalThis as any).__TEST_SERVER__ = httpServer
  })

  afterAll(async () => {
    const httpServer = (globalThis as any).__TEST_SERVER__
    if (httpServer) await new Promise((r) => httpServer.close(r))
    await cleanup()
  })

  it('POST /api/persistence/save guarda todas las colecciones', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: testCollections }),
    })
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.saved).toContain('products')
    expect(data.saved).toContain('batch_products')
    expect(data.saved).toContain('production_batch_runs')

    // Verify files exist on disk
    const dbDir = await fs.readdir(DIRS.database)
    expect(dbDir).toContain('products.json')
    expect(dbDir).toContain('batch_products.json')
    expect(dbDir).toContain('production_batch_runs.json')
  })

  it('GET /api/persistence/load recupera todas las colecciones', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/load`)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.collections).toBeDefined()
    expect(data.collections.products).toBeDefined()
    expect(data.collections.products.length).toBe(2)
    expect(data.collections.batch_products).toBeDefined()
    expect(data.collections.batch_products[0].productName).toBe('Harina')
    expect(data.collections.production_batch_runs).toBeDefined()
    expect(data.collections.production_batch_runs.length).toBe(2)
  })

  it('POST /api/persistence/backup crea backup completo', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/backup`, { method: 'POST' })
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.backup).toMatch(/^backup-/)
    expect(data.path).toContain('backups')

    // Verify backup file exists with all collections
    const backupsDir = await fs.readdir(DIRS.backups)
    expect(backupsDir.length).toBeGreaterThan(0)

    const backupFile = backupsDir[0]
    const raw = await fs.readFile(path.join(DIRS.backups, backupFile), 'utf-8')
    const backup = JSON.parse(raw)
    expect(backup._metadata).toBeDefined()
    expect(backup.products).toBeDefined()
    expect(backup.batch_products).toBeDefined()
    expect(backup.production_batch_runs).toBeDefined()
  })

  it('GET /api/persistence/backups lista backups', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/backups`)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(Array.isArray(data.backups)).toBe(true)
    expect(data.backups.length).toBeGreaterThan(0)
    expect(data.backups[0].name).toMatch(/^backup-/)
  })

  it('POST /api/persistence/restore recupera desde backup', async () => {
    // Save initial data
    await fetch(`${baseUrl}/api/persistence/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: testCollections }),
    })

    // Create backup
    const backupRes = await fetch(`${baseUrl}/api/persistence/backup`, { method: 'POST' })
    const backupData = await backupRes.json()

    // Modify products.json
    await fs.writeFile(
      path.join(DIRS.database, 'products.json'),
      JSON.stringify([{ id: 99, name: 'Corrupted', businessId: 1, price: 0, unit: 'unidad' }], null, 2),
      'utf-8',
    )

    // Restore backup
    const restoreRes = await fetch(`${baseUrl}/api/persistence/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupName: backupData.backup }),
    })
    const restoreData = await restoreRes.json()
    expect(restoreData.ok).toBe(true)
    expect(restoreData.restored).toContain('products')

    // Verify products restored correctly
    const productsRaw = await fs.readFile(path.join(DIRS.database, 'products.json'), 'utf-8')
    const products = JSON.parse(productsRaw)
    expect(products.length).toBe(2)
    expect(products[0].name).toBe('Papa')
    expect(products[1].name).toBe('Yuca')
  })

  it('GET /api/persistence/verify valida integridad JSON', async () => {
    // Save valid data
    await fetch(`${baseUrl}/api/persistence/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: testCollections }),
    })

    const res = await fetch(`${baseUrl}/api/persistence/verify`)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.valid.length).toBeGreaterThan(0)
    expect(data.errors.length).toBe(0)
  })

  it('GET /api/persistence/status reporta disponible', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/status`)
    const data = await res.json()
    expect(data.available).toBe(true)
    expect(data.root).toBe(tmpDir)
    expect(data.exists).toBe(true)
  })

  it('POST /api/persistence/save devuelve error 400 sin collections', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/persistence/restore devuelve error 400 sin backupName', async () => {
    const res = await fetch(`${baseUrl}/api/persistence/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})
