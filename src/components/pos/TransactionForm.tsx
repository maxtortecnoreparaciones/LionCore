import { useState } from 'react'
import { getStockByProduct } from '../../services/db'
import { formatCOP } from '../../utils/format'

type Mode = 'venta' | 'compra' | 'gasto' | 'produccion'

interface Item {
  id: number
  producto: string
  code?: string
  unit?: string
  cantidad: number
  precio: number
}

interface TransactionFormProps {
  mode: Mode
  onModeChange: (m: Mode) => void
  producto: string
  onProductoChange: (v: string) => void
  cantidad: number
  onCantidadChange: (v: number) => void
  precio: string
  onPrecioChange: (v: string) => void
  editingId: number | null
  items: Item[]
  total: number
  loading: boolean
  customerName: string
  onCustomerNameChange: (v: string) => void
  customerPhone: string
  onCustomerPhoneChange: (v: string) => void
  showProductionDetails: boolean
  onToggleProductionDetails: () => void
  productionMeta: { pesoEntrada: string; pesoSalida: string; desperdicio: string; tiempo: string; notas: string }
  onProductionMetaChange: (field: string, value: string) => void
  currentTpl: { unidad: string }
  licenseState: { isActivated: boolean }
  currentBusinessId: number
  availableModes: Mode[]
  onAgregar: () => void
  onActualizar: () => void
  onCancelarEdicion: () => void
  onEditar: (item: Item) => void
  onEliminar: (id: number) => void
  onGuardar: () => void
  onImprimir: () => void
  onWhatsApp: () => void
}

export default function TransactionForm({
  mode, onModeChange, producto, onProductoChange, cantidad, onCantidadChange, precio, onPrecioChange,
  editingId, items, total, loading, customerName, onCustomerNameChange, customerPhone, onCustomerPhoneChange,
  showProductionDetails, onToggleProductionDetails, productionMeta, onProductionMetaChange,
  licenseState, currentBusinessId, availableModes,
  onAgregar, onActualizar, onCancelarEdicion, onEditar, onEliminar,
  onGuardar, onImprimir, onWhatsApp,
}: TransactionFormProps) {
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productSuggestions, setProductSuggestions] = useState<{ name: string; code?: string; qr?: string; stock: number; lastPrice?: number; unit?: string; pricingMode?: string }[]>([])
  const [selectedPricingMode, setSelectedPricingMode] = useState<'UNIT' | 'WEIGHT'>('UNIT')

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAgregar()
    }
  }

  const handleProductoChange = async (value: string) => {
    onProductoChange(value)
    if (value.length > 1) {
      const stockData = await getStockByProduct()
      const q = value.toLowerCase()
      const filtered = stockData.filter(p =>
        p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q) || (p.qr || '').toLowerCase().includes(q)
      )
      setProductSuggestions(filtered.map(p => ({ name: p.name, code: p.code, qr: p.qr, stock: p.quantity, lastPrice: p.lastPrice, unit: p.unit, pricingMode: p.pricingMode })))
      setShowProductDropdown(filtered.length > 0)
    } else {
      setShowProductDropdown(false)
    }
  }

  const handleProductFocus = async () => {
    if (producto.length > 1) {
      const stockData = await getStockByProduct()
      const q = producto.toLowerCase()
      const filtered = stockData.filter(p =>
        p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q) || (p.qr || '').toLowerCase().includes(q)
      )
      setProductSuggestions(filtered.map(p => ({ name: p.name, code: p.code, qr: p.qr, stock: p.quantity, lastPrice: p.lastPrice, unit: p.unit, pricingMode: p.pricingMode })))
      setShowProductDropdown(filtered.length > 0)
    }
  }

  const handleSelectSuggestion = (p: { name: string; code?: string; qr?: string; stock: number; lastPrice?: number; unit?: string; pricingMode?: string }) => {
    onProductoChange(p.name)
    if (p.lastPrice !== undefined) onPrecioChange(String(p.lastPrice))
    setSelectedPricingMode(p.pricingMode === 'WEIGHT' ? 'WEIGHT' : 'UNIT')
    setShowProductDropdown(false)
  }

  const itemTotal = cantidad * Number(precio || 0)
  const isWeightMode = selectedPricingMode === 'WEIGHT' && !editingId

  return (
    <>
      {!licenseState.isActivated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-sm text-yellow-800 font-semibold">🔒 Modo FREE - Solo Ventas disponibles</p>
          <button
            onClick={() => {
              localStorage.removeItem('lioncore_license')
              window.location.reload()
            }}
            className="text-xs text-yellow-600 underline mt-1"
          >
            Resetear licencia
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-2">
          {availableModes.filter(m => m !== 'compra').map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold uppercase text-sm transition-all duration-200 ${
                mode === m
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={editingId ? 'Editando producto...' : 'nombre / código / QR...'}
              value={producto}
              onChange={(e) => handleProductoChange(e.target.value)}
              onFocus={handleProductFocus}
              onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
              onKeyPress={handleKeyPress}
              className={`w-full py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 ${
                editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
              } focus:border-transparent`}
            />
            {showProductDropdown && productSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {productSuggestions.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      {p.code && <span className="text-[10px] font-mono bg-blue-50 text-blue-600 rounded px-1 font-semibold">{p.code}</span>}
                      <span className="font-medium text-gray-800 text-sm flex-1 truncate">{p.name}</span>
                      <div className="text-right flex items-center gap-2 shrink-0">
                        {p.unit && <span className="text-[10px] text-gray-400">{p.unit}</span>}
                        {p.pricingMode === 'WEIGHT' && <span className="text-[9px] bg-amber-100 text-amber-700 rounded px-1 font-semibold">kg</span>}
                        <span className={`text-xs font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {p.stock}
                        </span>
                        {p.lastPrice && (
                          <span className="text-xs text-blue-600 font-medium">
                            {formatCOP(p.lastPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {mode !== 'produccion' && (
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => onCantidadChange(Math.max(0, Number(e.target.value.replace(',', '.')) || 0))}
                min={0}
                onKeyPress={handleKeyPress}
                className={`w-20 py-3 px-3 text-center border rounded-lg focus:outline-none focus:ring-2 ${
                  editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                } focus:border-transparent`}
              />
              {isWeightMode && <span className="absolute -top-2 -right-2 text-[9px] bg-blue-100 text-blue-600 rounded-full px-1 font-bold">kg</span>}
            </div>
          )}
          <div className="relative">
            <input
              type="number"
              placeholder={mode === 'produccion' ? 'Costo materia prima' : 'Precio'}
              value={precio}
              onChange={(e) => onPrecioChange(e.target.value.replace(',', '.'))}
              onKeyPress={handleKeyPress}
              min={0}
              className={`w-28 py-3 px-3 text-right border rounded-lg focus:outline-none focus:ring-2 ${
                editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
              } focus:border-transparent`}
            />
            {isWeightMode && <span className="absolute -top-2 -right-2 text-[9px] bg-amber-100 text-amber-700 rounded-full px-1 font-bold">$/kg</span>}
          </div>
          {isWeightMode && (
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              <span className="whitespace-nowrap">→ <strong className="text-blue-600">{formatCOP(itemTotal)}</strong></span>
            </div>
          )}
          <button
            onClick={editingId ? onActualizar : onAgregar}
            className={`py-3 px-6 font-semibold rounded-lg transition-colors duration-200 ${
              editingId
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {editingId ? '✏️ Actualizar' : '+ Agregar'}
          </button>
          {editingId && (
            <button
              onClick={onCancelarEdicion}
              className="py-3 px-4 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {mode === 'produccion' && items.length > 0 && (
        <div className="bg-purple-50 rounded-xl shadow-md p-4">
          <h3 className="text-purple-700 font-semibold mb-2">💡 Costo Calculado</h3>
          <div className="text-sm text-purple-600 space-y-1">
            <p>Materiales: {formatCOP(total)}</p>
            <p className="text-xs text-purple-500">El precio de venta se calculará con los costos configurados</p>
          </div>
        </div>
      )}

      {mode === 'produccion' && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <button
            onClick={onToggleProductionDetails}
            className="text-blue-600 font-semibold text-sm flex items-center gap-2"
          >
            {showProductionDetails ? '▼ Ocultar detalles' : '+ Ver más detalles'}
          </button>

          {showProductionDetails && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso entrada (kg)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productionMeta.pesoEntrada}
                    onChange={(e) => onProductionMetaChange('pesoEntrada', e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso salida (kg)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productionMeta.pesoSalida}
                    onChange={(e) => onProductionMetaChange('pesoSalida', e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desperdicio (kg)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productionMeta.desperdicio}
                    onChange={(e) => onProductionMetaChange('desperdicio', e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tiempo (min)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productionMeta.tiempo}
                    onChange={(e) => onProductionMetaChange('tiempo', e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Notas</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={productionMeta.notas || ''}
                    onChange={(e) => onProductionMetaChange('notas', e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500 uppercase">
              <th className="py-2 px-3 text-xs">Producto</th>
              <th className="py-2 px-2 text-center w-16 text-xs">Cant.</th>
              <th className="py-2 px-2 text-right w-24 text-xs">Precio</th>
              <th className="py-2 px-2 text-right w-28 text-xs">Subtotal</th>
              <th className="py-2 px-2 text-center w-20 text-xs">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Sin productos agregados
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t border-gray-100 ${
                    editingId === item.id ? 'bg-yellow-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      {item.code && <span className="text-[10px] font-mono bg-gray-100 text-gray-500 rounded px-1 leading-tight">{item.code}</span>}
                      <span className="text-xs font-medium text-gray-800 truncate">{item.producto}</span>
                    </div>
                    {item.unit && <span className="text-[10px] text-gray-400 ml-1">{item.unit}</span>}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600 text-sm">x{item.cantidad}</td>
                  <td className="py-2 px-2 text-right text-gray-600 text-sm">{formatCOP(item.precio)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-800 text-sm">
                    {formatCOP(item.cantidad * item.precio)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onEditar(item)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onEliminar(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Total</h2>
          <h2 className="text-3xl font-bold text-blue-600">{formatCOP(total)}</h2>
        </div>
      </div>

      {mode === 'venta' && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <label className="text-sm font-semibold text-blue-700 mb-2 block">📱 WhatsApp Cliente</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre (opcional)"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="flex-1 py-2 px-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="tel"
              placeholder="3138777115"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              className="w-32 py-2 px-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {mode === 'venta' && (
          <button
            onClick={async () => {
              if (items.length === 0) return
              await onWhatsApp()
            }}
            disabled={items.length === 0 || loading}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
              items.length === 0 || loading
                ? 'bg-green-300 text-green-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            📱 WhatsApp
          </button>
        )}
        {mode === 'venta' && (
          <button
            onClick={onImprimir}
            disabled={items.length === 0 || loading}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
              items.length === 0 || loading
                ? 'bg-purple-300 text-purple-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            Imprimir Factura
          </button>
        )}
        <button
          onClick={onGuardar}
          disabled={items.length === 0 || loading}
          className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
            items.length === 0 || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Guardando...' : 'Guardar transacción'}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">Negocio ID: {currentBusinessId}</p>
    </>
  )
}
