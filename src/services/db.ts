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
  type: 'venta' | 'compra' | 'gasto'
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
}

// ==================== BASE DE DATOS ====================

class LionCoreDB extends Dexie {
  businesses!: Table<Business, number>
  products!: Table<Product, number>
  transactions!: Table<Transaction, number>
  transaction_items!: Table<TransactionItem, number>

  constructor() {
    super('LionCoreDB')

    this.version(1).stores({
      businesses: '++id, name',
      products: '++id, businessId, name',
      transactions: '++id, businessId, type, date',
      transaction_items: '++id, transactionId',
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
  type: 'venta' | 'compra' | 'gasto',
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
  type?: 'venta' | 'compra' | 'gasto'
): Promise<Transaction[]> {
  const query = db.transactions.where('businessId').equals(getCurrentBusinessId())
  
  if (type) {
    return query.filter(t => t.type === type).toArray()
  }
  
  return query.toArray()
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