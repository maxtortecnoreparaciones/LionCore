import { Mesa } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface CocinaViewProps {
  mesas: Mesa[]
  onCobrar: (mesa: Mesa) => void
  onUpdateItemStatus: (mesaId: number, itemIndex: number, status: 'pendiente' | 'preparando' | 'listo') => void
}

const CocinaView: React.FC<CocinaViewProps> = ({ mesas, onCobrar, onUpdateItemStatus }) => {
  const pendingMesas = mesas.filter(m => m.status === 'ocupada' || m.status === 'cuenta')

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">👨‍🍳 Órdenes pendientes</h3>
      {pendingMesas.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No hay órdenes pendientes</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingMesas.map(mesa => (
            <div key={mesa.id} className={`rounded-xl p-4 border ${mesa.status === 'cuenta' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-bold text-gray-800">{mesa.name}</p>
                  <p className="text-xs text-gray-500">
                    {Math.floor((Date.now() - new Date(mesa.createdAt).getTime()) / 60000)} min · <span className={`font-semibold capitalize ${mesa.status === 'cuenta' ? 'text-purple-600' : ''}`}>{mesa.status === 'cuenta' ? '🧾 Cuenta' : '🟠 Ocupada'}</span>
                  </p>
                </div>
                <span className={`text-lg font-bold ${mesa.status === 'cuenta' ? 'text-purple-600' : 'text-blue-600'}`}>{formatCOP(mesa.total)}</span>
              </div>
              <div className="space-y-2 mb-3">
                {mesa.orderItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                      <span className="text-gray-600">{formatCOP(item.subtotal)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.status === 'pendiente' || !item.status ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'preparando' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status === 'preparando' ? 'Preparando' : item.status === 'listo' ? 'Listo' : 'Pendiente'}
                      </span>
                      <div className="flex gap-1 ml-auto">
                        {(!item.status || item.status === 'pendiente') && (
                          <button
                            onClick={() => onUpdateItemStatus(mesa.id!, idx, 'preparando')}
                            className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Iniciar
                          </button>
                        )}
                        {item.status === 'preparando' && (
                          <button
                            onClick={() => onUpdateItemStatus(mesa.id!, idx, 'listo')}
                            className="text-xs px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Listo
                          </button>
                        )}
                        {item.status === 'listo' && (
                          <span className="text-xs text-green-600 font-semibold">✅</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {mesa.status === 'cuenta' && (
                <button
                  onClick={() => onCobrar(mesa)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                >
                  💰 Cobrar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CocinaView