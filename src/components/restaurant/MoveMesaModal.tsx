import { Mesa } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface MoveMesaModalProps {
  show: boolean
  selectedMesa: Mesa | null
  mesas: Mesa[]
  targetMesaId: number | null
  onSelectTarget: (id: number) => void
  onConfirm: () => void
  onClose: () => void
}

const MoveMesaModal: React.FC<MoveMesaModalProps> = ({ show, selectedMesa, mesas, targetMesaId, onSelectTarget, onConfirm, onClose }) => {
  if (!show || !selectedMesa) return null

  const availableMesas = mesas.filter(m => m.id !== selectedMesa.id && m.status !== 'disponible')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔀 Mover pedido de {selectedMesa.name}</h2>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableMesas.map(mesa => (
            <button
              key={mesa.id}
              onClick={() => onSelectTarget(mesa.id!)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                targetMesaId === mesa.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{mesa.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{mesa.status} · {mesa.orderItems.length} items</p>
                </div>
                <p className="text-sm font-bold">{formatCOP(mesa.total)}</p>
              </div>
            </button>
          ))}
          {availableMesas.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No hay otras mesas ocupadas</p>
          )}
        </div>

        {targetMesaId && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">
              ¿Mover todos los items de <strong>{selectedMesa.name}</strong> a <strong>{mesas.find(m => m.id === targetMesaId)?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                ✅ Confirmar mover
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MoveMesaModal
