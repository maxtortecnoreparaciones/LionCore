import { Warehouse } from '../../services/db'

interface TransferStockModalProps {
  show: boolean
  transferFrom: number | ''
  transferTo: number | ''
  transferProduct: string
  transferQty: string
  warehouses: Warehouse[]
  onFromChange: (v: number | '') => void
  onToChange: (v: number | '') => void
  onProductChange: (v: string) => void
  onQtyChange: (v: string) => void
  onTransfer: () => void
  onClose: () => void
}

export default function TransferStockModal({
  transferFrom,
  transferTo,
  transferProduct,
  transferQty,
  warehouses,
  onFromChange,
  onToChange,
  onProductChange,
  onQtyChange,
  onTransfer,
  onClose,
}: TransferStockModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Transferir Stock</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Desde</label>
              <select
                value={transferFrom}
                onChange={(e) => onFromChange(Number(e.target.value) || '')}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar bodega...</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Hacia</label>
              <select
                value={transferTo}
                onChange={(e) => onToChange(Number(e.target.value) || '')}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar bodega...</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Producto</label>
              <input
                type="text"
                value={transferProduct}
                onChange={(e) => onProductChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cantidad</label>
              <input
                type="number"
                value={transferQty}
                onChange={(e) => onQtyChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onTransfer}
            className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
          >
            Transferir
          </button>
        </div>
      </div>
    </div>
  )
}
