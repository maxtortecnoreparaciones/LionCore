import express from 'express'
import cors from 'cors'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { createReadStream, existsSync, createWriteStream } from 'fs'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import QRCode from 'qrcode'
import { app as electronApp } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3456

app.use(cors())
app.use(express.json({ limit: '100mb' }))

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// ==========================
// PERSISTENCIA EN userData  (#242)
// ==========================
let DATA_ROOT = ''
try {
  DATA_ROOT = path.join(electronApp.getPath('userData'), 'LionCoreData')
} catch {
  DATA_ROOT = path.join(__dirname, '..', '.lioncore_data')
}

const DIRS = {
  database: path.join(DATA_ROOT, 'database'),
  config: path.join(DATA_ROOT, 'config'),
  licenses: path.join(DATA_ROOT, 'licenses'),
  backups: path.join(DATA_ROOT, 'backups'),
  exports: path.join(DATA_ROOT, 'exports'),
}

// Detectar carpeta de Google Drive local
const DRIVE_CANDIDATES = [
  path.join(os.homedir(), 'Google Drive'),
  path.join(os.homedir(), 'My Drive'),
  path.join(os.homedir(), 'GoogleDrive'),
  path.join('G:', 'My Drive'),
  path.join('G:', 'Google Drive'),
]
let DRIVE_ROOT = ''
for (const c of DRIVE_CANDIDATES) {
  try { if (existsSync(c)) { DRIVE_ROOT = c; break } } catch {}
}
const DRIVE_BACKUP_DIR = DRIVE_ROOT ? path.join(DRIVE_ROOT, 'LionCoreBackups') : ''

async function ensureDirs() {
  for (const d of Object.values(DIRS)) {
    await fs.mkdir(d, { recursive: true })
  }
}

function safeName(name) {
  return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.json'
}

async function saveJSON(subdir, name, data) {
  await ensureDirs()
  const filePath = path.join(DIRS[subdir] || DIRS.database, safeName(name))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return filePath
}

async function loadJSON(subdir, name) {
  const filePath = path.join(DIRS[subdir] || DIRS.database, safeName(name))
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function listJSON(subdir) {
  const dir = DIRS[subdir] || DIRS.database
  try {
    const files = await fs.readdir(dir)
    return files.filter(f => f.endsWith('.json')).map(f => ({
      name: f.replace('.json', ''),
      path: path.join(dir, f),
      size: 0,
      modified: '',
    }))
  } catch { return [] }
}

// Guardar datos completos (POST)
app.post('/api/persistence/save', async (req, res) => {
  try {
    const { collections } = req.body
    if (!collections || typeof collections !== 'object') {
      return res.status(400).json({ error: 'Se requiere collections' })
    }
    await ensureDirs()
    const saved = []
    for (const [name, data] of Object.entries(collections)) {
      const filePath = await saveJSON('database', name, data)
      saved.push(name)
    }
    res.json({ ok: true, saved, root: DATA_ROOT })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Cargar datos completos (GET)
app.get('/api/persistence/load', async (req, res) => {
  try {
    const files = await listJSON('database')
    const collections = {}
    for (const f of files) {
      const data = await loadJSON('database', f.name)
      if (data !== null) collections[f.name] = data
    }
    res.json({ ok: true, collections, root: DATA_ROOT })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Estado de la persistencia
app.get('/api/persistence/status', (req, res) => {
  res.json({
    available: true,
    root: DATA_ROOT,
    exists: existsSync(DATA_ROOT),
  })
})

// Crear backup
app.post('/api/persistence/backup', async (req, res) => {
  try {
    await ensureDirs()
    const date = new Date().toISOString().split('T')[0]
    const ts = Date.now()
    const backupDir = DIRS.backups
    const backupName = `backup-${date}-${ts}`
    const backupPath = path.join(backupDir, `${backupName}.json`)

    const allFiles = await listJSON('database')
    const backup = {}
    for (const f of allFiles) {
      const data = await loadJSON('database', f.name)
      backup[f.name] = data
    }
    backup._metadata = { createdAt: new Date().toISOString(), version: '2.0.0' }

    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8')

    // Retener ultimos 30 backups
    const backups = (await fs.readdir(backupDir)).filter(f => f.startsWith('backup-')).sort()
    while (backups.length > 30) {
      const old = backups.shift()
      await fs.unlink(path.join(backupDir, old)).catch(() => {})
    }

    // Copiar a Google Drive si está disponible
    let driveCopied = false
    if (DRIVE_BACKUP_DIR) {
      try {
        await fs.mkdir(DRIVE_BACKUP_DIR, { recursive: true })
        await fs.copyFile(backupPath, path.join(DRIVE_BACKUP_DIR, `${backupName}.json`))
        driveCopied = true
      } catch {}
    }

    res.json({ ok: true, backup: backupName, path: backupPath, driveCopied })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Listar backups
app.get('/api/persistence/backups', async (req, res) => {
  try {
    const dir = DIRS.backups
    await fs.mkdir(dir, { recursive: true }).catch(() => {})
    const files = await fs.readdir(dir)
    const backups = []
    for (const f of files.filter(f => f.startsWith('backup-')).sort().reverse()) {
      const stat = await fs.stat(path.join(dir, f)).catch(() => null)
      backups.push({ name: f.replace('.json', ''), file: f, size: stat?.size || 0, modified: stat?.mtime?.toISOString() || '' })
    }
    res.json({ ok: true, backups })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Restaurar backup
app.post('/api/persistence/restore', async (req, res) => {
  try {
    const { backupName } = req.body
    if (!backupName) return res.status(400).json({ error: 'backupName requerido' })
    const backupPath = path.join(DIRS.backups, backupName.replace(/\.json$/, '') + '.json')
    const raw = await fs.readFile(backupPath, 'utf-8')
    const backup = JSON.parse(raw)
    const { _metadata, ...collections } = backup
    await ensureDirs()
    for (const [name, data] of Object.entries(collections)) {
      await saveJSON('database', name, data)
    }
    res.json({ ok: true, restored: Object.keys(collections), metadata: _metadata })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Verificar integridad
app.get('/api/persistence/verify', async (req, res) => {
  try {
    const files = await listJSON('database')
    const errors = []
    const valid = []
    for (const f of files) {
      try {
        const raw = await fs.readFile(f.path, 'utf-8')
        JSON.parse(raw)
        valid.push(f.name)
      } catch {
        errors.push(f.name)
      }
    }
    res.json({ ok: true, valid, errors, total: files.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Exportacion completa
app.get('/api/persistence/export', async (req, res) => {
  try {
    const allFiles = await listJSON('database')
    const exportDir = DIRS.exports
    await fs.mkdir(exportDir, { recursive: true }).catch(() => {})
    const ts = Date.now()
    const exportPath = path.join(exportDir, `export-${ts}.json`)
    const exportData = {}
    for (const f of allFiles) {
      const data = await loadJSON('database', f.name)
      exportData[f.name] = data
    }
    exportData._exportedAt = new Date().toISOString()
    exportData._version = '2.0.0'
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')
    res.json({ ok: true, export: `export-${ts}`, path: exportPath, tables: Object.keys(exportData).filter(k => !k.startsWith('_')) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

let db = { mesas: [], pedidos: [], productos: [] }

export function setSharedData(data) {
  db = { ...db, ...data }
}

export function getSharedData() {
  return db
}

app.get('/api/mesas', (req, res) => {
  res.json(db.mesas)
})

app.get('/api/ip', (req, res) => {
  res.json({ ip: getLocalIP() })
})

app.post('/api/mesas/:id/pedidos', (req, res) => {
  const { id } = req.params
  const pedido = req.body
  const newPedido = { ...pedido, mesaId: Number(id), id: Date.now(), estado: 'nuevo', createdAt: new Date().toISOString() }
  db.pedidos.push(newPedido)
  broadcast({ type: 'pedido_nuevo', data: newPedido })
  res.json(newPedido)
})

app.get('/api/pedidos', (req, res) => {
  res.json(db.pedidos)
})

app.post('/api/pedidos/:id/estado', (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  const pedido = db.pedidos.find(p => p.id === Number(id))
  if (pedido) {
    pedido.estado = estado
    broadcast({ type: 'pedido_actualizado', data: pedido })
    res.json(pedido)
  } else {
    res.status(404).json({ error: 'Pedido no encontrado' })
  }
})

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

function broadcast(data) {
  if (wss) {
    const msg = JSON.stringify(data)
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
  }
}

let server = null
let wss = null

export function startServer(data) {
  if (data) setSharedData(data)
  return new Promise((resolve) => {
    server = createServer(app)
    wss = new WebSocketServer({ server })
    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'sync', data: db }))
    })
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`LionCore server running on http://0.0.0.0:${PORT}`)
      resolve(server)
    })
  })
}

export function stopServer() {
  if (wss) { wss.close(); wss = null }
  if (server) { server.close(); server = null }
}

export function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}
