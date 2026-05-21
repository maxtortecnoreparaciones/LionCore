interface EditProductModalProps {
  show: boolean
  editProductName: string
  editProductPrice: string
  editProductCost: string
  editProductStock: string
  onNameChange: (v: string) => void
  onPriceChange: (v: string) => void
  onCostChange: (v: string) => void
  onStockChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}

export default function EditProductModal({
  editProductName,
  editProductPrice,
  editProductCost,
  editProductStock,
  onNameChange,
  onPriceChange,
  onCostChange,
  onStockChange,
  onSave,
  onClose,
}: EditProductModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">✏️ Editar Producto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
            <input
              type="text"
              value={editProductName}
              onChange={e => onNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && onSave()}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta</label>
              <input
                type="number"
                value={editProductPrice}
                onChange={e => onPriceChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={e => e.key === 'Enter' && onSave()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
              <input
                type="number"
                value={editProductCost}
                onChange={e => onCostChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={e => e.key === 'Enter' && onSave()}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
            <input
              type="number"
              value={editProductStock}
              onChange={e => onStockChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && onSave()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
