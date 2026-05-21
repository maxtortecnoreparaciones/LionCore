interface InvAdjustModalProps {
  show: boolean
  product: string
  qty: number
  reason: string
  onProductChange: (v: string) => void
  onQtyChange: (v: number) => void
  onReasonChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}

export default function InvAdjustModal({
  product,
  qty,
  reason,
  onProductChange,
  onQtyChange,
  onReasonChange,
  onSubmit,
  onClose,
}: InvAdjustModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
        >
          ✕
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📦</div>
          <h2 className="text-2xl font-bold text-gray-800">Ajustar Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">Ajusta tu inventario sin complicaciones</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
            <input
              type="text"
              value={product}
              onChange={(e) => onProductChange(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (+ o -)</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => onQtyChange(Number(e.target.value))}
              placeholder="Ej: 10 o -5"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
            <select
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="ajuste">Ajuste de inventario</option>
              <option value="perdida">Pérdida / Merma</option>
              <option value="robo">Robo</option>
              <option value="entrada">Entrada manual</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <button
            onClick={onSubmit}
            disabled={!product || qty === 0 || !reason}
            className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Guardar Ajuste
          </button>
        </div>
      </div>
    </div>
  )
}
