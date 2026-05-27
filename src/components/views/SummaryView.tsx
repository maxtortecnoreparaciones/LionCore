import { FinancialSummary, NetProfitSummary } from '../../services/db'
import { formatCOP } from '../../utils/format'

type Period = 'diario' | 'semanal' | 'mensual'

interface SummaryViewProps {
  show: boolean
  summaryPeriod: Period
  onPeriodChange: (p: Period) => void
  loadingSummary: boolean
  summary: FinancialSummary | null
  netProfit: NetProfitSummary | null
  loadingNetProfit: boolean
  todayWow: { ventas: number; ganancia: number } | null
  loadingWow: boolean
}

export default function SummaryView({
  show,
  summaryPeriod,
  onPeriodChange: handlePeriodChange,
  loadingSummary,
  summary,
  netProfit,
  loadingNetProfit,
  todayWow,
  loadingWow,
}: SummaryViewProps) {
  if (!show) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      {todayWow && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 mb-4 border border-emerald-200">
          <h3 className="text-sm font-bold text-emerald-800 mb-2">Hoy</h3>
          <div className="flex gap-4 text-sm">
            <span>Ventas <strong className="text-emerald-600">{loadingWow ? '...' : formatCOP(todayWow.ventas)}</strong></span>
            <span>Ganancia <strong className={todayWow.ganancia >= 0 ? 'text-emerald-600' : 'text-red-600'}>{loadingWow ? '...' : formatCOP(todayWow.ganancia)}</strong></span>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {(['diario', 'semanal', 'mensual'] as const).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold uppercase text-sm transition-all ${
              summaryPeriod === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loadingSummary ? (
        <div className="p-8 text-center text-gray-500">Cargando...</div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-semibold">Entradas</p>
              <p className="text-xl font-bold text-green-700">{formatCOP(summary.entradas)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 font-semibold">Salidas</p>
              <p className="text-xl font-bold text-red-700">{formatCOP(summary.salidas)}</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-sm font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
              <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatCOP(summary.balance)}
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">{summary.transacciones} transacciones</p>

          {netProfit && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-bold text-gray-800 mb-3">Ganancia Real</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold">Ventas</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCOP(netProfit.ventasTotales)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-orange-600 font-semibold">Costo productos</p>
                  <p className="text-lg font-bold text-orange-700">{formatCOP(netProfit.costoProductosVendidos)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600 font-semibold">Gastos + Compras</p>
                  <p className="text-lg font-bold text-purple-700">{formatCOP(netProfit.gastosOperativos + netProfit.comprasMateriaPrima)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${netProfit.gananciaNeta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-xs font-semibold ${netProfit.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>Ganancia Neta</p>
                  <p className={`text-lg font-bold ${netProfit.gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCOP(netProfit.gananciaNeta)}
                  </p>
                  <p className={`text-xs font-bold mt-1 ${netProfit.margenPorcentaje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netProfit.margenPorcentaje.toFixed(1)}% margen
                  </p>
                </div>
              </div>
            </div>
          )}
          {loadingNetProfit && (
            <div className="text-center text-sm text-gray-400">Calculando ganancia...</div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">Sin datos</div>
      )}
    </div>
  )
}
