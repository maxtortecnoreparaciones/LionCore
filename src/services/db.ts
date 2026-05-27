import Dexie, { Table } from 'dexie'

// ==================== TIPOS ====================

export type BusinessType = 'pos' | 'deshidratados' | 'restaurante' | 'fruver' | 'service_store'

export const PRODUCT_UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'unidad', 'paquete', 'caja', 'bandeja'] as const
export type ProductUnit = typeof PRODUCT_UNITS[number]

export function isWeightUnit(unit: string): boolean {
  return ['kg', 'g', 'lb'].includes(unit)
}

export function isVolumeUnit(unit: string): boolean {
  return ['L', 'mL'].includes(unit)
}

export function isCountUnit(unit: string): boolean {
  return !isWeightUnit(unit) && !isVolumeUnit(unit)
}

export function getDefaultUnit(businessType: BusinessType): ProductUnit {
  const template = businessTemplates[businessType]
  if (template.unidad === 'kg') return 'kg'
  if (template.unidad === 'porciones') return 'unidad'
  if (template.unidad === 'unidades') return 'unidad'
  return 'unidad'
}

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
  code?: string
  qr?: string
  name: string
  price: number
  cost?: number
  stock?: number
  type?: 'fisico' | 'servicio' | 'licencia' | 'materia_prima' | 'producto_final'
  fechaCompra?: Date
  diasVidaUtil?: number
  unidad?: string
  proveedor?: string
  categoria?: string
  licenseKey?: string
  licenseEmail?: string
  licenseUsed?: boolean
  pricingMode?: 'UNIT' | 'WEIGHT'
  margin?: number
  createdAt: Date
}

const BUSINESS_CODE_PREFIXES: Record<BusinessType, string> = {
  pos: 'POS',
  deshidratados: 'DES',
  restaurante: 'RES',
  fruver: 'FRU',
  service_store: 'SVC',
}

export function getBusinessCodePrefix(businessType: BusinessType): string {
  return BUSINESS_CODE_PREFIXES[businessType] || 'GEN'
}

export async function generateNextProductCode(businessId: number, businessType?: BusinessType): Promise<string> {
  const products = await db.products.where('businessId').equals(businessId).toArray()
  let maxNum = 0
  const prefix = businessType ? getBusinessCodePrefix(businessType) + '-' : ''
  for (const p of products) {
    if (p.code) {
      const stripped = businessType ? p.code.replace(prefix, '') : p.code
      const num = parseInt(stripped, 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  }
  return prefix + String(maxNum + 1).padStart(3, '0')
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
  documento?: string
  phone?: string
  email?: string
  direccion?: string
  notas?: string
  estado: 'activo' | 'inactivo'
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

export interface Supplier {
  id?: number
  businessId: number
  empresa: string
  contacto?: string
  phone?: string
  email?: string
  direccion?: string
  notas?: string
  estado: 'activo' | 'inactivo'
  totalPurchases: number
  lastPurchase?: Date
  createdAt: Date
}

export interface Category {
  id?: number
  businessId: number
  name: string
  parentId?: number
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
  code?: string
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
  orderItems: { name: string; quantity: number; price: number; subtotal: number; code?: string; status?: 'pendiente' | 'preparando' | 'listo' }[]
  total: number
  createdAt: Date
  closedAt?: Date
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
  suppliers!: Table<Supplier, number>
  categories!: Table<Category, number>
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

    this.version(8).stores({
      transaction_items: '++id, transactionId, code',
    }).upgrade(() => {
      return Promise.resolve()
    })

    this.version(9).stores({
      suppliers: '++id, businessId, empresa, phone',
    }).upgrade(() => {
      return Promise.resolve()
    })

    this.version(10).stores({
      categories: '++id, businessId, name, parentId',
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
  const q = query.toLowerCase()
  return db.products
    .where('businessId')
    .equals(getCurrentBusinessId())
    .filter(p => p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q) || (p.qr || '').toLowerCase().includes(q) || (p.proveedor || '').toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q))
    .toArray()
}

export async function deleteProduct(productName: string): Promise<void> {
  const businessId = getCurrentBusinessId()
  const products = await db.products.where('businessId').equals(businessId).toArray()
  const product = products.find(p => p.name.toLowerCase().trim() === productName.toLowerCase().trim())
  if (product && product.id) {
    await db.products.delete(product.id)
  }
  await db.inventory_adjustments.where({ businessId, productName }).delete()
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
  id?: number
  code?: string
  qr?: string
  name: string
  proveedor?: string
  categoria?: string
  quantity: number
  totalProduced: number
  totalSold: number
  totalPurchased: number
  totalAdjusted: number
  lastPrice?: number
  pesoEntrada?: number
  pesoSalida?: number
  tiempo?: number
  notas?: string
  cost?: number
  unit?: string
  pricingMode?: 'UNIT' | 'WEIGHT'
  margin?: number
}

export async function getStockByProduct(): Promise<ProductStock[]> {
  const businessId = getCurrentBusinessId()
  
  const products = await db.products.where('businessId').equals(businessId).toArray()
  const productIdMap = new Map<string, { id: number; cost?: number; price?: number; unit?: string; code?: string; qr?: string; proveedor?: string; categoria?: string; pricingMode?: string; margin?: number }>()
  for (const p of products) {
    productIdMap.set(p.name.toLowerCase(), { id: p.id!, cost: p.cost, price: p.price, unit: p.unidad, code: p.code, qr: p.qr, proveedor: p.proveedor, categoria: p.categoria, pricingMode: p.pricingMode, margin: p.margin })
  }
  
  const transactions = await db.transactions
    .where('businessId')
    .equals(businessId)
    .toArray()
  
  const productionTxs = transactions.filter(t => t.type === 'produccion')
  const saleTxs = transactions.filter(t => t.type === 'venta')
  const purchaseTxs = transactions.filter(t => t.type === 'compra')
  const allMeta = await db.transaction_meta.toArray()
  
  const stockMap = new Map<string, { 
    id?: number;
    produced: number; 
    sold: number;
    purchased: number;
    adjusted: number;
    lastProductionPrice?: number;
    lastSalePrice?: number;
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
      const current = stockMap.get(item.name) || { produced: 0, sold: 0, purchased: 0, adjusted: 0 }
      const pinfo = productIdMap.get(item.name.toLowerCase())
      stockMap.set(item.name, {
        id: pinfo?.id,
        produced: current.produced + item.quantity,
        sold: current.sold,
        purchased: current.purchased,
        adjusted: current.adjusted,
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
      const current = stockMap.get(item.name) || { produced: 0, sold: 0, purchased: 0, adjusted: 0 }
      const pinfo = productIdMap.get(item.name.toLowerCase())
      stockMap.set(item.name, {
        id: pinfo?.id,
        produced: current.produced,
        sold: current.sold + item.quantity,
        purchased: current.purchased,
        adjusted: current.adjusted,
        lastProductionPrice: current.lastProductionPrice,
        lastSalePrice: item.price,
        pesoEntrada: current.pesoEntrada || 0,
        pesoSalida: current.pesoSalida || 0,
        tiempo: current.tiempo || 0,
        notas: current.notas || ''
      })
    }
  }
  
  for (const tx of purchaseTxs) {
    const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
    for (const item of items) {
      const current = stockMap.get(item.name) || { produced: 0, sold: 0, purchased: 0, adjusted: 0 }
      const pinfo = productIdMap.get(item.name.toLowerCase())
      stockMap.set(item.name, {
        id: pinfo?.id,
        produced: current.produced,
        sold: current.sold,
        purchased: current.purchased + item.quantity,
        adjusted: current.adjusted,
        lastProductionPrice: current.lastProductionPrice,
        pesoEntrada: current.pesoEntrada || 0,
        pesoSalida: current.pesoSalida || 0,
        tiempo: current.tiempo || 0,
        notas: current.notas || ''
      })
    }
  }
  
  const adjustments = await db.inventory_adjustments.where('businessId').equals(businessId).toArray()
  for (const adj of adjustments) {
    const current = stockMap.get(adj.productName) || { produced: 0, sold: 0, purchased: 0, adjusted: 0 }
    const pinfo = productIdMap.get(adj.productName.toLowerCase())
    stockMap.set(adj.productName, {
      id: pinfo?.id,
      produced: current.produced,
      sold: current.sold,
      purchased: current.purchased,
      adjusted: current.adjusted + adj.quantity,
      lastProductionPrice: current.lastProductionPrice,
      pesoEntrada: current.pesoEntrada || 0,
      pesoSalida: current.pesoSalida || 0,
      tiempo: current.tiempo || 0,
      notas: current.notas || ''
    })
  }
  
  const result = Array.from(stockMap.entries()).map(([name, data]) => {
    const pinfo = productIdMap.get(name.toLowerCase())
    if (!pinfo) return null
    return {
      id: pinfo?.id,
      code: pinfo?.code,
      qr: pinfo?.qr,
      proveedor: pinfo?.proveedor,
      categoria: pinfo?.categoria,
      name,
      quantity: (data.produced || 0) + (data.purchased || 0) + (data.adjusted || 0) - (data.sold || 0),
      totalProduced: data.produced || 0,
      totalSold: data.sold || 0,
      totalPurchased: data.purchased || 0,
      totalAdjusted: data.adjusted || 0,
      lastPrice: data.lastSalePrice ?? data.lastProductionPrice ?? pinfo?.price,
      pesoEntrada: data.pesoEntrada,
      pesoSalida: data.pesoSalida,
      tiempo: data.tiempo,
      notas: data.notas,
      cost: pinfo?.cost,
      unit: pinfo?.unit,
      pricingMode: pinfo?.pricingMode as 'UNIT' | 'WEIGHT' | undefined,
      margin: pinfo?.margin,
    }
  }).filter(Boolean) as ProductStock[]
  
  // Include products with no transactions at all (show their product.stock base value)
  for (const p of products) {
    if (!result.find(r => r.name.toLowerCase() === p.name.toLowerCase())) {
      result.push({
        id: p.id,
        code: p.code,
        qr: p.qr,
        proveedor: p.proveedor,
        categoria: p.categoria,
        name: p.name,
        quantity: p.stock || 0,
        totalProduced: 0,
        totalSold: 0,
        totalPurchased: 0,
        totalAdjusted: 0,
        lastPrice: p.price,
        cost: p.cost,
        unit: p.unidad,
        pricingMode: p.pricingMode,
        margin: p.margin,
        pesoEntrada: undefined,
        pesoSalida: undefined,
        tiempo: undefined,
        notas: undefined,
      })
    }
  }
  
  return result
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

export async function addToMesa(mesaId: number, item: { name: string; code?: string; quantity: number; price: number; subtotal: number }): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa) return

  const existing = mesa.orderItems.find(o => o.name === item.name)
  if (existing) {
    existing.quantity += item.quantity
    existing.subtotal = existing.quantity * existing.price
  } else {
    mesa.orderItems.push({ ...item, status: 'pendiente' })
  }

  mesa.total = mesa.orderItems.reduce((sum, o) => sum + o.subtotal, 0)
  mesa.status = 'ocupada'
  await db.mesas.update(mesaId, { orderItems: mesa.orderItems, total: mesa.total, status: mesa.status })
}

export async function setOrderItemStatus(mesaId: number, itemIndex: number, status: 'pendiente' | 'preparando' | 'listo'): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa || !mesa.orderItems[itemIndex]) return
  mesa.orderItems[itemIndex].status = status
  await db.mesas.update(mesaId, { orderItems: mesa.orderItems })
}

export async function closeMesa(mesaId: number, paymentMethod?: string): Promise<void> {
  const mesa = await db.mesas.get(mesaId)
  if (!mesa || mesa.orderItems.length === 0) return

  const transactionId = await db.transactions.add({
    businessId: mesa.businessId,
    type: 'venta',
    total: mesa.total,
    date: new Date(),
  })

  if (paymentMethod) {
    await db.transaction_meta.add({ transactionId, key: 'payment_method', value: paymentMethod })
    await db.transaction_meta.add({ transactionId, key: 'mesa', value: mesa.name })
  }

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

export async function setMesaStatus(mesaId: number, status: Mesa['status']): Promise<void> {
  await db.mesas.update(mesaId, { status })
}

export async function moveMesaItems(fromMesaId: number, toMesaId: number): Promise<void> {
  const from = await db.mesas.get(fromMesaId)
  const to = await db.mesas.get(toMesaId)
  if (!from || !to) return

  const mergedItems = [...to.orderItems]
  for (const item of from.orderItems) {
    const existing = mergedItems.find(o => o.name === item.name)
    if (existing) {
      existing.quantity += item.quantity
      existing.subtotal = existing.quantity * existing.price
    } else {
      mergedItems.push({ ...item })
    }
  }

  const newTotal = mergedItems.reduce((sum, o) => sum + o.subtotal, 0)
  await db.mesas.update(toMesaId, { orderItems: mergedItems, total: newTotal, status: 'ocupada' })
  await db.mesas.update(fromMesaId, { status: 'disponible', orderItems: [], total: 0 })
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

export interface InventoryHistoryEntry {
  id: number
  date: Date
  type: 'compra' | 'venta' | 'produccion' | 'merma' | 'ajuste'
  productName: string
  code?: string
  quantity: number
  unit?: string
  desc: string
}

export async function getInventoryHistory(): Promise<InventoryHistoryEntry[]> {
  const businessId = getCurrentBusinessId()
  const entries: InventoryHistoryEntry[] = []

  // 1. Transaction items from ventas, compras, produccion
  const transactions = await db.transactions.where('businessId').equals(businessId).toArray()
  const txIds = transactions.map(t => t.id!)
  if (txIds.length > 0) {
    const items = await db.transaction_items.where('transactionId').anyOf(txIds).toArray()
    for (const tx of transactions) {
      const txItems = items.filter(i => i.transactionId === tx.id)
      for (const item of txItems) {
        if (tx.type === 'venta') {
          const product = await db.products.where({ businessId, name: item.name }).first()
          entries.push({
            id: tx.id! * 1000 + (item.id || 0),
            date: tx.date,
            type: 'venta',
            productName: item.name,
            code: item.code || product?.code,
            quantity: -item.quantity,
            unit: item.unit || product?.unidad,
            desc: `Venta #${tx.id}`,
          })
        } else if (tx.type === 'compra') {
          const product = await db.products.where({ businessId, name: item.name }).first()
          entries.push({
            id: tx.id! * 1000 + (item.id || 0),
            date: tx.date,
            type: 'compra',
            productName: item.name,
            code: item.code || product?.code,
            quantity: item.quantity,
            unit: item.unit || product?.unidad,
            desc: `Compra #${tx.id}`,
          })
        } else if (tx.type === 'produccion') {
          const meta = await db.transaction_meta.where('transactionId').equals(tx.id!).toArray()
          const metaMap = new Map(meta.map(m => [m.key, m.value]))
          const isOutput = metaMap.get('peso_salida') !== undefined && item.name === (await db.products.get(item.productId!))?.name
          entries.push({
            id: tx.id! * 1000 + (item.id || 0),
            date: tx.date,
            type: 'produccion',
            productName: item.name,
            code: item.code,
            quantity: isOutput ? item.quantity : -item.quantity,
            unit: item.unit,
            desc: isOutput ? 'Producción (salida)' : 'Producción (insumo)',
          })
        }
      }
    }
  }

  // 2. Inventory adjustments (manual)
  const adjustments = await getInventoryAdjustments()
  for (const adj of adjustments) {
    entries.push({
      id: adj.id!,
      date: adj.date,
      type: 'ajuste',
      productName: adj.productName,
      quantity: adj.quantity,
      desc: adj.reason,
    })
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
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
  productosCriticos: { name: string; code?: string; stock: number; diasRestantes: number }[]
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
      return { name: p.name, code: p.code, stock: p.stock || 0, diasRestantes }
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

export async function getActiveCustomers(): Promise<Customer[]> {
  const businessId = getCurrentBusinessId()
  const all = await db.customers.where('businessId').equals(businessId).toArray()
  return all.filter(c => c.estado === 'activo')
}

export async function upsertCustomer(name: string, phone?: string): Promise<number> {
  const businessId = getCurrentBusinessId()
  const existing = phone ? await db.customers.where({ businessId, phone }).first() : null
  if (existing) {
    await db.customers.update(existing.id!, { name, totalPurchases: (existing.totalPurchases || 0) + 1, lastPurchase: new Date() })
    return existing.id!
  }
  return db.customers.add({
    businessId,
    name,
    phone,
    estado: 'activo',
    totalPurchases: 1,
    lastPurchase: new Date(),
    createdAt: new Date(),
  })
}

export async function createCustomer(data: { name: string; documento?: string; phone?: string; email?: string; direccion?: string; notas?: string }): Promise<number> {
  return db.customers.add({
    businessId: getCurrentBusinessId(),
    name: data.name,
    documento: data.documento,
    phone: data.phone,
    email: data.email,
    direccion: data.direccion,
    notas: data.notas,
    estado: 'activo',
    totalPurchases: 0,
    createdAt: new Date(),
  })
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<void> {
  await db.customers.update(id, data)
}

export async function deactivateCustomer(id: number): Promise<void> {
  await db.customers.update(id, { estado: 'inactivo' })
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const businessId = getCurrentBusinessId()
  const all = await db.customers.where('businessId').equals(businessId).toArray()
  const q = query.toLowerCase()
  return all.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.documento || '').toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  )
}

export async function getSuppliers(): Promise<Supplier[]> {
  return db.suppliers.where('businessId').equals(getCurrentBusinessId()).toArray()
}

export async function getActiveSuppliers(): Promise<Supplier[]> {
  const businessId = getCurrentBusinessId()
  const all = await db.suppliers.where('businessId').equals(businessId).toArray()
  return all.filter(s => s.estado === 'activo')
}

export async function createSupplier(data: { empresa: string; contacto?: string; phone?: string; email?: string; direccion?: string; notas?: string }): Promise<number> {
  return db.suppliers.add({
    businessId: getCurrentBusinessId(),
    empresa: data.empresa,
    contacto: data.contacto,
    phone: data.phone,
    email: data.email,
    direccion: data.direccion,
    notas: data.notas,
    estado: 'activo',
    totalPurchases: 0,
    createdAt: new Date(),
  })
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
  await db.suppliers.update(id, data)
}

export async function deactivateSupplier(id: number): Promise<void> {
  await db.suppliers.update(id, { estado: 'inactivo' })
}

export async function searchSuppliers(query: string): Promise<Supplier[]> {
  const businessId = getCurrentBusinessId()
  const all = await db.suppliers.where('businessId').equals(businessId).toArray()
  const q = query.toLowerCase()
  return all.filter(s =>
    s.empresa.toLowerCase().includes(q) ||
    (s.contacto || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q)
  )
}

export async function getCategories(): Promise<Category[]> {
  return db.categories.where('businessId').equals(getCurrentBusinessId()).toArray()
}

export async function getCategoryTree(): Promise<Category[]> {
  const all = await getCategories()
  return all.sort((a, b) => (a.parentId || 0) - (b.parentId || 0) || a.name.localeCompare(b.name))
}

export async function createCategory(name: string, parentId?: number): Promise<number> {
  return db.categories.add({
    businessId: getCurrentBusinessId(),
    name,
    parentId,
    createdAt: new Date(),
  })
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<void> {
  await db.categories.update(id, data)
}

export async function deleteCategory(id: number): Promise<void> {
  const children = await db.categories.where('parentId').equals(id).toArray()
  for (const child of children) {
    await db.categories.update(child.id!, { parentId: undefined })
  }
  await db.categories.delete(id)
  const products = await db.products.where('businessId').equals(getCurrentBusinessId()).toArray()
  const cat = await db.categories.get(id)
  if (cat) {
    for (const p of products) {
      if (p.categoria === cat.name) {
        await db.products.update(p.id!, { categoria: undefined })
      }
    }
  }
}

export async function sendWhatsAppReceipt(phone: string, product: string, total: number): Promise<void> {
  const msg = `Hola! Tu compra en LionCore:%0AProducto: ${product}%0ATotal: $${total.toLocaleString('es-CO')}%0A¡Gracias por tu compra!`
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${msg}`, '_blank')
}

export async function sendWhatsAppLicense(phone: string, product: string, key: string): Promise<void> {
  const msg = `Hola! Tu licencia:%0AProducto: ${product}%0AClave: ${key}%0A¡Gracias por tu compra!`
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${msg}`, '_blank')
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