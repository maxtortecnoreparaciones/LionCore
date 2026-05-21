interface ServiceOrderModalProps {
  show: boolean
  serviceClientName: string
  serviceClientPhone: string
  serviceDevice: string
  serviceProblem: string
  serviceCost: string
  servicePrice: string
  onClientNameChange: (v: string) => void
  onClientPhoneChange: (v: string) => void
  onDeviceChange: (v: string) => void
  onProblemChange: (v: string) => void
  onCostChange: (v: string) => void
  onPriceChange: (v: string) => void
  onCreate: () => void
  onClose: () => void
}

export default function ServiceOrderModal({
  serviceClientName,
  serviceClientPhone,
  serviceDevice,
  serviceProblem,
  serviceCost,
  servicePrice,
  onClientNameChange,
  onClientPhoneChange,
  onDeviceChange,
  onProblemChange,
  onCostChange,
  onPriceChange,
  onCreate,
  onClose,
}: ServiceOrderModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Nueva Orden de Servicio</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre del Cliente *</label>
              <input
                type="text"
                value={serviceClientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan Perez"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                value={serviceClientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3138777115"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Equipo *</label>
              <input
                type="text"
                value={serviceDevice}
                onChange={(e) => onDeviceChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Laptop HP Pavilion"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Problema *</label>
              <textarea
                value={serviceProblem}
                onChange={(e) => onProblemChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="No enciende, pantalla azul..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Costo estimado</label>
                <input
                  type="number"
                  value={serviceCost}
                  onChange={(e) => onCostChange(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Precio venta</label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="150000"
                />
              </div>
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
            Crear Orden
          </button>
        </div>
      </div>
    </div>
  )
}
