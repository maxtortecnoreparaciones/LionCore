import { Transaction } from '../../services/db'
import { formatDate, getTypeStyle, formatCOP } from '../../utils/format'

interface TransactionWithMeta extends Transaction {
  meta?: Record<string, string>
}

interface HistoryViewProps {
  show: boolean
  transactions: TransactionWithMeta[]
  loadingHistory: boolean
  defaultUnit: string
}

export default function HistoryView({ show, transactions, loadingHistory, defaultUnit }: HistoryViewProps) {
  if (!show) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Historial de Transacciones</h2>
        <p className="text-sm text-gray-500">{transactions.length} transacciones</p>
      </div>

      {loadingHistory ? (
        <div className="p-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No hay transacciones registradas</p>
          <p className="text-gray-400 text-sm">Guarda una transacción para ver el historial</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeStyle(tx.type)}`}>
                  {tx.type.toUpperCase()}
                </span>
                <p className="text-sm text-gray-500 mt-1">{formatDate(tx.date)}</p>
                {tx.type === 'produccion' && tx.meta && (
                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    {tx.meta.peso_entrada && <p>Peso entrada: {tx.meta.peso_entrada}{defaultUnit}</p>}
                    {tx.meta.peso_salida && <p>Peso salida: {tx.meta.peso_salida}{defaultUnit}</p>}
                    {tx.meta.desperdicio && <p>Desperdicio: {tx.meta.desperdicio}{defaultUnit}</p>}
                    {tx.meta.tiempo && <p>Tiempo: {tx.meta.tiempo} min</p>}
                    {tx.meta.notas && <p>Notas: {tx.meta.notas}</p>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">{formatCOP(tx.total)}</p>
                <p className="text-xs text-gray-400">#{tx.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
