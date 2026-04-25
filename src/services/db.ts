import Dexie, { Table } from 'dexie'

// ==================== TIPOS ====================

export interface Business {
  id?: number
  name: string
  createdAt: Date
}

export interface Product {
  id?: number
  businessId: number
  name: string
  price: number
  cost?: number
  stock?: number
  createdAt: Date
}

export interface Transaction {
  id?: number
  businessId: number
  type: 'venta' | 'compra' | 'gasto' | 'produccion' | 'config'
  total: number
  date: Date
}

export interface TransactionItem {
  id?: number
  transactionId: number
  productId?: number
  name: string
  quantity: number
  price: number
  subtotal: number
  costUnitario?: number
  unit?: string
}

export interface TransactionMeta {
  id?: number
  transactionId: number
  key: string
  value: string | number
}

// ==================== BASE DE DATOS ====================

class LionCoreDB extends Dexie {
  businesses!: Table<Business, number>
  products!: Table<Product, number>
  transactions!: Table<Transaction, number>
  transaction_items!: Table<TransactionItem, number>
  transaction_meta!: Table<TransactionMeta, number>

  constructor() {
    super('LionCoreDB')

    this.version(1).stores({
      businesses: '++id, name',
      products: '++id, businessId, name',
      transactions: '++id, businessId, type, date',
      transaction_items: '++id, transactionId',
    })

    this.version(2).stores({
      transaction_meta: '++id, transactionId, key',
    }).upgrade(() => {
      return Promise.resolve()
    })
  }
}

// ==================== INSTANCIA ====================

export const db = new LionCoreDB()

// ==================== HELPERS ====================

const BUSINESS_ID_KEY = 'lioncore_current_business'

export function getCurrentBusinessId(): number {
  const stored = localStorage.getItem(BUSINESS_ID_KEY)
  if (stored) return parseInt(stored, 10)
  
  return 1 // Default: primer negocio
}

export function setCurrentBusinessId(id: number): void {
  localStorage.setItem(BUSINESS_ID_KEY, id.toString())
}

export async function getOrCreateDefaultBusiness(): Promise<Business> {
  const business = await db.businesses.get(1)
  
  if (business) return business
  
  const newBusiness: Business = {
    name: 'Mi Negocio',
    createdAt: new Date(),
  }
  
  const id = await db.businesses.add(newBusiness)
  setCurrentBusinessId(id)
  
  return { ...newBusiness, id }
}

// ==================== OPERACIONES ====================

// --- Productos ---
export async function addProduct(name: string, price: number, cost?: number): Promise<number> {
  return db.products.add({
    businessId: getCurrentBusinessId(),
    name,
    price,
    cost,
    createdAt: new Date(),
  })
}

export async function getProducts(): Promise<Product[]> {
  return db.products.where('businessId').equals(getCurrentBusinessId()).toArray()
}

export async function searchProducts(query: string): Promise<Product[]> {
  return db.products
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .toArray()
}

// --- Transacciones ---
export async function createTransaction(
  type: 'venta' | 'compra' | 'gasto' | 'produccion',
  items: Omit<TransactionItem, 'id' | 'transactionId'>[]
): Promise<number> {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  
  const transactionId = await db.transactions.add({
    businessId: getCurrentBusinessId(),
    type,
    total: subtotal,
    date: new Date(),
  })
  
  await db.transaction_items.bulkAdd(
    items.map(item => ({
      ...item,
      transactionId,
    }))
  )
  
  return transactionId
}

export async function getTransactions(
  type?: 'venta' | 'compra' | 'gasto' | 'produccion'
): Promise<Transaction[]> {
  const businessId = getCurrentBusinessId()
  
  let results: Transaction[] = await db.transactions
    .where('businessId')
    .equals(businessId)
    .toArray()
  
  if (type) {
    results = results.filter(t => t.type === type)
  }
  
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const businessId = getCurrentBusinessId()
  
  const results = await db.transactions
    .where('businessId')
    .equals(businessId)
    .toArray()
  
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
  return db.transaction_items.where('transactionId').equals(transactionId).toArray()
}

// --- Reportes ---
export async function getDailySales(date: Date = new Date()): Promise<Transaction[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  return db.transactions
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(t => t.type === 'venta' && t.date >= startOfDay && t.date <= endOfDay)
    .toArray()
}

export async function getTotalSales(startDate?: Date, endDate?: Date): Promise<number> {
  const start = startDate || new Date(new Date().setDate(1))
  const end = endDate || new Date()
  
  return db.transactions
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(t => t.type === 'venta' && t.date >= start && t.date <= end)
    .toArray()
    .then(tx => tx.reduce((sum, t) => sum + t.total, 0))
}

export interface FinancialSummary {
  entradas: number
  salidas: number
  balance: number
  transacciones: number
}

export async function getDailySummary(date: Date = new Date()): Promise<FinancialSummary> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(t => t.date >= startOfDay && t.date <= endOfDay)
    .toArray()
  
  const entradas = transactions.filter(t => t.type === 'venta').reduce((sum, t) => sum + t.total, 0)
  const salidas = transactions.filter(t => t.type === 'compra' || t.type === 'gasto').reduce((sum, t) => sum + t.total, 0)
  
  return {
    entradas,
    salidas,
    balance: entradas - salidas,
    transacciones: transactions.length,
  }
}

export async function getWeeklySummary(): Promise<FinancialSummary> {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(t => t.date >= startOfWeek && t.date <= endOfWeek)
    .toArray()
  
  const entradas = transactions.filter(t => t.type === 'venta').reduce((sum, t) => sum + t.total, 0)
  const salidas = transactions.filter(t => t.type === 'compra' || t.type === 'gasto' || t.type === 'produccion').reduce((sum, t) => sum + t.total, 0)
  
  return {
    entradas,
    salidas,
    balance: entradas - salidas,
    transacciones: transactions.length,
  }
}

export async function getMonthlySummary(): Promise<FinancialSummary> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(t => t.date >= startOfMonth && t.date <= endOfMonth)
    .toArray()
  
  const entradas = transactions.filter(t => t.type === 'venta').reduce((sum, t) => sum + t.total, 0)
  const salidas = transactions.filter(t => t.type === 'compra' || t.type === 'gasto' || t.type === 'produccion').reduce((sum, t) => sum + t.total, 0)
  
  return {
    entradas,
    salidas,
    balance: entradas - salidas,
    transacciones: transactions.length,
  }
}

export interface ProductStock {
  name: string
  quantity: number
  totalProduced: number
  totalSold: number
  lastPrice?: number
  unit?: string
}

export async function getStockByProduct(): Promise<ProductStock[]> {
  const businessId = getCurrentBusinessId()
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(businessId)
    .toArray()
  
  const productionTxs = transactions.filter(t => t.type === 'produccion')
  const saleTxs = transactions.filter(t => t.type === 'venta')
  
  const stockMap = new Map<string, { produced: number; sold: number; lastProductionPrice?: number; unit?: string }>()
  
  for (const tx of productionTxs) {
    const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
    for (const item of items) {
      const current = stockMap.get(item.name) || { produced: 0, sold: 0 }
      stockMap.set(item.name, {
        produced: current.produced + item.quantity,
        sold: current.sold,
        lastProductionPrice: item.price,
        unit: item.unit || current.unit || 'unidades'
      })
    }
  }
  
  for (const tx of saleTxs) {
    const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
    for (const item of items) {
      const current = stockMap.get(item.name) || { produced: 0, sold: 0 }
      stockMap.set(item.name, {
        produced: current.produced,
        sold: current.sold + item.quantity,
        lastProductionPrice: current.lastProductionPrice,
        unit: current.unit || 'unidades'
      })
    }
  }
  
  return Array.from(stockMap.entries()).map(([name, data]) => ({
    name,
    quantity: data.produced - data.sold,
    totalProduced: data.produced,
    totalSold: data.sold,
    lastPrice: data.lastProductionPrice,
    unit: data.unit
  }))
}

export async function getProductStock(productName: string): Promise<number> {
  const stocks = await getStockByProduct()
  const product = stocks.find(s => s.name.toLowerCase() === productName.toLowerCase())
  return product?.quantity || 0
}

export async function updateProductSuggestedPrice(productName: string, newPrice: number): Promise<void> {
  const businessId = getCurrentBusinessId()
  
  const productions = await db.transactions
    .where('businessId')
    .equals(businessId)
    .and(t => t.type === 'produccion')
    .reverse()
    .sortBy('id')
  
  for (const tx of productions) {
    const items = await db.transaction_items
      .where('transactionId')
      .equals(tx.id!)
      .and(item => item.name.toLowerCase() === productName.toLowerCase())
      .toArray()
    
    if (items.length > 0) {
      await db.transaction_items.update(items[0].id!, { price: newPrice })
      return
    }
  }
}

export async function saveTransactionMeta(transactionId: number, meta: Record<string, string | number>): Promise<void> {
  const metaRecords = Object.entries(meta).map(([key, value]) => ({
    transactionId,
    key,
    value: typeof value === 'number' ? value.toString() : value
  }))
  
  await db.transaction_meta.bulkAdd(metaRecords)
}

export async function getTransactionMeta(transactionId: number): Promise<Record<string, string>> {
  const metaRecords = await db.transaction_meta.where('transactionId').equals(transactionId).toArray()
  const meta: Record<string, string> = {}
  
  for (const record of metaRecords) {
    meta[record.key] = String(record.value)
  }
  
  return meta
}

export interface BusinessConfig {
  costoManoObra?: number
  costoEnergia?: number
  costoEmpaque?: number
  costoTransporte?: number
  porcentajeGanancia?: number
}

export async function saveBusinessConfig(config: BusinessConfig): Promise<number> {
  const businessId = getCurrentBusinessId()
  
  const transactionId = await db.transactions.add({
    businessId,
    type: 'config',
    total: 0,
    date: new Date(),
  })
  
  const meta: Record<string, string | number> = {}
  if (config.costoManoObra !== undefined) meta.costo_mano_obra = config.costoManoObra
  if (config.costoEnergia !== undefined) meta.costo_energia = config.costoEnergia
  if (config.costoEmpaque !== undefined) meta.costo_empaque = config.costoEmpaque
  if (config.costoTransporte !== undefined) meta.costo_transporte = config.costoTransporte
  if (config.porcentajeGanancia !== undefined) meta.porcentaje_ganancia = config.porcentajeGanancia
  
  await saveTransactionMeta(transactionId, meta)
  
  return transactionId
}

export async function getLatestBusinessConfig(): Promise<BusinessConfig> {
  const businessId = getCurrentBusinessId()
  
  const configTx = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter(t => t.type === 'config')
    .toArray()
  
  if (configTx.length === 0) {
    return {}
  }
  
  const latestTx = configTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  
  const meta = await getTransactionMeta(latestTx.id!)
  
  return {
    costoManoObra: meta.costo_mano_obra ? Number(meta.costo_mano_obra) : undefined,
    costoEnergia: meta.costo_energia ? Number(meta.costo_energia) : undefined,
    costoEmpaque: meta.costo_empaque ? Number(meta.costo_empaque) : undefined,
    costoTransporte: meta.costo_transporte ? Number(meta.costo_transporte) : undefined,
    porcentajeGanancia: meta.porcentaje_ganancia ? Number(meta.porcentaje_ganancia) : undefined,
  }
}

export function calculateProductionCost(
  costoMateriales: number,
  config?: BusinessConfig
): { costoTotal: number; precioVenta: number; details: Record<string, number> } {
  const costoManoObra = config?.costoManoObra || 0
  const costoEnergia = config?.costoEnergia || 0
  const costoEmpaque = config?.costoEmpaque || 0
  const costoTransporte = config?.costoTransporte || 0
  const porcentajeGanancia = config?.porcentajeGanancia || 30
  
  const costoFijo = costoManoObra + costoEnergia + costoEmpaque + costoTransporte
  const costoTotal = costoMateriales + costoFijo
  const precioVenta = costoTotal * (1 + porcentajeGanancia / 100)
  
  return {
    costoTotal,
    precioVenta: Math.round(precioVenta),
    details: {
      materiales: costoMateriales,
      manoObra: costoManoObra,
      energia: costoEnergia,
      empaque: costoEmpaque,
      transporte: costoTransporte,
      fijo: costoFijo,
      ganancia: precioVenta - costoTotal,
    }
  }
}