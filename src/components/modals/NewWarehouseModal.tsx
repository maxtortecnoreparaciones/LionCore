interface NewWarehouseModalProps {
  show: boolean
  newWarehouseName: string
  newWarehouseAddress: string
  onNameChange: (v: string) => void
  onAddressChange: (v: string) => void
  onCreate: () => void
  onClose: () => void
}

export default function NewWarehouseModal({
  newWarehouseName,
  newWarehouseAddress,
  onNameChange,
  onAddressChange,
  onCreate,
  onClose,
}: NewWarehouseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Nueva Bodega</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                value={newWarehouseName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Principal, Sucursal Norte..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección (opcional)</label>
              <input
                type="text"
                value={newWarehouseAddress}
                onChange={(e) => onAddressChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle 123 #45-67"
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
            onClick={onCreate}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            Crear Bodega
          </button>
        </div>
      </div>
    </div>
  )
}
