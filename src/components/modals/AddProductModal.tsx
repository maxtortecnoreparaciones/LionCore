import { PRODUCT_UNITS, isWeightUnit, getUnitLabel } from '../../services/db'

interface AddProductModalProps {
  show: boolean
  newProductName: string
  newProductPrice: string
  newProductCost: string
  newProductStock: string
  newProductUnit: string
  newProductPricingMode: string
  newProductProveedor: string
  newProductCategoria: string
  newProductMargin: string
  onNameChange: (v: string) => void
  onPriceChange: (v: string) => void
  onCostChange: (v: string) => void
  onStockChange: (v: string) => void
  onUnitChange: (v: string) => void
  onPricingModeChange: (v: string) => void
  onProveedorChange: (v: string) => void
  onCategoriaChange: (v: string) => void
  onMarginChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}

export default function AddProductModal({
  newProductName,
  newProductPrice,
  newProductCost,
  newProductStock,
  newProductUnit,
  newProductPricingMode,
  newProductProveedor,
  newProductCategoria,
  newProductMargin,
  onNameChange,
  onPriceChange,
  onCostChange,
  onStockChange,
  onUnitChange,
  onPricingModeChange,
  onProveedorChange,
  onCategoriaChange,
  onMarginChange,
  onSave,
  onClose,
}: AddProductModalProps) {
  const isWeight = isWeightUnit(newProductUnit) && newProductPricingMode === 'WEIGHT'
  const unitLabel = isWeight ? 'kg' : newProductUnit || 'unidad'
  const qty = Number(newProductStock) || 0
  const totalCost = Number(newProductCost) || 0
  const costPerUnit = qty > 0 ? totalCost / qty : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[90] p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">📦 Agregar Producto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 pt-4 pb-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
              <input
                type="text"
                value={newProductName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Ej: Papa"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <select
                  value={newProductUnit}
                  onChange={e => onUnitChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {PRODUCT_UNITS.map(u => (
                    <option key={u} value={u}>{getUnitLabel(u)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta por {unitLabel}</label>
                <input
                  type="number"
                  value={newProductPrice}
                  onChange={e => onPriceChange(e.target.value)}
                  placeholder="$0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={newProductProveedor}
                  onChange={e => onProveedorChange(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={newProductCategoria}
                  onChange={e => onCategoriaChange(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo precio</label>
                <select
                  value={newProductPricingMode}
                  onChange={e => onPricingModeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="UNIT">Unidad</option>
                  <option value="WEIGHT">Por peso (kg)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen %</label>
                <input
                  type="number"
                  value={newProductMargin}
                  onChange={e => onMarginChange(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                {newProductPricingMode === 'WEIGHT' && costPerUnit > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    → ${(costPerUnit * (1 + Number(newProductMargin || 0) / 100)).toFixed(0)}/kg
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">🛒 ¿Compraste este producto?</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={e => onStockChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Costo total</label>
                  <input
                    type="number"
                    value={newProductCost}
                    onChange={e => onCostChange(e.target.value)}
                    placeholder="$0"
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
              </div>
              {qty > 0 && totalCost > 0 && (
                <div className="mt-3 text-xs text-blue-700 bg-white rounded-lg px-3 py-2 border border-blue-100">
                  Costo por {unitLabel}: <strong>${costPerUnit.toLocaleString('es-CO')}</strong>
                  {costPerUnit > 0 && Number(newProductPrice) > 0 && (
                    <span className="ml-2">
                      | Ganancia: <strong className="text-green-600">{((Number(newProductPrice) - costPerUnit) / costPerUnit * 100).toFixed(0)}%</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 pt-3 border-t border-gray-100 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 text-base"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 text-base shadow-lg shadow-blue-600/30"
            >
              Guardar Producto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
