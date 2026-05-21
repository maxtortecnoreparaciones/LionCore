import { formatCOP } from '../../utils/format'

interface InventoryItem {
  name: string
  quantity: number
  totalProduced: number
  totalSold: number
  lastPrice?: number
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
  unidad: string
  onSelectProduct: (name: string) => void
  onSetLastPrice: (price: string) => void
  onPurchase: (name: string) => void
  onAdjust: (name: string) => void
  onEdit: (name: string) => void
  canPurchase: boolean
  canAdjust: boolean
}

export default function InventoryView({
  show,
  inventory,
  inventorySearch,
  onSearchChange,
  invConfig,
  inlineEditField,
  onInlineEditStart,
  onInlineEditChange,
  onInlineSave,
  unidad,
  onSelectProduct,
  onSetLastPrice,
  onPurchase,
  onAdjust,
  onEdit,
  canPurchase,
  canAdjust,
}: InventoryViewProps) {
  if (!show) return null

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(inventorySearch.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
            <p className="text-sm text-gray-500">{inventory.length} productos</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={inventorySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 py-2 px-4 pl-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">
            {inventorySearch ? 'No se encontraron productos' : 'No hay productos en inventario'}
          </p>
          <p className="text-gray-400 text-sm">Registra producciones para ver el inventario</p>
        </div>
      ) : (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className="font-bold text-gray-800 text-sm truncate flex-1 cursor-pointer"
                    title={item.name}
                    onClick={() => {
                      onSelectProduct(item.name)
                      if (item.lastPrice) onSetLastPrice(String(item.lastPrice))
                    }}
                  >
                    {item.name}
                  </h3>
                  <div className="flex gap-1 ml-2">
                    {invConfig.lowStockAlert && item.quantity <= invConfig.lowStockThreshold && item.quantity > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700" title="Stock bajo">⚠️</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {item.quantity > 0 ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Stock</span>
                    {inlineEditField?.productId === index && inlineEditField?.field === 'stock' ? (
                      <input
                        type="number"
                        value={inlineEditField.value}
                        onChange={e => onInlineEditChange({ ...inlineEditField, value: e.target.value })}
                        onBlur={() => onInlineSave(index)}
                        onKeyDown={e => e.key === 'Enter' && onInlineSave(index)}
                        className="w-20 px-2 py-0.5 text-right text-lg font-bold border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`text-lg font-bold cursor-pointer hover:bg-blue-50 rounded px-1 ${item.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}
                        onClick={() => onInlineEditStart({ productId: index, field: 'stock', value: String(item.quantity) })}
                        title="Click para editar"
                      >
                        {item.quantity}
                      </span>
                    )}
                  </div>
                  {unidad === 'kg' && item.quantity > 0 && (
                    <div className="text-xs text-gray-400 text-right">{unidad}</div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Precio</span>
                    {inlineEditField?.productId === index && inlineEditField?.field === 'price' ? (
                      <input
                        type="number"
                        value={inlineEditField.value}
                        onChange={e => onInlineEditChange({ ...inlineEditField, value: e.target.value })}
                        onBlur={() => onInlineSave(index)}
                        onKeyDown={e => e.key === 'Enter' && onInlineSave(index)}
                        className="w-24 px-2 py-0.5 text-right text-sm font-semibold border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm font-semibold text-blue-600 cursor-pointer hover:bg-blue-50 rounded px-1"
                        onClick={() => onInlineEditStart({ productId: index, field: 'price', value: String(item.lastPrice || 0) })}
                        title="Click para editar"
                      >
                        {item.lastPrice ? formatCOP(item.lastPrice) : '—'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>📦 {item.totalProduced || 0}</span>
                    <span>💰 {item.totalSold || 0}</span>
                  </div>
                </div>

                {item.quantity < 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-xs text-red-600 font-semibold">⚠️ Stock negativo</p>
                    <p className="text-xs text-red-500 mt-1">Ajusta o registra compra</p>
                  </div>
                )}

                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => onPurchase(item.name)}
                    disabled={!canPurchase}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !canPurchase ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    + Compra
                  </button>
                  <button
                    onClick={() => onAdjust(item.name)}
                    disabled={!canAdjust}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !canAdjust ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    Ajustar
                  </button>
                  <button
                    onClick={() => onEdit(item.name)}
                    className="flex-1 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
