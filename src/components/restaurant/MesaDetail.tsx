import { Mesa } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface MesaDetailProps {
  mesa: Mesa
  onBack: () => void
  onRemoveItem: (mesaId: number, idx: number) => void
  onAddProduct: () => void
  onCobrar: () => void
  onSolicitarCuenta: (mesaId: number) => void
  onWhatsApp: (mesa: Mesa) => void
  onMover: () => void
}

const MesaDetail: React.FC<MesaDetailProps> = ({ mesa, onBack, onRemoveItem, onAddProduct, onCobrar, onSolicitarCuenta, onWhatsApp, onMover }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">{mesa.name}</h3>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
        >
          ← Volver a mesas
        </button>
      </div>

      {mesa.orderItems.length > 0 ? (
        <div className="space-y-2 mb-4">
          {mesa.orderItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">{item.quantity} × {formatCOP(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm">{formatCOP(item.subtotal)}</p>
                <button
                  onClick={() => onRemoveItem(mesa.id!, idx)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-4">Sin productos</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onAddProduct}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          + Agregar producto
        </button>
        {mesa.orderItems.length > 0 && (
          <button
            onClick={onCobrar}
            className="py-3 px-6 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
          >
            💰 Cobrar {formatCOP(mesa.total)}
          </button>
        )}
      </div>
      {mesa.orderItems.length > 0 && (
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onSolicitarCuenta(mesa.id!)}
            className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
          >
            🧾 Pedir cuenta
          </button>
          <button
            onClick={() => onWhatsApp(mesa)}
            className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            📤 WhatsApp
          </button>
          <button
            onClick={onMover}
            className="flex-1 py-2 px-3 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700"
          >
            🔀 Mover
          </button>
        </div>
      )}
    </div>
  )
}

export default MesaDetail
