import { formatCOP } from '../../utils/format'

interface FruverDashboardData {
  ventasHoy: number
  mermaHoy: number
  gananciaHoy: number
  productosCriticos: Array<{ name: string; code?: string; stock: number; diasRestantes: number }>
}

interface FruverViewProps {
  show: boolean
  fruverDashboard: FruverDashboardData | null
  defaultUnit: string
  onRegisterWaste: () => void
}

export function FruverView({ show, fruverDashboard, defaultUnit, onRegisterWaste }: FruverViewProps) {
  if (!show) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🥬 Fruver Dashboard</h2>
          <p className="text-sm text-gray-500">Hoy estas ganando o perdiendo</p>
        </div>
        <button
          onClick={onRegisterWaste}
          className="py-2 px-4 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 text-sm"
        >
          🗑️ Registrar Merma
        </button>
      </div>

      {fruverDashboard && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 font-semibold">Ventas Hoy</p>
            <p className="text-lg font-bold text-green-700">{formatCOP(fruverDashboard.ventasHoy)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600 font-semibold">Merma Hoy</p>
            <p className="text-lg font-bold text-red-700">{fruverDashboard.mermaHoy.toFixed(1)} {defaultUnit}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 font-semibold">Ganancia Hoy</p>
            <p className={`text-lg font-bold ${fruverDashboard.gananciaHoy >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatCOP(fruverDashboard.gananciaHoy)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-600 font-semibold">Productos Criticos</p>
            <p className="text-lg font-bold text-orange-700">{fruverDashboard.productosCriticos.length}</p>
          </div>
        </div>
      )}

      {fruverDashboard && fruverDashboard.productosCriticos.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-bold text-red-600 mb-3">⚠️ Vende esto hoy o lo pierdes</h3>
          <div className="space-y-2">
            {fruverDashboard.productosCriticos.map((p, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{p.code ? <span className="text-[10px] font-mono text-gray-400 mr-1">[{p.code}]</span> : ''}{p.name}</p>
                  <p className="text-xs text-gray-500">Stock: {(p.stock || 0).toFixed(1)} {defaultUnit}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.diasRestantes <= 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                  {p.diasRestantes <= 0 ? 'VENCIDO' : `${p.diasRestantes} dias`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
