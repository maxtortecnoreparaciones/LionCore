interface WasteModalProps {
  show: boolean
  wasteProduct: string
  wasteQty: string
  wasteReason: string
  inventory: { name: string; quantity: number }[]
  onProductChange: (v: string) => void
  onQtyChange: (v: string) => void
  onReasonChange: (v: string) => void
  onRegister: () => void
  onClose: () => void
}

export default function WasteModal({
  wasteProduct,
  wasteQty,
  wasteReason,
  inventory,
  onProductChange,
  onQtyChange,
  onReasonChange,
  onRegister,
  onClose,
}: WasteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">🗑️ Registrar Merma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              value={wasteProduct}
              onChange={e => onProductChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Seleccionar...</option>
              {inventory.map(p => (
                <option key={p.name} value={p.name}>{p.name} (Stock: {p.quantity} kg)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad perdida (kg)</label>
            <input
              type="number"
              value={wasteQty}
              onChange={e => onQtyChange(e.target.value)}
              placeholder="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              value={wasteReason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder="Daño, vencimiento, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
              onClick={onRegister}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
            >
              Registrar Merma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
