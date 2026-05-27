import express from 'express'
import cors from 'cors'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import QRCode from 'qrcode'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3456

app.use(cors())
app.use(express.json())

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

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
