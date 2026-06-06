import { useState } from 'react'
import { formatCOP } from '../../utils/format'

interface InventoryItem {
  id?: number
  code?: string
  qr?: string
  name: string
  proveedor?: string
  categoria?: string
  modelo?: string
  color?: string
  ubicacion?: string
  subUbicacion?: string
  quantity: number
  totalProduced: number
  totalSold: number
  totalPurchased?: number
  totalAdjusted?: number
  lastPrice?: number
  cost?: number
  unit?: string
  pricingMode?: string
}

interface InlineEditField {
  productId: number
  field: 'stock' | 'price' | 'cost'
  value: string
}

interface InventoryViewProps {
  show: boolean
  inventory: InventoryItem[]
  inventorySearch: string
  onSearchChange: (v: string) => void
  invConfig: { lowStockAlert: boolean; lowStockThreshold: number; sellWithoutStock: boolean; allowNegative: boolean }
  inlineEditField: InlineEditField | null
  onInlineEditStart: (field: InlineEditField) => void
  onInlineEditChange: (field: InlineEditField) => void
  onInlineSave: (index: number) => void
  onSelectProduct: (name: string) => void
  onSetLastPrice: (price: string) => void
  onPurchase: (name: string) => void
  onAdjust: (name: string) => void
  onEdit: (name: string) => void
  onDelete: (name: string) => void
  canPurchase: boolean
  canAdjust: boolean
  onQuickAdd?: () => void
  onGenerateVariants?: () => void
}

function qtyColorClass(qty: number): string {
  if (qty < 0) return 'border-gray-900 bg-gray-50'
  if (qty < 5) return 'border-red-400 bg-red-50/30'
  if (qty <= 10) return 'border-amber-400 bg-amber-50/30'
  return 'border-emerald-400 bg-emerald-50/30'
}

function qtyBorderClass(qty: number): string {
  if (qty < 0) return 'border-l-gray-900'
  if (qty < 5) return 'border-l-red-400'
  if (qty <= 10) return 'border-l-amber-400'
  return 'border-l-emerald-400'
}

function qtyBadgeClass(qty: number): string {
  if (qty < 0) return 'bg-gray-900 text-white'
  if (qty < 5) return 'bg-red-500 text-white'
  if (qty <= 10) return 'bg-amber-500 text-white'
  return 'bg-emerald-500 text-white'
}

function marginPct(item: InventoryItem): number | null {
  if (!item.cost || item.cost <= 0 || !item.lastPrice || item.lastPrice <= 0) return null
  return ((item.lastPrice - item.cost) / item.cost) * 100
}

function profitIcon(margin: number | null): string {
  if (margin === null) return ''
  if (margin > 50) return '💰'
  if (margin >= 20) return '🟡'
  return '🔴'
}

export default function InventoryView(props: InventoryViewProps) {
  const { show, inventory, inventorySearch, onSearchChange, invConfig,
    onSelectProduct, onSetLastPrice, onPurchase, onAdjust, onEdit, onDelete,
    canPurchase, canAdjust, onQuickAdd, onGenerateVariants } = props
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  if (!show) return null

  const q = inventorySearch.toLowerCase()
  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(q) ||
    (i.code || '').toLowerCase().includes(q) ||
    (i.qr || '').toLowerCase().includes(q) ||
    (i.proveedor || '').toLowerCase().includes(q) ||
    (i.categoria || '').toLowerCase().includes(q) ||
    (i.modelo || '').toLowerCase().includes(q) ||
    (i.color || '').toLowerCase().includes(q) ||
    (i.ubicacion || '').toLowerCase().includes(q) ||
    (i.subUbicacion || '').toLowerCase().includes(q)
  )

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800">Inventario</h2>
            <p className="text-[11px] text-gray-500">{inventory.length} productos · {filtered.length} filtrados</p>
          </div>
          <div className="flex gap-1">
            {onQuickAdd && (
              <button onClick={onQuickAdd}
                className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold hover:bg-emerald-200 whitespace-nowrap">
                ⚡ Express
              </button>
            )}
            {onGenerateVariants && (
              <button onClick={onGenerateVariants}
                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold hover:bg-purple-200 whitespace-nowrap">
                🧬 Variantes
              </button>
            )}
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 rounded text-[10px] font-semibold ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >□ Cards</button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-[10px] font-semibold ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >☰ Tabla</button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="nombre / código / modelo / color / ubicación..."
              value={inventorySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 py-1.5 px-2 pl-7 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm mb-1">
            {inventorySearch ? 'No se encontraron productos' : 'No hay productos en inventario'}
          </p>
          <p className="text-gray-400 text-[11px]">Usa ⚡ Express o 🧬 Variantes para crear productos rápido</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
              <tr>
                <th className="py-2 px-2 text-left">Código</th>
                <th className="py-2 px-2 text-left">Producto</th>
                <th className="py-2 px-2 text-left">Modelo</th>
                <th className="py-2 px-2 text-left">Color</th>
                <th className="py-2 px-2 text-left">Stock</th>
                <th className="py-2 px-2 text-left">Ubicación</th>
                <th className="py-2 px-2 text-right">Costo</th>
                <th className="py-2 px-2 text-right">Venta</th>
                <th className="py-2 px-2 text-center">Margen</th>
                <th className="py-2 px-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const margin = marginPct(item)
                return (
                  <tr key={index} className={`border-t border-gray-100 border-l-4 ${qtyBorderClass(item.quantity)}`}>
                    <td className="py-1.5 px-2 font-mono text-gray-500">{item.code || '—'}</td>
                    <td className="py-1.5 px-2 font-medium text-gray-800">{item.name}</td>
                    <td className="py-1.5 px-2 text-gray-500 text-[10px]">{item.modelo || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-500 text-[10px]">{item.color || '—'}</td>
                    <td className="py-1.5 px-2 text-right font-semibold">
                      <span className={`px-1.5 py-0.5 rounded ${qtyBadgeClass(item.quantity)}`}>{item.quantity}</span>
                    </td>
                    <td className="py-1.5 px-2 text-gray-500 text-[10px]">
                      {item.ubicacion ? <span className="font-medium">📍{item.ubicacion}{item.subUbicacion ? ` › ${item.subUbicacion}` : ''}</span> : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-600">{item.cost ? formatCOP(item.cost) + (item.pricingMode === 'WEIGHT' ? '/kg' : '') : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-blue-600 font-semibold">{item.lastPrice ? formatCOP(item.lastPrice) + (item.pricingMode === 'WEIGHT' ? '/kg' : '') : '—'}</td>
                    <td className="py-1.5 px-2 text-center">
                      {margin !== null ? (
                        <span className={`text-[10px] font-semibold ${margin > 50 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                          {profitIcon(margin)} {margin.toFixed(0)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button onClick={() => onEdit(item.name)} className="text-blue-500 hover:text-blue-700 text-xs" title="Editar">✏️</button>
                      <button onClick={() => { if (confirm(`¿Eliminar "${item.name}"?`)) onDelete(item.name) }} className="text-red-400 hover:text-red-600 text-xs ml-1" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filtered.map((item, index) => {
              const margin = marginPct(item)
              return (
                <div
                  key={index}
                  className={`border-l-4 rounded-lg p-2.5 hover:shadow-md transition-all duration-150 cursor-pointer ${qtyColorClass(item.quantity)}`}
                  onClick={() => { onSelectProduct(item.name); if (item.lastPrice !== undefined) onSetLastPrice(String(item.lastPrice)) }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      {item.code && (
                        <div className="text-[9px] font-mono text-gray-400 leading-tight">{item.code}</div>
                      )}
                      <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight" title={item.name}>{item.name}</div>
                      {(item.modelo || item.color) && (
                        <div className="text-[8px] text-gray-400 leading-tight truncate">
                          {item.modelo && <span>{item.modelo}</span>}
                          {item.modelo && item.color && <span> · </span>}
                          {item.color && <span>🎨 {item.color}</span>}
                        </div>
                      )}
                      {item.ubicacion && (
                        <div className="text-[8px] text-gray-400 leading-tight truncate">
                          📍 {item.ubicacion}{item.subUbicacion ? ` › ${item.subUbicacion}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {(() => { const icon = profitIcon(margin); return icon ? <span className="text-[10px]">{icon}</span> : null })()}
                      {invConfig.lowStockAlert && item.quantity <= invConfig.lowStockThreshold && item.quantity > 0 && (
                        <span className="text-[10px]" title="Stock bajo">⚠️</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-400">Stock</span>
                      <span className={`text-xs font-bold px-1 rounded ${qtyBadgeClass(item.quantity)}`}>
                        {item.quantity} <span className="text-[9px] font-normal">{item.unit || ''}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-400">Costo</span>
                      <span className="text-gray-600">{item.cost ? formatCOP(item.cost) + (item.pricingMode === 'WEIGHT' ? '/kg' : '') : '—'}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-400">Venta</span>
                      <span className="text-blue-600 font-medium">{item.lastPrice ? formatCOP(item.lastPrice) + (item.pricingMode === 'WEIGHT' ? '/kg' : '') : '—'}</span>
                    </div>
                    {margin !== null && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Margen</span>
                        <span className={`font-semibold ${margin > 50 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                          {margin.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {item.quantity < 0 && (
                    <div className="mt-1 text-[8px] text-red-600 font-semibold text-center bg-red-50 rounded">⚠️ Stock negativo</div>
                  )}

                  <div className="flex gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onPurchase(item.name)} disabled={!canPurchase}
                      className={`flex-1 py-1 rounded text-[9px] font-medium ${!canPurchase ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      +Compra
                    </button>
                    <button onClick={() => onAdjust(item.name)} disabled={!canAdjust}
                      className={`flex-1 py-1 rounded text-[9px] font-medium ${!canAdjust ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                      Ajustar
                    </button>
                    <button onClick={() => onEdit(item.name)}
                      className="py-1 px-1.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium hover:bg-blue-200" title="Editar">
                      ✏️
                    </button>
                    <button onClick={() => { if (confirm(`¿Eliminar "${item.name}"?`)) onDelete(item.name) }}
                      className="py-1 px-1.5 bg-red-100 text-red-600 rounded text-[9px] font-medium hover:bg-red-200" title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
