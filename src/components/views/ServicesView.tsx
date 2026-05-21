import { ServiceOrder } from '../../services/db'

interface ServicesViewProps {
  show: boolean
  serviceOrders: ServiceOrder[]
  onNewOrder: () => void
  onUpdateStatus: (orderId: number, status: string) => Promise<void>
  onSendWhatsApp: (phone: string, device: string, price: number) => Promise<void>
}

export default function ServicesView({ show, serviceOrders, onNewOrder, onUpdateStatus, onSendWhatsApp }: ServicesViewProps) {
  if (!show) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🔧 Servicios Técnicos</h2>
          <p className="text-sm text-gray-500">{serviceOrders.length} ordenes</p>
        </div>
        <button
          onClick={onNewOrder}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          + Nueva Orden
        </button>
      </div>

      {serviceOrders.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">🔧</div>
          <p>No hay ordenes de servicio</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {serviceOrders.map(order => (
            <div key={order.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{order.clientName}</h3>
                  <p className="text-sm text-gray-600">{order.device}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.problem}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  order.status === 'recibido' ? 'bg-gray-200 text-gray-700' :
                  order.status === 'en_proceso' ? 'bg-yellow-200 text-yellow-800' :
                  order.status === 'terminado' ? 'bg-green-200 text-green-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              {order.price && (
                <p className="text-sm font-bold text-green-600 mb-2">
                  ${order.price.toLocaleString('es-CO')}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {order.status === 'recibido' && order.id && (
                  <button
                    onClick={() => onUpdateStatus(order.id!, 'en_proceso')}
                    className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    En proceso
                  </button>
                )}
                {order.status === 'en_proceso' && order.id && (
                  <button
                    onClick={() => onUpdateStatus(order.id!, 'terminado')}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Terminado
                  </button>
                )}
                {order.status === 'terminado' && order.id && (
                  <button
                    onClick={async () => {
                      await onUpdateStatus(order.id!, 'entregado')
                      if (order.clientPhone) {
                        await onSendWhatsApp(order.clientPhone, `Servicio ${order.device}`, order.price || 0)
                      }
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Entregar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
