import { useState } from 'react'
import { Product, db, generateNextProductCode, getDefaultUnit } from '../../services/db'
import { formatCOP } from '../../utils/format'
import SearchResults from './SearchResults'
import FavoritesBar from './FavoritesBar'

interface CartItem {
  product: Product
  quantity: number
}

interface ModernPOSProps {
  businessId: number
  businessType: string
  onCheckout: (items: { product: Product; quantity: number }[]) => void
  onShowInventory: () => void
  onShowCustomers: () => void
  onQuickAddProduct?: () => void
}

export default function ModernPOS({ businessId, businessType, onCheckout }: ModernPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPrice, setQuickPrice] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const addProduct = (p: Product) => {
    setCart(prev => {
      const exist = prev.find(i => i.product.id === p.id)
      if (exist) return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product: p, quantity: 1 }]
    })
  }

  const handleQuickAdd = async () => {
    if (!quickName.trim() || !quickPrice || Number(quickPrice) <= 0) return
    setQuickSaving(true)
    try {
      const code = await generateNextProductCode(businessId, businessType as any)
      const unit = getDefaultUnit(businessType as any)
      const id = await db.products.add({
        businessId,
        code,
        name: quickName.trim(),
        price: Number(quickPrice),
        stock: 0,
        unidad: unit,
        pricingMode: 'UNIT',
        createdAt: new Date(),
      })
      const newProduct: Product = { id, businessId, name: quickName.trim(), price: Number(quickPrice), stock: 0, unidad: unit, createdAt: new Date() }
      addProduct(newProduct)
      setQuickName('')
      setQuickPrice('')
      setShowQuickForm(false)
    } finally {
      setQuickSaving(false)
    }
  }

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product.id !== id)); return }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i))
  }

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 pb-0 flex items-center gap-2">
        <div className="flex-1">
          <SearchResults onSelectProduct={addProduct} autoFocus placeholder="🔍 Buscar producto o escanear código..." />
        </div>
        <button onClick={() => setShowQuickForm(true)}
          className="shrink-0 w-11 h-11 flex items-center justify-center bg-lion text-white rounded-xl text-xl font-bold hover:bg-lion-dark active:scale-90 transition-all shadow-md"
          title="Agregar producto rápido">
          +
        </button>
      </div>

      {/* Quick add inline form */}
      {showQuickForm && (
        <div className="mx-3 mt-2 p-3 bg-white rounded-xl border-2 border-lion/30 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-700 shrink-0">📦 Nuevo producto</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={quickName} onChange={e => setQuickName(e.target.value)}
              placeholder="Nombre del producto" autoFocus
              className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-lion focus:ring-2 focus:ring-lion/20" />
            <input type="number" value={quickPrice} onChange={e => setQuickPrice(e.target.value)}
              placeholder="Precio" min="0" step="100"
              className="w-28 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-lion focus:ring-2 focus:ring-lion/20 text-right" />
            <button onClick={handleQuickAdd} disabled={quickSaving || !quickName.trim() || !quickPrice}
              className="px-4 py-2 bg-lion text-white rounded-lg text-sm font-bold hover:bg-lion-dark disabled:opacity-40 active:scale-95 transition-all">
              {quickSaving ? '...' : 'Agregar'}
            </button>
            <button onClick={() => setShowQuickForm(false)}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left: Favorites */}
        <div className="lg:w-1/2 p-3 overflow-y-auto">
          <FavoritesBar businessId={businessId} onSelectProduct={addProduct} />
          {/* Quick category chips */}
          {cart.length === 0 && (
            <div className="mt-3 text-center text-gray-400 text-sm py-8">
              <p className="text-4xl mb-2">🛒</p>
              <p>Busca un producto o toca una tarjeta para empezar</p>
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="lg:w-1/2 p-3 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {cart.map(item => (
              <div key={item.product.id}
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{formatCOP(item.product.price)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id!, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 active:scale-90 transition-all">−</button>
                  <span className="w-8 text-center font-bold text-base">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id!, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-lion/10 text-lion font-bold text-lg hover:bg-lion/20 active:scale-90 transition-all">+</button>
                </div>
                <p className="w-20 text-right font-bold text-gray-800">{formatCOP(item.product.price * item.quantity)}</p>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center text-gray-300 py-12">
                <p className="text-5xl mb-3">🛒</p>
                <p className="text-sm">Venta vacía</p>
              </div>
            )}
          </div>

          {/* Total + Checkout */}
          {cart.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-500">{cart.length} producto(s)</span>
                <span className="text-2xl font-bold text-gray-900">{formatCOP(total)}</span>
              </div>
              <button onClick={() => onCheckout(cart)}
                className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-500/30">
                💰 Cobrar {formatCOP(total)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
