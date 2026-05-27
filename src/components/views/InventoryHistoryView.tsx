import { useState, useEffect } from 'react'
import { InventoryHistoryEntry, getInventoryHistory } from '../../services/db'

interface InventoryHistoryViewProps {
  show: boolean
}

export default function InventoryHistoryView({ show }: InventoryHistoryViewProps) {
  const [entries, setEntries] = useState<InventoryHistoryEntry[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    setLoading(true)
    const data = await getInventoryHistory()
    setEntries(data)
    setLoading(false)
  }

  if (!show) return null

  const filtered = filter ? entries.filter(e => e.productName.toLowerCase().includes(filter.toLowerCase()) || (e.code || '').toLowerCase().includes(filter.toLowerCase())) : entries

  const typeLabel = (t: string) => {
    switch (t) {
      case 'compra': return { label: 'Compra', color: 'bg-green-100 text-green-700' }
      case 'venta': return { label: 'Venta', color: 'bg-blue-100 text-blue-700' }
      case 'produccion': return { label: 'Producción', color: 'bg-purple-100 text-purple-700' }
      case 'merma': return { label: 'Merma', color: 'bg-red-100 text-red-700' }
      case 'ajuste': return { label: 'Ajuste', color: 'bg-orange-100 text-orange-700' }
      default: return { label: t, color: 'bg-gray-100 text-gray-700' }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">📜 Historial de Inventario</h2>
        <button onClick={load} className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">↻ Recargar</button>
      </div>

      <div className="p-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por producto o código..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
        />

        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay movimientos de inventario</p>
        ) : (
          <div className="space-y-1">
            {filtered.map(e => {
              const t = typeLabel(e.type)
              return (
                <div key={e.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${t.color}`}>{t.label}</span>
                  <span className="text-xs text-gray-400 shrink-0 w-16">{new Date(e.date).toLocaleDateString('es-CO')}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800">
                      {e.code && <span className="text-[10px] font-mono text-gray-400 mr-1">[{e.code}]</span>}
                      {e.productName}
                    </span>
                  </div>
                  <span className={`font-bold shrink-0 ${e.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {e.quantity > 0 ? '+' : ''}{e.quantity} {e.unit || ''}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 max-w-28 truncate" title={e.desc}>{e.desc}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}