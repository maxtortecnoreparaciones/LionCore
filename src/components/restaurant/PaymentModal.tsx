import { formatCOP } from '../../utils/format'

interface PaymentModalProps {
  show: boolean
  mesaName: string
  total: number
  paymentMethod: string
  onSelectMethod: (m: string) => void
  onConfirm: () => void
  onClose: () => void
}

const PaymentModal: React.FC<PaymentModalProps> = ({ show, mesaName, total, paymentMethod, onSelectMethod, onConfirm, onClose }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-2">💰 Cobrar {mesaName}</h2>
        <p className="text-3xl font-bold text-green-600 mb-6">{formatCOP(total)}</p>

        <label className="block text-sm font-medium text-gray-700 mb-3">Método de pago</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
            <button
              key={m}
              onClick={() => onSelectMethod(m)}
              className={`py-4 px-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                paymentMethod === m
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {m === 'Efectivo' ? '💵' : m === 'Tarjeta' ? '💳' : '📲'} {m}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!paymentMethod}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ✅ Confirmar pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
