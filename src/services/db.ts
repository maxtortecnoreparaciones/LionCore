import Dexie, { Table } from 'dexie'

// ==================== TIPOS ====================

export type BusinessType = 'pos' | 'deshidratados' | 'restaurante' | 'fruver' | 'service_store'

export interface Business {
  id?: number
  name: string
  tipo?: BusinessType
  createdAt: Date
}

export const businessTemplates: Record<BusinessType, {
  unidad: string
  showProduccion: boolean
  showGastos: boolean
  showCompra: boolean
  label: string
  emoji: string
}> = {
  pos: {
    unidad: 'unidades',
    showProduccion: true,
    showGastos: true,
    showCompra: true,
    label: 'Tienda / POS',
    emoji: '🏪',
  },
  deshidratados: {
    unidad: 'kg',
    showProduccion: true,
    showGastos: true,
    showCompra: true,
    label: 'Deshidratados',
    emoji: '🥜',
  },
  restaurante: {
    unidad: 'porciones',
    showProduccion: false,
    showGastos: true,
    showCompra: true,
    label: 'Restaurante',
    emoji: '🍽️',
  },
  fruver: {
    unidad: 'kg',
    showProduccion: false,
    showGastos: true,
    showCompra: true,
    label: 'Fruver',
    emoji: '🥬',
  },
  service_store: {
    unidad: 'unidades',
    showProduccion: false,
    showGastos: true,
    showCompra: true,
    label: 'Service Store VIP',
    emoji: '🔧',
  },
}

export function getTemplateByBusinessId(businessId: number) {
  if (businessId === 2) {
    return businessTemplates.deshidratados
  }
  return businessTemplates.pos
}

export async function getActiveBusinessTemplate(): Promise<typeof businessTemplates['pos']> {
  const businessId = getCurrentBusinessId()
  const business = await db.businesses.get(businessId)
  const tipo = business?.tipo || 'pos'
  return businessTemplates[tipo]
}

export interface Product {
  id?: number
  businessId: number
  name: string
  price: number
  cost?: number
  stock?: number
  type?: 'fisico' | 'servicio' | 'licencia' | 'materia_prima' | 'producto_final'
  fechaCompra?: Date
  diasVidaUtil?: number
  unidad?: string
  licenseKey?: string
  licenseEmail?: string
  licenseUsed?: boolean
  createdAt: Date
}

export interface ServiceOrder {
  id?: number
  businessId: number
  clientName: string
  clientPhone: string
  device: string
  problem: string
  status: 'recibido' | 'en_proceso' | 'terminado' | 'entregado'
  cost?: number
  price?: number
  notes?: string
  createdAt: Date
  completedAt?: Date
}

export interface Customer {
  id?: number
  businessId: number
  name: string
  phone?: string
  email?: string
  totalPurchases: number
  lastPurchase?: Date
  createdAt: Date
}

export interface Warehouse {
  id?: number
  businessId: number
  name: string
  address?: string
  isDefault: boolean
  createdAt: Date
}

export interface WarehouseStock {
  id?: number
  businessId: number
  warehouseId: number
  productName: string
  quantity: number
  imei?: string
  serial?: string
  category?: 'accesorio' | 'celular' | 'repuesto' | 'general'
  lastUpdated: Date
}

export interface Customer {
  id?: number
  businessId: number
  name: string
  phone?: string
  email?: string
  totalPurchases: number
  lastPurchase?: Date
  createdAt: Date
}

export interface Production {
  id?: number
  businessId: number
  loteId: string
  rawMaterialName: string
  rawMaterialId?: number
  rawMaterialQty: number
  finalProductName: string
  finalProductId?: number
  finalProductQty: number
  wasteQty: number
  rendimiento: number
  costoUnitario: number
  date: Date
  notes?: string
}

export interface InventoryAdjustment {
  id?: number
  businessId: number
  productName: string
  quantity: number
  reason: string
  date: Date
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

export interface Mesa {
  id?: number
  businessId: number
  name: string
  status: 'disponible' | 'abierta' | 'ocupada' | 'cuenta'
  orderItems: { name: string; quantity: number; price: number; subtotal: number }[]
  total: number
  createdAt: Date
  closedAt?: Date
}

export interface InventoryAdjustment {
  id?: number
  businessId: number
  productName: string
  quantity: number
  reason: string
  date: Date
}

export interface InventoryConfig {
  sellWithoutStock: boolean
  lowStockAlert: boolean
  lowStockThreshold: number
  allowNegative: boolean
}

// ==================== BASE DE DATOS ====================

class LionCoreDB extends Dexie {
  businesses!: Table<Business, number>
  products!: Table<Product, number>
  transactions!: Table<Transaction, number>
  transaction_items!: Table<TransactionItem, number>
  transaction_meta!: Table<TransactionMeta, number>
  mesas!: Table<Mesa, number>
  inventory_adjustments!: Table<InventoryAdjustment, number>
  productions!: Table<Production, number>
  service_orders!: Table<ServiceOrder, number>
  customers!: Table<Customer, number>
  warehouses!: Table<Warehouse, number>
  warehouse_stock!: Table<WarehouseStock, number>

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

    this.version(3).stores({
      mesas: '++id, businessId, status',
    })

    this.version(4).stores({
      inventory_adjustments: '++id, businessId, productName, date',
    })

    this.version(5).stores({
      productions: '++id, businessId, loteId, date, rawMaterialName, finalProductName',
    }).upgrade(() => {
      return Promise.resolve()
    })

    this.version(6).stores({
      service_orders: '++id, businessId, clientName, clientPhone, status, createdAt',
      customers: '++id, businessId, name, phone',
    }).upgrade(() => {
      return Promise.resolve()
    })

    this.version(7).stores({
      warehouses: '++id, businessId, name, isDefault',
      warehouse_stock: '++id, businessId, warehouseId, productName, category',
    }).upgrade(() => {
      return Promise.resolve()
    })
  }
}

// ==================== INSTANCIA ====================

export const db = new LionCoreDB()

// ==================== HELPERS ====================

const BUSINESS_ID_KEY = 'lioncore_current_business'

export function getCurrentBusinessIdFromUrl(): number {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const businessId = Number(params.get("business"))
    if (businessId) return businessId
  }
  const stored = localStorage.getItem(BUSINESS_ID_KEY)
  if (stored) return parseInt(stored, 10)
  
  return 1 // Default: primer negocio
}

export function getCurrentBusinessId(): number {
  return getCurrentBusinessIdFromUrl()
}

export function setCurrentBusinessId(id: number): void {
  localStorage.setItem(BUSINESS_ID_KEY, id.toString())
}

export async function getCurrentBusinessTemplate(businessId?: number) {
  const id = businessId || getCurrentBusinessId()
  const business = await db.businesses.get(id)
  const tipo = business?.tipo || 'pos'
  return businessTemplates[tipo]
}

export async function getOrCreateDefaultBusiness(): Promise<Business> {
  const all = await db.businesses.toArray()
  
  if (all.length > 0) return all[0]
  
  const newBusiness: Business = {
    name: 'Mi Negocio',
    tipo: 'pos',
    createdAt: new Date(),
  }
  
  const id = await db.businesses.add(newBusiness)
  setCurrentBusinessId(id)
  
  return { ...newBusiness, id }
}

export async function getAllBusinesses(): Promise<Business[]> {
  return db.businesses.toArray()
}

export async function createBusiness(name: string, tipo: BusinessType = 'pos'): Promise<number> {
  const id = await db.businesses.add({
    name,
    tipo,
    createdAt: new Date(),
  })
  return id
}

export async function updateBusinessType(id: number, tipo: BusinessType): Promise<void> {
  await db.businesses.update(id, { tipo })
}

export async function deleteBusiness(id: number): Promise<void> {
  await db.businesses.delete(id)
  const current = getCurrentBusinessId()
  if (current === id) {
    const remaining = await db.businesses.toArray()
    if (remaining.length > 0) {
      setCurrentBusinessId(remaining[0].id!)
    }
  }
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
  
  if (type === 'venta') {
    const config = getInventoryConfig()
    for (const item of items) {
      if (!item.productId) continue
      const product = await db.products.get(item.productId)
      if (!product) continue
      const currentStock = product.stock ?? 0
      const newStock = currentStock - item.quantity
      if (config.sellWithoutStock || newStock >= 0 || config.allowNegative) {
        await db.products.update(item.productId, { stock: newStock })
      }
    }
  }
  
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
  pesoEntrada?: number
  pesoSalida?: number
  tiempo?: number
  notas?: string
}

export async function getStockByProduct(): Promise<ProductStock[]> {
  const businessId = getCurrentBusinessId()
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(businessId)
    .toArray()
  
  const productionTxs = transactions.filter(t => t.type === 'produccion')
  const saleTxs = transactions.filter(t => t.type === 'venta')
  const allMeta = await db.transaction_meta.toArray()
  
  const stockMap = new Map<string, { 
    produced: number; 
    sold: number; 
    lastProductionPrice?: number;
    pesoEntrada?: number;
    pesoSalida?: number;
    tiempo?: number;
    notas?: string;
  }>()
  
  for (const tx of productionTxs) {
    const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
    const txMeta = allMeta.filter(m => m.transactionId === tx.id)
    
    let pesoEntrada = 0, pesoSalida = 0, tiempo = 0
    let notas = ''
    
    for (const m of txMeta) {
      if (m.key === 'peso_entrada') pesoEntrada = Number(m.value)
      if (m.key === 'peso_salida') pesoSalida = Number(m.value)
      if (m.key === 'tiempo') tiempo = Number(m.value)
      if (m.key === 'notas') notas = m.value as string
    }
    
    for (const item of items) {
      const current = stockMap.get(item.name) || { produced: 0, sold: 0 }
      stockMap.set(item.name, {
        produced: current.produced + item.quantity,
        sold: current.sold,
        lastProductionPrice: item.price,
        pesoEntrada: pesoEntrada || (current.pesoEntrada || 0),
        pesoSalida: pesoSalida || (current.pesoSalida || 0),
        tiempo: tiempo || (current.tiempo || 0),
        notas: notas || current.notas || ''
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
        pesoEntrada: current.pesoEntrada || 0,
        pesoSalida: current.pesoSalida || 0,
        tiempo: current.tiempo || 0,
        notas: current.notas || ''
      })
    }
  }
  
  return Array.from(stockMap.entries()).map(([name, data]) => ({
    name,
    quantity: data.produced - data.sold,
    totalProduced: data.produced,
    totalSold: data.sold,
    lastPrice: data.lastProductionPrice,
    pesoEntrada: data.pesoEntrada,
    pesoSalida: data.pesoSalida,
    tiempo: data.tiempo,
    notas: data.notas
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

export interface NetProfitSummary {
  ventasTotales: number
  costoProductosVendidos: number
  gananciaBruta: number
  gastosOperativos: number
  comprasMateriaPrima: number
  gananciaNeta: number
  margenPorcentaje: number
  transaccionesCount: number
}

export async function getNetProfitSummary(date: Date = new Date()): Promise<NetProfitSummary> {
  const businessId = getCurrentBusinessId()
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const transactions = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter(t => t.date >= startOfDay && t.date <= endOfDay)
    .toArray()

  const ventas = transactions.filter(t => t.type === 'venta')
  const ventasTotales = ventas.reduce((sum, t) => sum + t.total, 0)

  let costoProductosVendidos = 0
  for (const tx of ventas) {
    const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
    for (const item of items) {
      if (item.costUnitario && item.costUnitario > 0) {
        costoProductosVendidos += item.costUnitario * item.quantity
      } else if (item.productId) {
        const product = await db.products.get(item.productId)
        if (product && product.cost && product.cost > 0) {
          costoProductosVendidos += product.cost * item.quantity
        }
      }
    }
  }

  const gananciaBruta = ventasTotales - costoProductosVendidos

  const gastosOperativos = transactions
    .filter(t => t.type === 'gasto')
    .reduce((sum, t) => sum + t.total, 0)

  const comprasMateriaPrima = transactions
    .filter(t => t.type === 'compra')
    .reduce((sum, t) => sum + t.total, 0)

  const gananciaNeta = gananciaBruta - gastosOperativos - comprasMateriaPrima
  const margenPorcentaje = ventasTotales > 0 ? (gananciaNeta / ventasTotales) * 100 : 0

  return {
    ventasTotales,
    costoProductosVendidos,
    gananciaBruta,
    gastosOperativos,
    comprasMateriaPrima,
    gananciaNeta,
    margenPorcentaje,
    transaccionesCount: transactions.length,
  }
}

// ==================== MESAS ====================

export async function getMesas(): Promise<Mesa[]> {
  const businessId = getCurrentBusinessId()
  return db.mesas.where('businessId').equals(businessId).toArray()
}

export async function createMesa(name: string, count: number): Promise<number> {
  const businessId = getCurrentBusinessId()
  const id = await db.mesas.add({
    businessId,
    name: `${name} ${count}`,
    status: 'disponible',
    orderItems: [],
    total: 0,
    createdAt: new Date(),
  })
  return id
}

export async function openMesa(id: number): Promise<void> {
  await db.mesas.update(id, { status: 'abierta', orderItems: [], total: 0 })
}

export async function addToMesa(mesaId: number, item: { name: string; quantity: number; price: number; subtotal: number }): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa) return

  const existing = mesa.orderItems.find(o => o.name === item.name)
  if (existing) {
    existing.quantity += item.quantity
    existing.subtotal = existing.quantity * existing.price
  } else {
    mesa.orderItems.push(item)
  }

  mesa.total = mesa.orderItems.reduce((sum, o) => sum + o.subtotal, 0)
  mesa.status = 'ocupada'
  await db.mesas.update(mesaId, { orderItems: mesa.orderItems, total: mesa.total, status: mesa.status })
}

export async function closeMesa(mesaId: number): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa || mesa.orderItems.length === 0) return

  const transactionId = await db.transactions.add({
    businessId: mesa.businessId,
    type: 'venta',
    total: mesa.total,
    date: new Date(),
  })

  for (const item of mesa.orderItems) {
    await db.transaction_items.add({
      transactionId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })
  }

  await db.mesas.update(mesaId, {
    status: 'disponible',
    orderItems: [],
    total: 0,
    closedAt: new Date(),
  })
}

export async function removeItemFromMesa(mesaId: number, itemIndex: number): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa) return

  mesa.orderItems.splice(itemIndex, 1)
  mesa.total = mesa.orderItems.reduce((sum, o) => sum + o.subtotal, 0)
  mesa.status = mesa.orderItems.length > 0 ? 'ocupada' : 'abierta'
  await db.mesas.update(mesaId, { orderItems: mesa.orderItems, total: mesa.total, status: mesa.status })
}

export async function resetAllMesas(): Promise<void> {
  const businessId = getCurrentBusinessId()
  await db.mesas.where('businessId').equals(businessId).delete()

  for (let i = 1; i <= 12; i++) {
    await createMesa('Mesa', i)
  }
}

// ==================== INVENTARIO ====================

const INV_CONFIG_KEY = 'invConfig'

export function getInventoryConfig(): InventoryConfig {
  const saved = localStorage.getItem(`${INV_CONFIG_KEY}_${getCurrentBusinessId()}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  return {
    sellWithoutStock: true,
    lowStockAlert: true,
    lowStockThreshold: 5,
    allowNegative: true,
  }
}

export function saveInventoryConfig(config: InventoryConfig): void {
  localStorage.setItem(`${INV_CONFIG_KEY}_${getCurrentBusinessId()}`, JSON.stringify(config))
}

export async function adjustInventory(productName: string, quantity: number, reason: string): Promise<void> {
  const businessId = getCurrentBusinessId()
  await db.inventory_adjustments.add({
    businessId,
    productName,
    quantity,
    reason,
    date: new Date(),
  })
}

export async function getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
  const businessId = getCurrentBusinessId()
  return db.inventory_adjustments.where('businessId').equals(businessId).reverse().sortBy('date')
}

export function getInventoryMode(businessType: BusinessType): { showInventory: boolean; blockSales: boolean; allowNegative: boolean; label: string } {
  switch (businessType) {
    case 'pos':
      return { showInventory: true, blockSales: true, allowNegative: false, label: 'Por unidades' }
    case 'restaurante':
      return { showInventory: false, blockSales: false, allowNegative: true, label: 'Por porciones (sin inventario)' }
    case 'fruver':
      return { showInventory: true, blockSales: false, allowNegative: true, label: 'Por kg (flexible, con merma)' }
    case 'deshidratados':
      return { showInventory: true, blockSales: true, allowNegative: false, label: 'Por kg (control exacto)' }
    case 'service_store':
      return { showInventory: true, blockSales: true, allowNegative: true, label: 'Unidades (accesorios, celulares, servicios)' }
    default:
      return { showInventory: true, blockSales: false, allowNegative: true, label: 'Por unidades' }
  }
}

// ==================== PRODUCCION DESHIDRATADOS ====================

export async function createProduction(
  rawMaterialId: number,
  rawMaterialQty: number,
  finalProductId: number,
  finalProductQty: number,
  notes?: string
): Promise<number> {
  const businessId = getCurrentBusinessId()
  const rawMaterial = await db.products.get(rawMaterialId)
  const finalProduct = await db.products.get(finalProductId)
  
  if (!rawMaterial || !finalProduct) {
    throw new Error('Producto no encontrado')
  }

  const loteId = `L-${Date.now().toString(36).toUpperCase()}`
  const wasteQty = rawMaterialQty - finalProductQty
  const rendimiento = rawMaterialQty > 0 ? (finalProductQty / rawMaterialQty) * 100 : 0
  const totalCost = (rawMaterial.cost || 0) * rawMaterialQty
  const costoUnitario = finalProductQty > 0 ? totalCost / finalProductQty : 0

  const productionId = await db.productions.add({
    businessId,
    loteId,
    rawMaterialName: rawMaterial.name,
    rawMaterialId,
    rawMaterialQty,
    finalProductName: finalProduct.name,
    finalProductId,
    finalProductQty,
    wasteQty,
    rendimiento,
    costoUnitario,
    date: new Date(),
    notes,
  })

  // Descontar materia prima
  const newRawStock = (rawMaterial.stock || 0) - rawMaterialQty
  await db.products.update(rawMaterialId, { stock: newRawStock })

  // Sumar producto final
  const newFinalStock = (finalProduct.stock || 0) + finalProductQty
  await db.products.update(finalProductId, { stock: newFinalStock, cost: costoUnitario })

  // Registrar transaccion de produccion
  const txId = await db.transactions.add({
    businessId,
    type: 'produccion',
    total: totalCost,
    date: new Date(),
  })

  await db.transaction_items.add({
    transactionId: txId,
    productId: finalProductId,
    name: `${finalProduct.name} (Lote ${loteId})`,
    quantity: finalProductQty,
    price: costoUnitario,
    subtotal: totalCost,
    costUnitario: costoUnitario,
  })

  return productionId
}

export async function getProductions(): Promise<Production[]> {
  const businessId = getCurrentBusinessId()
  return db.productions.where('businessId').equals(businessId).reverse().sortBy('date')
}

export async function getProductionDashboard(): Promise<{
  totalProduced: number
  totalWaste: number
  avgRendimiento: number
  totalBatches: number
  totalCost: number
}> {
  const productions = await getProductions()
  const totalProduced = productions.reduce((sum, p) => sum + p.finalProductQty, 0)
  const totalWaste = productions.reduce((sum, p) => sum + p.wasteQty, 0)
  const avgRendimiento = productions.length > 0 ? productions.reduce((sum, p) => sum + p.rendimiento, 0) / productions.length : 0
  const totalCost = productions.reduce((sum, p) => sum + p.costoUnitario * p.finalProductQty, 0)
  
  return {
    totalProduced,
    totalWaste,
    avgRendimiento,
    totalBatches: productions.length,
    totalCost,
  }
}

export function generateLoteId(): string {
  return `L-${Date.now().toString(36).toUpperCase()}`
}

export async function getRawMaterials(): Promise<Product[]> {
  const businessId = getCurrentBusinessId()
  return db.products.where({ businessId, type: 'materia_prima' }).toArray()
}

export async function getFinalProducts(): Promise<Product[]> {
  const businessId = getCurrentBusinessId()
  return db.products.where({ businessId, type: 'producto_final' }).toArray()
}

// ==================== FRUVER ====================

export async function registerFruverPurchase(productName: string, kg: number, totalCost: number): Promise<void> {
  const businessId = getCurrentBusinessId()
  const costPerKg = kg > 0 ? totalCost / kg : 0
  const product = await db.products.where({ businessId, name: productName }).first()
  
  if (product) {
    const newStock = (product.stock || 0) + kg
    await db.products.update(product.id!, {
      stock: newStock,
      cost: costPerKg,
      fechaCompra: new Date(),
    })
  }

  const txId = await db.transactions.add({
    businessId,
    type: 'compra',
    total: totalCost,
    date: new Date(),
  })

  await db.transaction_items.add({
    transactionId: txId,
    productId: product?.id,
    name: productName,
    quantity: kg,
    price: costPerKg,
    subtotal: totalCost,
    costUnitario: costPerKg,
  })
}

export async function registerFruverWaste(productName: string, kg: number, reason: string): Promise<void> {
  const businessId = getCurrentBusinessId()
  const product = await db.products.where({ businessId, name: productName }).first()
  
  if (product) {
    const newStock = (product.stock || 0) - kg
    await db.products.update(product.id!, { stock: newStock })
  }

  await db.inventory_adjustments.add({
    businessId,
    productName,
    quantity: -kg,
    reason: `Merma: ${reason}`,
    date: new Date(),
  })
}

export async function getFruverDashboard(): Promise<{
  ventasHoy: number
  mermaHoy: number
  gananciaHoy: number
  productosCriticos: { name: string; stock: number; diasRestantes: number }[]
}> {
  const businessId = getCurrentBusinessId()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const ventas = await db.transactions.where({ businessId, type: 'venta' }).filter(tx => {
    const d = new Date(tx.date)
    return d >= today
  }).toArray()
  const ventasHoy = ventas.reduce((sum, tx) => sum + tx.total, 0)

  const mermas = await db.inventory_adjustments.where('businessId').equals(businessId).filter(adj => {
    const d = new Date(adj.date)
    return d >= today && adj.quantity < 0 && adj.reason.includes('Merma')
  }).toArray()
  const mermaHoy = mermas.reduce((sum, adj) => sum + Math.abs(adj.quantity), 0)

  const productos = await db.products.where('businessId').equals(businessId).toArray()
  const productosCriticos = productos
    .filter(p => p.fechaCompra && p.diasVidaUtil)
    .map(p => {
      const fechaCompra = new Date(p.fechaCompra!)
      const fechaVencimiento = new Date(fechaCompra.getTime() + (p.diasVidaUtil || 0) * 86400000)
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - Date.now()) / 86400000)
      return { name: p.name, stock: p.stock || 0, diasRestantes }
    })
    .filter(p => p.diasRestantes <= 2)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)

  const gananciaHoy = ventasHoy - (ventas.length > 0 ? ventas.reduce((sum, tx) => {
    return sum + (tx.total * 0.4)
  }, 0) : 0)

  return { ventasHoy, mermaHoy, gananciaHoy, productosCriticos }
}

export async function updateProductPrice(productId: number, newPrice: number): Promise<void> {
  await db.products.update(productId, { price: newPrice })
}

export function getProductMargin(product: Product): number {
  if (!product.cost || product.cost === 0) return 0
  return product.price - product.cost
}

// ==================== SERVICIOS TECNICOS ====================

export async function createServiceOrder(data: Omit<ServiceOrder, 'id' | 'businessId' | 'createdAt'>): Promise<number> {
  return db.service_orders.add({
    ...data,
    businessId: getCurrentBusinessId(),
    createdAt: new Date(),
  })
}

export async function updateServiceOrderStatus(id: number, status: ServiceOrder['status']): Promise<void> {
  const updates: Partial<ServiceOrder> = { status }
  if (status === 'entregado') {
    updates.completedAt = new Date()
  }
  await db.service_orders.update(id, updates)
}

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return db.service_orders.where('businessId').equals(getCurrentBusinessId()).reverse().sortBy('createdAt')
}

export async function getCustomers(): Promise<Customer[]> {
  return db.customers.where('businessId').equals(getCurrentBusinessId()).toArray()
}

export async function upsertCustomer(name: string, phone?: string): Promise<number> {
  const businessId = getCurrentBusinessId()
  const existing = await db.customers.where({ businessId, phone }).first()
  if (existing) {
    await db.customers.update(existing.id!, { name, totalPurchases: (existing.totalPurchases || 0) + 1, lastPurchase: new Date() })
    return existing.id!
  }
  return db.customers.add({
    businessId,
    name,
    phone,
    totalPurchases: 1,
    lastPurchase: new Date(),
    createdAt: new Date(),
  })
}

export async function sendWhatsAppReceipt(phone: string, product: string, total: number): Promise<void> {
  const msg = `Hola! Tu compra en LionCore:%0AProducto: ${product}%0ATotal: $${total.toLocaleString('es-CO')}%0A¡Gracias por tu compra!`
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
  window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank')
}

export async function sendWhatsAppLicense(phone: string, product: string, key: string): Promise<void> {
  const msg = `Hola! Tu licencia:%0AProducto: ${product}%0AClave: ${key}%0A¡Gracias por tu compra!`
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
  window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank')
}

// ==================== BODEGAS ====================

export async function createWarehouse(name: string, address?: string): Promise<number> {
  const businessId = getCurrentBusinessId()
  const existing = await db.warehouses.where('businessId').equals(businessId).count()
  return db.warehouses.add({
    businessId,
    name,
    address,
    isDefault: existing === 0,
    createdAt: new Date(),
  })
}

export async function getWarehouses(): Promise<Warehouse[]> {
  return db.warehouses.where('businessId').equals(getCurrentBusinessId()).sortBy('name')
}

export async function getDefaultWarehouse(): Promise<Warehouse | undefined> {
  return db.warehouses.where('businessId').equals(getCurrentBusinessId()).and(w => w.isDefault).first()
}

export async function deleteWarehouse(id: number): Promise<void> {
  await db.warehouse_stock.where('warehouseId').equals(id).delete()
  await db.warehouses.delete(id)
}

export async function updateWarehouseStock(warehouseId: number, productName: string, quantity: number, category?: string, imei?: string, serial?: string): Promise<number> {
  const businessId = getCurrentBusinessId()
  const existing = await db.warehouse_stock
    .where({ businessId, warehouseId, productName })
    .first()
  if (existing) {
    await db.warehouse_stock.update(existing.id!, {
      quantity: existing.quantity + quantity,
      lastUpdated: new Date(),
    })
    return existing.id!
  }
  return db.warehouse_stock.add({
    businessId,
    warehouseId,
    productName,
    quantity,
    category: category as any,
    imei,
    serial,
    lastUpdated: new Date(),
  })
}

export async function getWarehouseStock(warehouseId: number): Promise<WarehouseStock[]> {
  return db.warehouse_stock
    .where({ businessId: getCurrentBusinessId(), warehouseId })
    .sortBy('productName')
}

export async function getAllWarehouseStock(): Promise<WarehouseStock[]> {
  return db.warehouse_stock
    .where('businessId')
    .equals(getCurrentBusinessId())
    .sortBy('productName')
}

export async function transferStock(fromWarehouseId: number, toWarehouseId: number, productName: string, quantity: number): Promise<void> {
  const fromStock = await db.warehouse_stock
    .where({ businessId: getCurrentBusinessId(), warehouseId: fromWarehouseId, productName })
    .first()
  if (!fromStock || fromStock.quantity < quantity) {
    throw new Error('Stock insuficiente')
  }
  await db.warehouse_stock.update(fromStock.id!, {
    quantity: fromStock.quantity - quantity,
    lastUpdated: new Date(),
  })
  const toStock = await db.warehouse_stock
    .where({ businessId: getCurrentBusinessId(), warehouseId: toWarehouseId, productName })
    .first()
  if (toStock) {
    await db.warehouse_stock.update(toStock.id!, {
      quantity: toStock.quantity + quantity,
      lastUpdated: new Date(),
    })
  } else {
    await db.warehouse_stock.add({
      businessId: getCurrentBusinessId(),
      warehouseId: toWarehouseId,
      productName,
      quantity,
      category: fromStock.category,
      imei: fromStock.imei,
      serial: fromStock.serial,
      lastUpdated: new Date(),
    })
  }
}